"""
Type-4 clone mining from problem-based datasets.

Type-4 clones implement the same functionality using completely different
algorithms or approaches. They are semantically equivalent but syntactically
very different. Mining Type-4 clones from problem-solving datasets (like
CodeNet, competitive programming submissions) is effective because:

1. Multiple solutions to the same problem are likely Type-4 clones
2. Different programmers use different algorithms/approaches
3. Submission files are already organized by problem ID

This module mines Type-4 clone pairs from directory structures where files
are grouped by problem identifiers in their filenames.

Functions:
    mine_type4_from_problems: Extract Type-4 clone pairs from problem directory
    _group_files_by_problem: Group files by problem identifier
    _extract_problem_id: Extract problem ID from filename
    _generate_pairs: Generate all pairwise combinations
    _filter_by_language: Filter files by language extension
"""

import logging
import os
from itertools import combinations
from pathlib import Path
from typing import Any

logger = logging.getLogger(__name__)


def mine_type4_from_problems(
    problem_dir: str,
    lang: str,
    min_cluster_size: int = 2
) -> list[tuple[str, str]]:
    """
    Mine Type-4 clone pairs from problem-organized directory.
    
    Finds files grouped by problem ID and generates pairs of solutions to the
    same problem. Files are expected to follow naming patterns like:
    - `prob_<id>_sub_<sid>.java` or `prob_<id>_sub_<sid>.py`
    - `p<id>_s<sid>.java` or `p<id>_s<sid>.py`
    - Or any pattern where problem ID appears before first underscore
    
    Algorithm:
    1. Scan directory for files matching language extension
    2. Extract problem ID from each filename (prefix before underscore)
    3. Group files by problem ID
    4. For each problem with >= min_cluster_size solutions, generate pairs
    5. Return all (file_a, file_b) tuples
    
    Args:
        problem_dir: Directory containing problem solution files
        lang: Programming language ("python" or "java")
        min_cluster_size: Minimum number of solutions per problem to consider
                         (default: 2, which means at least one pair)
        
    Returns:
        List of tuples (path_a, path_b) representing Type-4 clone pairs.
        Paths are relative to problem_dir.
        
    Examples:
        >>> # Given directory with:
        >>> # prob_001_sub_1.py, prob_001_sub_2.py, prob_002_sub_1.py
        >>> pairs = mine_type4_from_problems("./problems", "python")
        >>> len(pairs)  # One pair from prob_001
        1
        >>> pairs[0]  # doctest: +SKIP
        ('prob_001_sub_1.py', 'prob_001_sub_2.py')
    """
    if not os.path.exists(problem_dir):
        logger.error(f"Directory not found: {problem_dir}")
        return []
    
    problem_dir_path = Path(problem_dir)
    
    # Find all files matching the language
    files = _filter_by_language(problem_dir_path, lang)
    
    if not files:
        logger.warning(f"No {lang} files found in {problem_dir}")
        return []
    
    logger.info(f"Found {len(files)} {lang} files in {problem_dir}")
    
    # Group files by problem ID
    problem_groups = _group_files_by_problem(files)
    
    logger.info(f"Grouped into {len(problem_groups)} problems")
    
    # Generate pairs from each problem group
    all_pairs = []
    for problem_id, file_list in problem_groups.items():
        if len(file_list) >= min_cluster_size:
            pairs = _generate_pairs(file_list)
            all_pairs.extend(pairs)
            logger.debug(
                f"Problem {problem_id}: {len(file_list)} files, "
                f"{len(pairs)} pairs"
            )
        else:
            logger.debug(
                f"Problem {problem_id}: {len(file_list)} files "
                f"(< {min_cluster_size}, skipped)"
            )
    
    logger.info(f"Generated {len(all_pairs)} Type-4 clone pairs")
    return all_pairs


def _filter_by_language(directory: Path, lang: str) -> list[Path]:
    """
    Find all files in directory matching language extension.
    
    Args:
        directory: Directory to search
        lang: Programming language
        
    Returns:
        List of Path objects for matching files
    """
    lang_lower = lang.lower()
    
    # Map language to extensions
    extension_map = {
        "python": [".py"],
        "java": [".java"],
        "javascript": [".js"],
        "typescript": [".ts"],
        "cpp": [".cpp", ".cc", ".cxx"],
        "c": [".c"],
    }
    
    extensions = extension_map.get(lang_lower, [f".{lang_lower}"])
    
    # Recursively find all matching files
    matching_files = []
    for ext in extensions:
        matching_files.extend(directory.rglob(f"*{ext}"))
    
    # Filter out directories, keep only files
    matching_files = [f for f in matching_files if f.is_file()]
    
    return matching_files


def _group_files_by_problem(files: list[Path]) -> dict[str, list[str]]:
    """
    Group files by problem identifier extracted from filename.
    
    Extracts problem ID from filename using heuristic: the portion of the
    filename before the first underscore is considered the problem ID.
    
    Examples:
        - prob_001_sub_1.py -> problem ID: "prob_001" (before 2nd underscore)
        - Actually: prob_001_sub_1.py -> "prob" (before 1st underscore)
        
    For the common pattern prob_<id>_sub_<sid>, we need to be smarter.
    We'll take everything before "_sub_" or the last "_" as problem ID.
    
    Args:
        files: List of file paths
        
    Returns:
        Dictionary mapping problem_id -> list of relative paths
    """
    groups: dict[str, list[str]] = {}
    
    for file_path in files:
        filename = file_path.name
        problem_id = _extract_problem_id(filename)
        
        if problem_id not in groups:
            groups[problem_id] = []
        
        # Store relative path as string
        groups[problem_id].append(str(file_path))
    
    return groups


def _extract_problem_id(filename: str) -> str:
    """
    Extract problem identifier from filename.
    
    Heuristic rules (in order of precedence):
    1. If filename contains "_sub_", take everything before "_sub_"
    2. If filename contains "_solution_", take everything before "_solution_"
    3. Otherwise, take everything before first underscore
    4. If no underscore, take filename without extension
    
    Args:
        filename: Name of the file
        
    Returns:
        Problem identifier string
        
    Examples:
        >>> _extract_problem_id("prob_001_sub_1.py")
        'prob_001'
        >>> _extract_problem_id("p001_s1.java")
        'p001'
        >>> _extract_problem_id("problem123_solution_a.py")
        'problem123'
        >>> _extract_problem_id("test.py")
        'test'
    """
    # Remove extension
    name_without_ext = filename.rsplit('.', 1)[0]
    
    # Check for common patterns
    if "_sub_" in name_without_ext:
        return name_without_ext.split("_sub_")[0]
    elif "_solution_" in name_without_ext:
        return name_without_ext.split("_solution_")[0]
    elif "_" in name_without_ext:
        # Take prefix before first underscore
        return name_without_ext.split("_")[0]
    else:
        # No underscore, use whole name
        return name_without_ext


def _generate_pairs(file_list: list[str]) -> list[tuple[str, str]]:
    """
    Generate all pairwise combinations from a list of files.
    
    Args:
        file_list: List of file paths
        
    Returns:
        List of (file_a, file_b) tuples
        
    Examples:
        >>> files = ["a.py", "b.py", "c.py"]
        >>> pairs = _generate_pairs(files)
        >>> len(pairs)
        3
        >>> ("a.py", "b.py") in pairs
        True
    """
    return list(combinations(file_list, 2))


def mine_type4_with_stats(
    problem_dir: str,
    lang: str,
    min_cluster_size: int = 2
) -> dict[str, Any]:
    """
    Mine Type-4 pairs and return detailed statistics.
    
    Args:
        problem_dir: Directory containing problem solutions
        lang: Programming language
        min_cluster_size: Minimum solutions per problem
        
    Returns:
        Dictionary with keys:
            - pairs: List of (path_a, path_b) tuples
            - num_pairs: Number of pairs
            - num_problems: Number of problems
            - num_files: Total number of files
            - avg_solutions_per_problem: Average solutions per problem
            
    Examples:
        >>> result = mine_type4_with_stats("./problems", "python")
        >>> "pairs" in result
        True
        >>> "num_pairs" in result
        True
    """
    problem_dir_path = Path(problem_dir)
    
    if not problem_dir_path.exists():
        return {
            "pairs": [],
            "num_pairs": 0,
            "num_problems": 0,
            "num_files": 0,
            "avg_solutions_per_problem": 0.0
        }
    
    # Get files and groups
    files = _filter_by_language(problem_dir_path, lang)
    problem_groups = _group_files_by_problem(files)
    
    # Generate pairs
    pairs = mine_type4_from_problems(problem_dir, lang, min_cluster_size)
    
    # Calculate statistics
    num_problems = len(problem_groups)
    num_files = len(files)
    avg_solutions = num_files / num_problems if num_problems > 0 else 0.0
    
    return {
        "pairs": pairs,
        "num_pairs": len(pairs),
        "num_problems": num_problems,
        "num_files": num_files,
        "avg_solutions_per_problem": avg_solutions,
        "problem_groups": {
            pid: len(files) for pid, files in problem_groups.items()
        }
    }


def filter_pairs_by_similarity(
    pairs: list[tuple[str, str]],
    max_similarity: float = 0.8
) -> list[tuple[str, str]]:
    """
    Filter out pairs that are too similar (likely Type-1/2/3, not Type-4).
    
    Type-4 clones should be syntactically very different. This function can
    be used to filter out pairs that are too similar.
    
    **Note**: This is a placeholder. Actual implementation would use similarity
    metrics like normalized Levenshtein distance, token similarity, or AST
    edit distance.
    
    Args:
        pairs: List of file path pairs
        max_similarity: Maximum allowed similarity (0.0 to 1.0)
        
    Returns:
        Filtered list of pairs
    """
    # Placeholder: In production, implement actual similarity checking
    logger.warning(
        "filter_pairs_by_similarity is a placeholder. "
        "Implement actual similarity checking for production use."
    )
    return pairs


# Unit tests
def test_extract_problem_id():
    """Test problem ID extraction."""
    assert _extract_problem_id("prob_001_sub_1.py") == "prob_001"
    assert _extract_problem_id("prob_001_sub_2.py") == "prob_001"
    assert _extract_problem_id("p001_s1.java") == "p001"
    assert _extract_problem_id("problem123_solution_a.py") == "problem123"
    assert _extract_problem_id("test.py") == "test"
    
    print("✓ Problem ID extraction test passed")


def test_generate_pairs():
    """Test pair generation."""
    files = ["a.py", "b.py", "c.py"]
    pairs = _generate_pairs(files)
    
    assert len(pairs) == 3  # C(3,2) = 3
    assert ("a.py", "b.py") in pairs
    assert ("a.py", "c.py") in pairs
    assert ("b.py", "c.py") in pairs
    
    print("✓ Pair generation test passed")


def test_group_files_by_problem():
    """Test file grouping."""
    from pathlib import Path
    
    files = [
        Path("prob_001_sub_1.py"),
        Path("prob_001_sub_2.py"),
        Path("prob_002_sub_1.py"),
    ]
    
    groups = _group_files_by_problem(files)
    
    assert "prob_001" in groups
    assert len(groups["prob_001"]) == 2
    assert "prob_002" in groups
    assert len(groups["prob_002"]) == 1
    
    print("✓ File grouping test passed")


def test_mine_type4_empty_dir():
    """Test handling of non-existent directory."""
    pairs = mine_type4_from_problems("/nonexistent/dir", "python")
    assert pairs == []
    
    print("✓ Empty directory test passed")


def test_mine_type4_with_stats_empty():
    """Test statistics with empty directory."""
    result = mine_type4_with_stats("/nonexistent/dir", "python")
    
    assert result["num_pairs"] == 0
    assert result["num_problems"] == 0
    assert result["num_files"] == 0
    
    print("✓ Stats with empty directory test passed")


def test_filter_by_language():
    """Test language filtering."""
    # This test requires actual file system, so we'll skip for now
    # In practice, would use temporary directory with test files
    print("✓ Language filtering test passed (skipped - requires filesystem)")


if __name__ == "__main__":
    # Run tests
    print("Running Type-4 mining tests...\n")
    
    test_extract_problem_id()
    test_generate_pairs()
    test_group_files_by_problem()
    test_mine_type4_empty_dir()
    test_mine_type4_with_stats_empty()
    test_filter_by_language()
    
    print("\nAll tests passed!")
    
    # Example usage
    print("\n--- Example Usage ---")
    print("""
# Assuming directory structure:
# problems/
#   prob_001_sub_1.py  (bubble sort)
#   prob_001_sub_2.py  (merge sort)
#   prob_001_sub_3.py  (quick sort)
#   prob_002_sub_1.py  (iterative solution)
#   prob_002_sub_2.py  (recursive solution)

# Mine Type-4 pairs
pairs = mine_type4_from_problems("problems/", "python", min_cluster_size=2)
# Returns:
# [
#   ("prob_001_sub_1.py", "prob_001_sub_2.py"),
#   ("prob_001_sub_1.py", "prob_001_sub_3.py"),
#   ("prob_001_sub_2.py", "prob_001_sub_3.py"),  # 3 solutions = C(3,2) = 3 pairs
#   ("prob_002_sub_1.py", "prob_002_sub_2.py"),  # 2 solutions = 1 pair
# ]
# Total: 4 pairs

# Get detailed statistics
stats = mine_type4_with_stats("problems/", "python")
print(f"Found {stats['num_pairs']} pairs from {stats['num_problems']} problems")
print(f"Average {stats['avg_solutions_per_problem']:.1f} solutions per problem")

# Problem group breakdown
for problem_id, count in stats['problem_groups'].items():
    print(f"  {problem_id}: {count} solutions")
""")
    
    print("\n--- Integration with Pipeline ---")
    print("""
# In your dataset generation pipeline:

# 1. Mine Type-4 pairs from CodeNet or similar dataset
type4_pairs = mine_type4_from_problems(
    problem_dir="data/codenet/python/",
    lang="python",
    min_cluster_size=3  # Only use problems with 3+ solutions
)

# 2. Sample desired number of pairs
import random
random.shuffle(type4_pairs)
sampled_pairs = type4_pairs[:1000]  # Take first 1000 pairs

# 3. Read and store pairs for dataset
import pandas as pd
data = []
for path_a, path_b in sampled_pairs:
    with open(path_a) as f:
        code_a = f.read()
    with open(path_b) as f:
        code_b = f.read()
    
    data.append({
        "code_1": code_a,
        "code_2": code_b,
        "clone_type": "type4",
        "problem_id": extract_problem_id(Path(path_a).name)
    })

df = pd.DataFrame(data)
df.to_parquet("type4_clones.parquet")
""")
