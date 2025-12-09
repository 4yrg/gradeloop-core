"""
Export clone pairs to Parquet format for dataset storage.

This module provides functions to export generated clone pairs to Apache
Parquet format, which is efficient for storing and querying large datasets.

Parquet benefits:
- Columnar storage (efficient compression and querying)
- Schema enforcement
- Fast reading/writing with pandas/polars
- Widely supported (pandas, PyArrow, Spark, DuckDB)

Functions:
    export_pairs: Export pairs to parquet file
    export_with_splits: Export with train/val/test splits
    validate_schema: Validate pair dictionaries against schema
"""

import logging
from pathlib import Path
from typing import Any

import pandas as pd

logger = logging.getLogger(__name__)


def export_pairs(pairs: list[dict[str, Any]], out_path: str) -> str:
    """
    Export clone pairs to Parquet format.
    
    Converts list of pair dictionaries to pandas DataFrame and writes to
    Parquet file. Creates parent directories if they don't exist.
    
    Expected schema:
    - id (str): Unique identifier for the pair
    - lang (str): Programming language
    - file_a_id (str): Identifier for first code snippet
    - file_b_id (str): Identifier for second code snippet
    - code_a (str): First code snippet
    - code_b (str): Second code snippet
    - type (str): Clone type (type1, type2, type3, type4, negatives)
    - generation_meta (str): Metadata about generation (JSON string)
    
    Args:
        pairs: List of pair dictionaries with required fields
        out_path: Output path for parquet file (e.g., "output/clones.parquet")
        
    Returns:
        Output path (same as input out_path)
        
    Raises:
        ValueError: If pairs list is empty
        IOError: If file writing fails
        
    Examples:
        >>> pairs = [
        ...     {
        ...         'id': '001',
        ...         'lang': 'python',
        ...         'file_a_id': 'src_001',
        ...         'file_b_id': 'src_002',
        ...         'code_a': 'def foo(): pass',
        ...         'code_b': 'def foo( ): pass',
        ...         'type': 'type1',
        ...         'generation_meta': '{"seed": 42}'
        ...     }
        ... ]
        >>> export_pairs(pairs, "output/dataset.parquet")
        'output/dataset.parquet'
        
        >>> # Read back the data
        >>> import pandas as pd
        >>> df = pd.read_parquet("output/dataset.parquet")
        >>> len(df)
        1
        >>> df['type'].iloc[0]
        'type1'
    """
    if not pairs:
        raise ValueError("Cannot export empty pairs list")
    
    logger.info(f"Exporting {len(pairs)} pairs to {out_path}")
    
    # Ensure parent directory exists
    out_path_obj = Path(out_path)
    out_path_obj.parent.mkdir(parents=True, exist_ok=True)
    
    # Convert to DataFrame
    df = pd.DataFrame(pairs)
    
    # Ensure expected columns exist (add if missing)
    expected_columns = [
        'id', 'lang', 'file_a_id', 'file_b_id',
        'code_a', 'code_b', 'type', 'generation_meta'
    ]
    
    for col in expected_columns:
        if col not in df.columns:
            logger.warning(f"Column '{col}' not found, adding with None values")
            df[col] = None
    
    # Reorder columns to match schema
    available_columns = [col for col in expected_columns if col in df.columns]
    extra_columns = [col for col in df.columns if col not in expected_columns]
    df = df[available_columns + extra_columns]
    
    # Write to parquet
    try:
        df.to_parquet(
            out_path,
            engine='pyarrow',
            compression='snappy',
            index=False
        )
        logger.info(f"Successfully exported to {out_path}")
        logger.info(f"File size: {out_path_obj.stat().st_size / 1024:.2f} KB")
        
    except Exception as e:
        logger.error(f"Failed to write parquet file: {e}")
        raise IOError(f"Failed to write {out_path}: {e}")
    
    return out_path


def export_with_splits(
    pairs: list[dict[str, Any]],
    out_dir: str,
    train_ratio: float = 0.7,
    val_ratio: float = 0.15,
    test_ratio: float = 0.15,
    seed: int = 42
) -> dict[str, str]:
    """
    Export pairs with train/validation/test splits.
    
    Splits data randomly and exports each split to separate parquet files.
    Ensures deterministic splits using seed.
    
    Args:
        pairs: List of pair dictionaries
        out_dir: Output directory for split files
        train_ratio: Proportion for training set (default: 0.7)
        val_ratio: Proportion for validation set (default: 0.15)
        test_ratio: Proportion for test set (default: 0.15)
        seed: Random seed for deterministic splits
        
    Returns:
        Dictionary with keys 'train', 'val', 'test' mapping to file paths
        
    Examples:
        >>> pairs = [{'id': str(i), 'code_a': f'code_{i}', 'code_b': f'code_{i}'}
        ...          for i in range(100)]
        >>> paths = export_with_splits(pairs, "output/splits")
        >>> 'train' in paths and 'val' in paths and 'test' in paths
        True
    """
    if not pairs:
        raise ValueError("Cannot export empty pairs list")
    
    # Validate ratios
    total_ratio = train_ratio + val_ratio + test_ratio
    if not (0.99 <= total_ratio <= 1.01):  # Allow small floating point errors
        raise ValueError(
            f"Ratios must sum to 1.0, got {total_ratio} "
            f"(train={train_ratio}, val={val_ratio}, test={test_ratio})"
        )
    
    logger.info(
        f"Splitting {len(pairs)} pairs into "
        f"train={train_ratio}, val={val_ratio}, test={test_ratio}"
    )
    
    # Convert to DataFrame for easy splitting
    df = pd.DataFrame(pairs)
    
    # Shuffle with seed for determinism
    df = df.sample(frac=1.0, random_state=seed).reset_index(drop=True)
    
    # Calculate split indices
    n = len(df)
    train_end = int(n * train_ratio)
    val_end = train_end + int(n * val_ratio)
    
    # Split data
    train_df = df.iloc[:train_end]
    val_df = df.iloc[train_end:val_end]
    test_df = df.iloc[val_end:]
    
    logger.info(
        f"Split sizes: train={len(train_df)}, "
        f"val={len(val_df)}, test={len(test_df)}"
    )
    
    # Create output directory
    out_dir_path = Path(out_dir)
    out_dir_path.mkdir(parents=True, exist_ok=True)
    
    # Export each split
    paths = {}
    
    train_path = str(out_dir_path / "train.parquet")
    paths['train'] = export_pairs(train_df.to_dict('records'), train_path)
    
    val_path = str(out_dir_path / "val.parquet")
    paths['val'] = export_pairs(val_df.to_dict('records'), val_path)
    
    test_path = str(out_dir_path / "test.parquet")
    paths['test'] = export_pairs(test_df.to_dict('records'), test_path)
    
    logger.info(f"Exported splits to {out_dir}")
    return paths


def validate_schema(pairs: list[dict[str, Any]]) -> tuple[bool, list[str]]:
    """
    Validate that pairs conform to expected schema.
    
    Checks for required fields and data types.
    
    Args:
        pairs: List of pair dictionaries
        
    Returns:
        Tuple of (is_valid, error_messages)
        
    Examples:
        >>> pairs = [{'id': '1', 'code_a': 'x', 'code_b': 'y', 'type': 'type1'}]
        >>> is_valid, errors = validate_schema(pairs)
        >>> is_valid or len(errors) > 0
        True
    """
    errors = []
    
    if not pairs:
        errors.append("Pairs list is empty")
        return False, errors
    
    required_fields = ['code_a', 'code_b', 'type']
    recommended_fields = ['id', 'lang', 'file_a_id', 'file_b_id', 'generation_meta']
    
    # Check first few pairs for schema
    sample_size = min(10, len(pairs))
    for i, pair in enumerate(pairs[:sample_size]):
        # Check required fields
        for field in required_fields:
            if field not in pair:
                errors.append(f"Pair {i}: Missing required field '{field}'")
        
        # Warn about recommended fields
        for field in recommended_fields:
            if field not in pair:
                logger.warning(f"Pair {i}: Missing recommended field '{field}'")
    
    # Check for consistent keys across all pairs
    if pairs:
        first_keys = set(pairs[0].keys())
        for i, pair in enumerate(pairs[1:], start=1):
            if set(pair.keys()) != first_keys:
                errors.append(
                    f"Pair {i}: Inconsistent keys. "
                    f"Expected {first_keys}, got {set(pair.keys())}"
                )
                break  # Only report first inconsistency
    
    is_valid = len(errors) == 0
    return is_valid, errors


def export_by_language(
    pairs: list[dict[str, Any]],
    out_dir: str,
    filename_prefix: str = "clone_dataset"
) -> dict[str, str]:
    """
    Export pairs to separate Parquet files per language.
    
    Creates one parquet file for each language found in the dataset.
    Useful for multi-language datasets where each language should be
    stored separately.
    
    Args:
        pairs: List of pair dictionaries (must have 'lang' field)
        out_dir: Output directory for language-specific files
        filename_prefix: Prefix for output filenames
        
    Returns:
        Dictionary mapping language -> file path
        
    Raises:
        ValueError: If pairs are empty or missing 'lang' field
        
    Examples:
        >>> pairs = [
        ...     {'id': '1', 'lang': 'python', 'code_a': 'x=1', 'code_b': 'x = 1', 'type': 'type1'},
        ...     {'id': '2', 'lang': 'java', 'code_a': 'int x=1;', 'code_b': 'int x = 1;', 'type': 'type1'}
        ... ]
        >>> paths = export_by_language(pairs, "output/by_language")
        >>> 'python' in paths and 'java' in paths
        True
    """
    if not pairs:
        raise ValueError("Cannot export empty pairs list")
    
    # Check for lang field
    if 'lang' not in pairs[0]:
        raise ValueError("Pairs must have 'lang' field for language-based export")
    
    logger.info(f"Exporting {len(pairs)} pairs by language to {out_dir}")
    
    # Convert to DataFrame for easy grouping
    df = pd.DataFrame(pairs)
    
    # Create output directory
    out_dir_path = Path(out_dir)
    out_dir_path.mkdir(parents=True, exist_ok=True)
    
    # Export each language separately
    paths = {}
    languages = df['lang'].unique()
    
    for lang in languages:
        lang_df = df[df['lang'] == lang]
        lang_pairs = lang_df.to_dict('records')
        
        filename = f"{filename_prefix}_{lang}.parquet"
        file_path = str(out_dir_path / filename)
        
        export_pairs(lang_pairs, file_path)
        paths[lang] = file_path
        
        logger.info(f"Exported {len(lang_pairs)} {lang} pairs to {filename}")
    
    logger.info(f"Exported {len(languages)} languages: {', '.join(languages)}")
    return paths


def export_summary(pairs: list[dict[str, Any]], out_path: str) -> str:
    """
    Export summary statistics to text file.
    
    Creates a human-readable summary of the dataset.
    
    Args:
        pairs: List of pair dictionaries
        out_path: Output path for summary file
        
    Returns:
        Output path
        
    Examples:
        >>> pairs = [{'type': 'type1', 'lang': 'python'}] * 10
        >>> export_summary(pairs, "output/summary.txt")
        'output/summary.txt'
    """
    # Ensure parent directory exists
    out_path_obj = Path(out_path)
    out_path_obj.parent.mkdir(parents=True, exist_ok=True)
    
    # Calculate statistics
    df = pd.DataFrame(pairs)
    
    summary_lines = [
        "=" * 60,
        "DATASET SUMMARY",
        "=" * 60,
        f"\nTotal pairs: {len(df)}",
        ""
    ]
    
    # Count by type
    if 'type' in df.columns:
        summary_lines.append("Pairs by type:")
        type_counts = df['type'].value_counts()
        for clone_type, count in type_counts.items():
            percentage = count / len(df) * 100
            summary_lines.append(f"  {clone_type}: {count} ({percentage:.1f}%)")
        summary_lines.append("")
    
    # Count by language
    if 'lang' in df.columns:
        summary_lines.append("Pairs by language:")
        lang_counts = df['lang'].value_counts()
        for lang, count in lang_counts.items():
            percentage = count / len(df) * 100
            summary_lines.append(f"  {lang}: {count} ({percentage:.1f}%)")
        summary_lines.append("")
    
    # Cross-tabulation
    if 'type' in df.columns and 'lang' in df.columns:
        summary_lines.append("Pairs by type and language:")
        crosstab = pd.crosstab(df['lang'], df['type'])
        summary_lines.append(str(crosstab))
        summary_lines.append("")
    
    # Average code lengths
    if 'code_a' in df.columns and 'code_b' in df.columns:
        avg_len_a = df['code_a'].str.len().mean()
        avg_len_b = df['code_b'].str.len().mean()
        summary_lines.append(f"Average code_a length: {avg_len_a:.1f} chars")
        summary_lines.append(f"Average code_b length: {avg_len_b:.1f} chars")
        summary_lines.append("")
    
    summary_lines.append("=" * 60)
    
    # Write to file
    with open(out_path, 'w', encoding='utf-8') as f:
        f.write('\n'.join(summary_lines))
    
    logger.info(f"Exported summary to {out_path}")
    return out_path


# Unit tests
def test_export_pairs(tmp_path):
    """Test basic export."""
    pairs = [
        {
            'id': '001',
            'lang': 'python',
            'code_a': 'x = 1',
            'code_b': 'x=1',
            'type': 'type1'
        }
    ]
    
    out_path = tmp_path / "test.parquet"
    result = export_pairs(pairs, str(out_path))
    
    assert result == str(out_path)
    assert out_path.exists()
    
    # Read back and verify
    df = pd.read_parquet(out_path)
    assert len(df) == 1
    assert df['type'].iloc[0] == 'type1'
    
    print("✓ Export pairs test passed")


def test_validate_schema():
    """Test schema validation."""
    valid_pairs = [
        {'id': '1', 'code_a': 'x', 'code_b': 'y', 'type': 'type1'}
    ]
    is_valid, errors = validate_schema(valid_pairs)
    assert is_valid
    assert len(errors) == 0
    
    invalid_pairs = [{'code_a': 'x'}]  # Missing code_b and type
    is_valid, errors = validate_schema(invalid_pairs)
    assert not is_valid
    assert len(errors) > 0
    
    print("✓ Schema validation test passed")


def test_empty_pairs():
    """Test empty pairs handling."""
    try:
        export_pairs([], "test.parquet")
        assert False, "Should raise ValueError"
    except ValueError as e:
        assert "empty" in str(e).lower()
    
    print("✓ Empty pairs test passed")


if __name__ == "__main__":
    # Run tests with temporary directory
    print("Running export tests...\n")
    
    import tempfile
    with tempfile.TemporaryDirectory() as tmpdir:
        from pathlib import Path
        tmp_path = Path(tmpdir)
        
        test_export_pairs(tmp_path)
        test_validate_schema()
        test_empty_pairs()
    
    print("\nAll tests passed!")
    
    # Example usage
    print("\n--- Example Usage ---")
    
    example_pairs = [
        {
            'id': '001',
            'lang': 'python',
            'file_a_id': 'prob_001_sub_1',
            'file_b_id': 'prob_001_sub_1_variant',
            'code_a': 'def add(a, b):\n    return a + b',
            'code_b': 'def add(a,b):\n  return a+b',
            'type': 'type1',
            'generation_meta': '{"seed": 42, "transformations": ["indent", "spacing"]}'
        },
        {
            'id': '002',
            'lang': 'python',
            'file_a_id': 'prob_002_sub_1',
            'file_b_id': 'prob_002_sub_2',
            'code_a': 'def multiply(x, y):\n    return x * y',
            'code_b': 'def multiply(a, b):\n    return a * b',
            'type': 'type2',
            'generation_meta': '{"seed": 42, "method": "alpha_rename"}'
        }
    ]
    
    print(f"Example pairs: {len(example_pairs)}")
    print("\nValidating schema...")
    is_valid, errors = validate_schema(example_pairs)
    print(f"Valid: {is_valid}")
    if errors:
        for error in errors:
            print(f"  Error: {error}")
    
    print("\n--- Pipeline Integration ---")
    print("""
# Complete export pipeline

from src.balancing.sampler import balance_and_sample
from src.export.to_parquet import export_pairs, export_with_splits, export_summary
from src.utils.io import read_yaml

# 1. Load configuration
config = read_yaml("configs/clones_config.yaml")

# 2. Generate and balance pairs
all_pairs = generate_all_pairs()  # Your generation logic
balanced_pairs = balance_and_sample(all_pairs, config, seed=42)

# 3. Validate schema
is_valid, errors = validate_schema(balanced_pairs)
if not is_valid:
    print("Schema validation failed:")
    for error in errors:
        print(f"  - {error}")
    exit(1)

# 4. Export to single file
export_pairs(balanced_pairs, "output/clones_dataset.parquet")

# 5. Or export with splits
split_paths = export_with_splits(
    balanced_pairs,
    "output/splits",
    train_ratio=0.7,
    val_ratio=0.15,
    test_ratio=0.15,
    seed=42
)

print(f"Train: {split_paths['train']}")
print(f"Val: {split_paths['val']}")
print(f"Test: {split_paths['test']}")

# 6. Export summary statistics
export_summary(balanced_pairs, "output/dataset_summary.txt")

# 7. Read back data for verification
import pandas as pd
df = pd.read_parquet("output/clones_dataset.parquet")
print(f"Dataset size: {len(df)} pairs")
print(df.groupby(['lang', 'type']).size())
""")
    
    print("\n--- Reading Parquet Files ---")
    print("""
# Using pandas
import pandas as pd
df = pd.read_parquet("output/clones_dataset.parquet")

# Using polars (faster for large datasets)
import polars as pl
df = pl.read_parquet("output/clones_dataset.parquet")

# Using PyArrow
import pyarrow.parquet as pq
table = pq.read_table("output/clones_dataset.parquet")
df = table.to_pandas()

# Using DuckDB (SQL queries on parquet)
import duckdb
result = duckdb.query('''
    SELECT type, COUNT(*) as count
    FROM read_parquet("output/clones_dataset.parquet")
    GROUP BY type
''').to_df()
""")
