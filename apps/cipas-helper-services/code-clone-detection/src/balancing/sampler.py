"""
Dataset balancing and sampling for code clone detection.

This module provides functions to balance and sample clone pairs according to
dataset configuration requirements. Ensures proper distribution across:
- Clone types (Type-1, Type-2, Type-3, Type-4)
- Positive vs negative pairs
- Difficulty levels for negatives
- Language-specific requirements

Functions:
    balance_and_sample: Main sampling function with config-driven selection
    _sample_by_type: Sample pairs by clone type
    _sample_stratified: Stratified sampling within groups
    _get_target_counts: Extract target counts from config
    balance_and_sample_with_stats: Return sampling statistics
"""

import logging
import random
from typing import Any

logger = logging.getLogger(__name__)


def balance_and_sample(
    pairs: list[dict[str, Any]],
    config: dict[str, Any],
    seed: int = 42
) -> list[dict[str, Any]]:
    """
    Balance and sample pairs to meet dataset configuration requirements.
    
    Samples from input pairs to match target counts specified in config.
    Uses deterministic selection based on sorted order and seed for
    reproducibility.
    
    Algorithm:
    1. Extract target counts from config (per type, per language)
    2. Group pairs by 'type' field
    3. For each type, sample up to target count
    4. Use sorted order + seeded RNG for determinism
    5. Log warnings if insufficient pairs available
    
    Args:
        pairs: List of pair dictionaries with 'type' and other metadata
               Expected keys: 'type' (str), 'lang' (str), other fields
        config: Configuration dict from clones_config.yaml
                Expected structure: {
                    'languages': {
                        'java': {'type1': int, 'type2': int, ...},
                        'python': {...}
                    },
                    'balancing': {...}
                }
        seed: Random seed for deterministic sampling (default: 42)
        
    Returns:
        List of sampled pair dictionaries meeting config requirements
        
    Examples:
        >>> pairs = [
        ...     {'type': 'type1', 'lang': 'python', 'code_a': 'x=1', 'code_b': 'x = 1'},
        ...     {'type': 'type1', 'lang': 'python', 'code_a': 'y=2', 'code_b': 'y = 2'},
        ...     {'type': 'type2', 'lang': 'python', 'code_a': 'a=1', 'code_b': 'b=1'}
        ... ]
        >>> config = {
        ...     'languages': {'python': {'type1': 1, 'type2': 1}},
        ...     'balancing': {}
        ... }
        >>> sampled = balance_and_sample(pairs, config, seed=42)
        >>> len(sampled) <= 2
        True
    """
    if not pairs:
        logger.warning("Empty pairs list provided")
        return []
    
    if not config:
        logger.warning("Empty config provided, returning all pairs")
        return pairs
    
    # Extract target counts from config
    target_counts = _get_target_counts(config)
    
    if not target_counts:
        logger.warning("No target counts found in config, returning all pairs")
        return pairs
    
    logger.info(
        f"Balancing {len(pairs)} pairs according to config "
        f"(seed={seed})"
    )
    
    # Group pairs by type and language
    grouped = _group_pairs(pairs)
    
    # Sample from each group
    sampled_pairs = []
    rng = random.Random(seed)
    
    for lang, types_dict in target_counts.items():
        for clone_type, target_count in types_dict.items():
            # Get available pairs for this type and language
            key = (lang, clone_type)
            available = grouped.get(key, [])
            
            if not available:
                logger.warning(
                    f"No pairs available for lang={lang}, type={clone_type}"
                )
                continue
            
            # Sample up to target count
            if len(available) < target_count:
                logger.warning(
                    f"Insufficient pairs for lang={lang}, type={clone_type}: "
                    f"requested {target_count}, available {len(available)}"
                )
                sampled = available  # Take all available
            else:
                # Sort for determinism, then sample
                sorted_available = sorted(
                    available,
                    key=lambda x: (
                        x.get('code_a', ''),
                        x.get('code_b', ''),
                        str(x)
                    )
                )
                sampled = rng.sample(sorted_available, target_count)
            
            sampled_pairs.extend(sampled)
            logger.debug(
                f"Sampled {len(sampled)}/{target_count} pairs for "
                f"lang={lang}, type={clone_type}"
            )
    
    logger.info(f"Total sampled: {len(sampled_pairs)} pairs")
    return sampled_pairs


def _get_target_counts(config: dict[str, Any]) -> dict[str, dict[str, int]]:
    """
    Extract target counts from configuration.
    
    Parses clones_config.yaml structure to get per-language, per-type counts.
    
    Args:
        config: Configuration dictionary
        
    Returns:
        Nested dict: {lang: {type: count}}
        
    Examples:
        >>> config = {
        ...     'languages': {
        ...         'python': {'type1': 50, 'type2': 50},
        ...         'java': {'type1': 50}
        ...     }
        ... }
        >>> counts = _get_target_counts(config)
        >>> counts['python']['type1']
        50
    """
    target_counts = {}
    
    if 'languages' not in config:
        logger.warning("No 'languages' key in config")
        return target_counts
    
    for lang, lang_config in config['languages'].items():
        if not isinstance(lang_config, dict):
            logger.warning(f"Invalid config for language {lang}")
            continue
        
        target_counts[lang] = {}
        
        # Extract type counts (type1, type2, type3, type4, negatives)
        for key, value in lang_config.items():
            if key.startswith('type') or key == 'negatives':
                if isinstance(value, (int, float)):
                    target_counts[lang][key] = int(value)
                elif isinstance(value, dict) and 'count' in value:
                    target_counts[lang][key] = int(value['count'])
    
    return target_counts


def _group_pairs(
    pairs: list[dict[str, Any]]
) -> dict[tuple[str, str], list[dict[str, Any]]]:
    """
    Group pairs by (language, type) key.
    
    Args:
        pairs: List of pair dictionaries
        
    Returns:
        Dictionary mapping (lang, type) -> list of pairs
    """
    grouped = {}
    
    for pair in pairs:
        lang = pair.get('lang', 'unknown')
        clone_type = pair.get('type', 'unknown')
        key = (lang, clone_type)
        
        if key not in grouped:
            grouped[key] = []
        
        grouped[key].append(pair)
    
    return grouped


def balance_and_sample_with_stats(
    pairs: list[dict[str, Any]],
    config: dict[str, Any],
    seed: int = 42
) -> dict[str, Any]:
    """
    Balance and sample pairs with detailed statistics.
    
    Args:
        pairs: List of pair dictionaries
        config: Configuration dictionary
        seed: Random seed
        
    Returns:
        Dictionary with keys:
            - sampled_pairs: List of sampled pairs
            - num_sampled: Total number of sampled pairs
            - num_input: Total number of input pairs
            - target_counts: Target counts from config
            - actual_counts: Actual counts achieved
            - coverage: Percentage of targets met
            - warnings: List of warning messages
            
    Examples:
        >>> pairs = [{'type': 'type1', 'lang': 'python'}]
        >>> config = {'languages': {'python': {'type1': 1}}}
        >>> result = balance_and_sample_with_stats(pairs, config)
        >>> 'sampled_pairs' in result
        True
    """
    warnings = []
    
    # Capture warnings
    original_warning = logger.warning
    def warning_capture(msg):
        warnings.append(msg)
        original_warning(msg)
    
    logger.warning = warning_capture
    
    try:
        sampled = balance_and_sample(pairs, config, seed)
        target_counts = _get_target_counts(config)
        
        # Calculate actual counts
        actual_counts = {}
        for pair in sampled:
            lang = pair.get('lang', 'unknown')
            clone_type = pair.get('type', 'unknown')
            
            if lang not in actual_counts:
                actual_counts[lang] = {}
            if clone_type not in actual_counts[lang]:
                actual_counts[lang][clone_type] = 0
            
            actual_counts[lang][clone_type] += 1
        
        # Calculate coverage
        total_target = sum(
            sum(types.values()) for types in target_counts.values()
        )
        total_actual = len(sampled)
        coverage = (total_actual / total_target * 100) if total_target > 0 else 0.0
        
        return {
            "sampled_pairs": sampled,
            "num_sampled": len(sampled),
            "num_input": len(pairs),
            "target_counts": target_counts,
            "actual_counts": actual_counts,
            "coverage": coverage,
            "warnings": warnings,
            "seed": seed
        }
    
    finally:
        logger.warning = original_warning


def stratified_sample(
    pairs: list[dict[str, Any]],
    strata_key: str,
    samples_per_stratum: int,
    seed: int = 42
) -> list[dict[str, Any]]:
    """
    Perform stratified sampling on pairs.
    
    Ensures balanced sampling across different strata (e.g., difficulty levels,
    problem domains, file sizes).
    
    Args:
        pairs: List of pair dictionaries
        strata_key: Key to group by (e.g., 'difficulty', 'domain')
        samples_per_stratum: Number of samples per stratum
        seed: Random seed
        
    Returns:
        List of sampled pairs
        
    Examples:
        >>> pairs = [
        ...     {'type': 'negative', 'difficulty': 'easy'},
        ...     {'type': 'negative', 'difficulty': 'easy'},
        ...     {'type': 'negative', 'difficulty': 'hard'}
        ... ]
        >>> sampled = stratified_sample(pairs, 'difficulty', 1, seed=42)
        >>> len(sampled) <= 2
        True
    """
    # Group by strata
    strata = {}
    for pair in pairs:
        key = pair.get(strata_key, 'unknown')
        if key not in strata:
            strata[key] = []
        strata[key].append(pair)
    
    # Sample from each stratum
    rng = random.Random(seed)
    sampled = []
    
    for stratum_value, stratum_pairs in strata.items():
        # Sort for determinism
        sorted_pairs = sorted(
            stratum_pairs,
            key=lambda x: str(x)
        )
        
        if len(sorted_pairs) <= samples_per_stratum:
            sampled.extend(sorted_pairs)
        else:
            sampled.extend(rng.sample(sorted_pairs, samples_per_stratum))
        
        logger.debug(
            f"Sampled {min(len(sorted_pairs), samples_per_stratum)} "
            f"from stratum {strata_key}={stratum_value}"
        )
    
    return sampled


def ensure_minimum_per_type(
    pairs: list[dict[str, Any]],
    min_per_type: int = 10
) -> bool:
    """
    Check if minimum number of pairs per type is available.
    
    Args:
        pairs: List of pair dictionaries
        min_per_type: Minimum required pairs per type
        
    Returns:
        True if all types meet minimum, False otherwise
        
    Examples:
        >>> pairs = [
        ...     {'type': 'type1', 'lang': 'python'},
        ...     {'type': 'type1', 'lang': 'python'}
        ... ]
        >>> ensure_minimum_per_type(pairs, min_per_type=1)
        True
        >>> ensure_minimum_per_type(pairs, min_per_type=10)
        False
    """
    grouped = _group_pairs(pairs)
    
    for (lang, clone_type), type_pairs in grouped.items():
        if len(type_pairs) < min_per_type:
            logger.warning(
                f"Insufficient pairs for lang={lang}, type={clone_type}: "
                f"have {len(type_pairs)}, need {min_per_type}"
            )
            return False
    
    return True


# Unit tests
def test_balance_and_sample_basic():
    """Test basic balancing."""
    pairs = [
        {'type': 'type1', 'lang': 'python', 'code_a': 'x=1', 'code_b': 'x = 1'},
        {'type': 'type1', 'lang': 'python', 'code_a': 'y=2', 'code_b': 'y = 2'},
        {'type': 'type2', 'lang': 'python', 'code_a': 'a=1', 'code_b': 'b=1'}
    ]
    config = {
        'languages': {
            'python': {'type1': 1, 'type2': 1}
        }
    }
    
    sampled = balance_and_sample(pairs, config, seed=42)
    assert len(sampled) <= 2
    
    print("✓ Basic balancing test passed")


def test_balance_and_sample_deterministic():
    """Test that sampling is deterministic."""
    pairs = [
        {'type': 'type1', 'lang': 'python', 'code_a': f'x={i}', 'code_b': f'x = {i}'}
        for i in range(10)
    ]
    config = {'languages': {'python': {'type1': 5}}}
    
    sampled1 = balance_and_sample(pairs, config, seed=42)
    sampled2 = balance_and_sample(pairs, config, seed=42)
    
    assert sampled1 == sampled2
    
    print("✓ Deterministic sampling test passed")


def test_get_target_counts():
    """Test target count extraction."""
    config = {
        'languages': {
            'python': {'type1': 50, 'type2': 50},
            'java': {'type1': 30}
        }
    }
    
    counts = _get_target_counts(config)
    assert counts['python']['type1'] == 50
    assert counts['python']['type2'] == 50
    assert counts['java']['type1'] == 30
    
    print("✓ Target counts extraction test passed")


def test_group_pairs():
    """Test pair grouping."""
    pairs = [
        {'type': 'type1', 'lang': 'python'},
        {'type': 'type1', 'lang': 'python'},
        {'type': 'type2', 'lang': 'java'}
    ]
    
    grouped = _group_pairs(pairs)
    assert len(grouped[('python', 'type1')]) == 2
    assert len(grouped[('java', 'type2')]) == 1
    
    print("✓ Pair grouping test passed")


def test_balance_with_stats():
    """Test balancing with statistics."""
    pairs = [
        {'type': 'type1', 'lang': 'python', 'code_a': 'x=1', 'code_b': 'x = 1'}
    ]
    config = {'languages': {'python': {'type1': 1}}}
    
    result = balance_and_sample_with_stats(pairs, config, seed=42)
    
    assert 'sampled_pairs' in result
    assert 'num_sampled' in result
    assert 'coverage' in result
    assert result['num_sampled'] == 1
    
    print("✓ Balance with stats test passed")


def test_stratified_sample():
    """Test stratified sampling."""
    pairs = [
        {'type': 'negative', 'difficulty': 'easy'},
        {'type': 'negative', 'difficulty': 'easy'},
        {'type': 'negative', 'difficulty': 'hard'},
        {'type': 'negative', 'difficulty': 'hard'}
    ]
    
    sampled = stratified_sample(pairs, 'difficulty', 1, seed=42)
    assert len(sampled) == 2
    
    print("✓ Stratified sampling test passed")


def test_ensure_minimum():
    """Test minimum requirement checking."""
    pairs = [
        {'type': 'type1', 'lang': 'python'},
        {'type': 'type1', 'lang': 'python'}
    ]
    
    assert ensure_minimum_per_type(pairs, min_per_type=1) == True
    assert ensure_minimum_per_type(pairs, min_per_type=10) == False
    
    print("✓ Minimum requirement test passed")


def test_empty_input():
    """Test empty input handling."""
    assert balance_and_sample([], {}, seed=42) == []
    
    pairs = [{'type': 'type1', 'lang': 'python'}]
    assert balance_and_sample(pairs, {}, seed=42) == pairs
    
    print("✓ Empty input test passed")


if __name__ == "__main__":
    # Run tests
    print("Running balancing and sampling tests...\n")
    
    test_balance_and_sample_basic()
    test_balance_and_sample_deterministic()
    test_get_target_counts()
    test_group_pairs()
    test_balance_with_stats()
    test_stratified_sample()
    test_ensure_minimum()
    test_empty_input()
    
    print("\nAll tests passed!")
    
    # Example usage
    print("\n--- Example Usage ---")
    print("""
# Example configuration (from clones_config.yaml)
config = {
    'languages': {
        'java': {
            'type1': 50,
            'type2': 50,
            'type3': 50,
            'type4': 50,
            'negatives': 200
        },
        'python': {
            'type1': 50,
            'type2': 50,
            'type3': 50,
            'type4': 50,
            'negatives': 200
        }
    },
    'balancing': {
        'pos_to_neg_ratio': 1.0
    }
}

# Generated pairs (from previous pipeline steps)
pairs = [
    {'type': 'type1', 'lang': 'java', 'code_a': '...', 'code_b': '...'},
    {'type': 'type1', 'lang': 'java', 'code_a': '...', 'code_b': '...'},
    # ... more pairs ...
    {'type': 'negatives', 'lang': 'python', 'difficulty': 'easy', ...},
]

# Balance and sample according to config
sampled_pairs = balance_and_sample(pairs, config, seed=42)

print(f"Input: {len(pairs)} pairs")
print(f"Output: {len(sampled_pairs)} pairs")

# With statistics
result = balance_and_sample_with_stats(pairs, config, seed=42)
print(f"Coverage: {result['coverage']:.1f}%")
print(f"Warnings: {len(result['warnings'])}")

# Check actual vs target counts
for lang, types in result['actual_counts'].items():
    print(f"\\n{lang}:")
    for clone_type, count in types.items():
        target = result['target_counts'][lang][clone_type]
        print(f"  {clone_type}: {count}/{target}")
""")
    
    print("\n--- Pipeline Integration ---")
    print("""
# Complete pipeline example

from src.generation.type1 import produce_type1_variant
from src.generation.type2 import alpha_rename
from src.negatives.easy_negatives import sample_easy_negatives
from src.balancing.sampler import balance_and_sample
from src.utils.io import read_yaml

# 1. Load configuration
config = read_yaml("configs/clones_config.yaml")

# 2. Generate positive pairs
all_pairs = []

# Type-1 clones
for original in originals:
    variant = produce_type1_variant(original, lang)
    all_pairs.append({
        'type': 'type1',
        'lang': lang,
        'code_a': original,
        'code_b': variant
    })

# Type-2 clones
for original in originals:
    renamed = alpha_rename(original, lang)
    all_pairs.append({
        'type': 'type2',
        'lang': lang,
        'code_a': original,
        'code_b': renamed
    })

# 3. Generate negative pairs
negative_pairs = sample_easy_negatives(all_files, n=1000)
for file_a, file_b in negative_pairs:
    all_pairs.append({
        'type': 'negatives',
        'lang': lang,
        'difficulty': 'easy',
        'code_a': read_file(file_a),
        'code_b': read_file(file_b)
    })

# 4. Balance and sample according to config
final_pairs = balance_and_sample(all_pairs, config, seed=42)

print(f"Generated {len(all_pairs)} total pairs")
print(f"Sampled {len(final_pairs)} final pairs for dataset")
""")
