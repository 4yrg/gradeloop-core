"""
Easy negative pair generation for code clone detection.

Negative pairs are code snippets that are NOT clones (functionally different).
Easy negatives are pairs from completely different problems, making them
obviously dissimilar. These serve as straightforward negative examples for
training clone detectors.

Types of negatives:
- Easy: Different problems (this module)
- Textual Hard: Same domain, different functionality
- Structural Hard: Similar structure, different semantics

Functions:
    sample_easy_negatives: Sample negative pairs from different problems
    _extract_problem_id: Extract problem identifier from filename
    _group_by_problem: Group files by problem ID
    _sample_cross_problem_pairs: Sample pairs across different problems
"""

import logging
import random
from pathlib import Path
from typing import Any

logger = logging.getLogger(__name__)


def sample_easy_negatives(
    all_files: list[str],
    n: int,
    seed: int = 42
) -> list[tuple[str, str]]:
    """
    Sample easy negative pairs from different problems.
    
    Easy negatives are pairs of code snippets that solve completely different
    problems. They are "easy" because they should be obviously dissimilar to
    any clone detection model.
    
    Algorithm:
    1. Group files by problem ID (extracted from filename)
    2. Randomly sample pairs where both files are from different problems
    3. Use seeded RNG for reproducibility
    
    **Important**: Ensures no pair contains files from the same problem.
    
    Args:
        all_files: List of file paths
        n: Number of negative pairs to sample
        seed: Random seed for deterministic sampling (default: 42)
        
    Returns:
        List of (file_a, file_b) tuples where files are from different problems
        
    Examples:
        >>> files = [
        ...     "prob_001_sub_1.py",
        ...     "prob_001_sub_2.py",
        ...     "prob_002_sub_1.py",
        ...     "prob_003_sub_1.py"
        ... ]
        >>> pairs = sample_easy_negatives(files, n=2, seed=42)
        >>> len(pairs)
        2
        >>> # Each pair should be from different problems
        >>> for file_a, file_b in pairs:
        ...     id_a = _extract_problem_id(Path(file_a).name)
        ...     id_b = _extract_problem_id(Path(file_b).name)
        ...     assert id_a != id_b
    """
    if not all_files:
        logger.warning("Empty file list provided")
        return []
    
    if len(all_files) < 2:
        logger.warning("Need at least 2 files to create pairs")
        return []
    
    # Group files by problem ID
    problem_groups = _group_by_problem(all_files)
    
    if len(problem_groups) < 2:
        logger.warning(
            "Need files from at least 2 different problems. "
            f"Found only {len(problem_groups)} problem(s)."
        )
        return []
    
    logger.info(
        f"Sampling {n} easy negatives from {len(all_files)} files "
        f"across {len(problem_groups)} problems"
    )
    
    # Sample cross-problem pairs
    pairs = _sample_cross_problem_pairs(problem_groups, n, seed)
    
    logger.info(f"Generated {len(pairs)} easy negative pairs")
    return pairs


def _extract_problem_id(filename: str) -> str:
    """
    Extract problem identifier from filename.
    
    Uses same heuristic as type4_mining module:
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


def _group_by_problem(files: list[str]) -> dict[str, list[str]]:
    """
    Group files by problem identifier.
    
    Args:
        files: List of file paths
        
    Returns:
        Dictionary mapping problem_id -> list of file paths
        
    Examples:
        >>> files = ["prob_001_sub_1.py", "prob_001_sub_2.py", "prob_002_sub_1.py"]
        >>> groups = _group_by_problem(files)
        >>> len(groups)
        2
        >>> len(groups["prob_001"])
        2
    """
    groups: dict[str, list[str]] = {}
    
    for filepath in files:
        # Extract filename from path
        filename = Path(filepath).name
        problem_id = _extract_problem_id(filename)
        
        if problem_id not in groups:
            groups[problem_id] = []
        
        groups[problem_id].append(filepath)
    
    return groups


def _sample_cross_problem_pairs(
    problem_groups: dict[str, list[str]],
    n: int,
    seed: int
) -> list[tuple[str, str]]:
    """
    Sample pairs where each pair comes from different problems.
    
    Strategy:
    1. Create list of all problem IDs
    2. For each pair, randomly select two different problems
    3. Randomly select one file from each problem
    4. Repeat until n pairs generated
    
    Args:
        problem_groups: Dictionary of problem_id -> file list
        n: Number of pairs to sample
        seed: Random seed
        
    Returns:
        List of (file_a, file_b) tuples from different problems
    """
    rng = random.Random(seed)
    problem_ids = list(problem_groups.keys())
    
    if len(problem_ids) < 2:
        logger.error("Need at least 2 problems to sample cross-problem pairs")
        return []
    
    pairs = []
    attempts = 0
    max_attempts = n * 10  # Prevent infinite loop
    
    while len(pairs) < n and attempts < max_attempts:
        attempts += 1
        
        # Sample two different problems
        problem_a, problem_b = rng.sample(problem_ids, 2)
        
        # Sample one file from each problem
        file_a = rng.choice(problem_groups[problem_a])
        file_b = rng.choice(problem_groups[problem_b])
        
        # Add pair (avoid duplicates in reverse order)
        pair = (file_a, file_b)
        reverse_pair = (file_b, file_a)
        
        if pair not in pairs and reverse_pair not in pairs:
            pairs.append(pair)
    
    if len(pairs) < n:
        logger.warning(
            f"Could only generate {len(pairs)} pairs (requested {n}). "
            f"May need more files or problems."
        )
    
    return pairs


def sample_easy_negatives_with_stats(
    all_files: list[str],
    n: int,
    seed: int = 42
) -> dict[str, Any]:
    """
    Sample easy negatives and return detailed statistics.
    
    Args:
        all_files: List of file paths
        n: Number of pairs to sample
        seed: Random seed
        
    Returns:
        Dictionary with keys:
            - pairs: List of (file_a, file_b) tuples
            - num_pairs: Number of pairs generated
            - num_files: Total number of files
            - num_problems: Number of unique problems
            - seed: Seed used for sampling
            
    Examples:
        >>> files = ["prob_001_sub_1.py", "prob_002_sub_1.py"]
        >>> result = sample_easy_negatives_with_stats(files, 1, seed=42)
        >>> "pairs" in result
        True
        >>> result["num_problems"]
        2
    """
    problem_groups = _group_by_problem(all_files)
    pairs = sample_easy_negatives(all_files, n, seed)
    
    return {
        "pairs": pairs,
        "num_pairs": len(pairs),
        "num_files": len(all_files),
        "num_problems": len(problem_groups),
        "seed": seed,
        "problem_distribution": {
            pid: len(files) for pid, files in problem_groups.items()
        }
    }


def verify_no_same_problem(pairs: list[tuple[str, str]]) -> bool:
    """
    Verify that no pair contains files from the same problem.
    
    Useful for quality checking sampled negatives.
    
    Args:
        pairs: List of file path pairs
        
    Returns:
        True if all pairs are from different problems, False otherwise
        
    Examples:
        >>> pairs = [("prob_001_sub_1.py", "prob_002_sub_1.py")]
        >>> verify_no_same_problem(pairs)
        True
        >>> bad_pairs = [("prob_001_sub_1.py", "prob_001_sub_2.py")]
        >>> verify_no_same_problem(bad_pairs)
        False
    """
    for file_a, file_b in pairs:
        filename_a = Path(file_a).name
        filename_b = Path(file_b).name
        
        problem_id_a = _extract_problem_id(filename_a)
        problem_id_b = _extract_problem_id(filename_b)
        
        if problem_id_a == problem_id_b:
            logger.error(
                f"Found same-problem pair: {file_a} and {file_b} "
                f"(both from problem {problem_id_a})"
            )
            return False
    
    return True


def balance_problem_sampling(
    all_files: list[str],
    n: int,
    seed: int = 42
) -> list[tuple[str, str]]:
    """
    Sample negatives with balanced problem coverage.
    
    Ensures that pairs are sampled more uniformly across all problem
    combinations, rather than purely random sampling which might oversample
    some problem pairs.
    
    Args:
        all_files: List of file paths
        n: Number of pairs to sample
        seed: Random seed
        
    Returns:
        List of balanced negative pairs
    """
    problem_groups = _group_by_problem(all_files)
    problem_ids = list(problem_groups.keys())
    
    if len(problem_ids) < 2:
        logger.error("Need at least 2 problems")
        return []
    
    rng = random.Random(seed)
    pairs = []
    
    # Generate all possible problem pair combinations
    from itertools import combinations
    problem_pairs = list(combinations(problem_ids, 2))
    
    # Shuffle for randomness
    rng.shuffle(problem_pairs)
    
    # Sample from each problem pair in round-robin fashion
    pair_index = 0
    while len(pairs) < n:
        # Get next problem pair
        prob_a, prob_b = problem_pairs[pair_index % len(problem_pairs)]
        
        # Sample one file from each
        file_a = rng.choice(problem_groups[prob_a])
        file_b = rng.choice(problem_groups[prob_b])
        
        pair = (file_a, file_b)
        reverse_pair = (file_b, file_a)
        
        if pair not in pairs and reverse_pair not in pairs:
            pairs.append(pair)
        
        pair_index += 1
        
        # Prevent infinite loop
        if pair_index > n * 10:
            logger.warning(
                f"Could only generate {len(pairs)} balanced pairs (requested {n})"
            )
            break
    
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


def test_group_by_problem():
    """Test file grouping by problem."""
    files = [
        "prob_001_sub_1.py",
        "prob_001_sub_2.py",
        "prob_002_sub_1.py",
        "prob_003_sub_1.py"
    ]
    
    groups = _group_by_problem(files)
    
    assert len(groups) == 3
    assert len(groups["prob_001"]) == 2
    assert len(groups["prob_002"]) == 1
    assert len(groups["prob_003"]) == 1
    
    print("✓ Group by problem test passed")


def test_sample_easy_negatives():
    """Test negative pair sampling."""
    files = [
        "prob_001_sub_1.py",
        "prob_001_sub_2.py",
        "prob_002_sub_1.py",
        "prob_002_sub_2.py",
        "prob_003_sub_1.py"
    ]
    
    pairs = sample_easy_negatives(files, n=3, seed=42)
    
    assert len(pairs) <= 3
    assert len(pairs) > 0
    
    # Verify all pairs are from different problems
    assert verify_no_same_problem(pairs)
    
    print("✓ Sample easy negatives test passed")


def test_sample_deterministic():
    """Test that sampling is deterministic."""
    files = [
        "prob_001_sub_1.py",
        "prob_002_sub_1.py",
        "prob_003_sub_1.py"
    ]
    
    pairs1 = sample_easy_negatives(files, n=2, seed=42)
    pairs2 = sample_easy_negatives(files, n=2, seed=42)
    
    assert pairs1 == pairs2, "Should be deterministic with same seed"
    
    print("✓ Deterministic sampling test passed")


def test_sample_with_stats():
    """Test sampling with statistics."""
    files = [
        "prob_001_sub_1.py",
        "prob_002_sub_1.py",
        "prob_003_sub_1.py"
    ]
    
    result = sample_easy_negatives_with_stats(files, n=2, seed=42)
    
    assert "pairs" in result
    assert "num_pairs" in result
    assert "num_problems" in result
    assert result["num_problems"] == 3
    assert result["num_files"] == 3
    
    print("✓ Sample with stats test passed")


def test_verify_no_same_problem():
    """Test same-problem verification."""
    good_pairs = [("prob_001_sub_1.py", "prob_002_sub_1.py")]
    assert verify_no_same_problem(good_pairs) == True
    
    bad_pairs = [("prob_001_sub_1.py", "prob_001_sub_2.py")]
    assert verify_no_same_problem(bad_pairs) == False
    
    print("✓ Verify no same problem test passed")


def test_empty_input():
    """Test handling of empty input."""
    assert sample_easy_negatives([], n=5) == []
    assert sample_easy_negatives(["single_file.py"], n=5) == []
    
    print("✓ Empty input test passed")


def test_balance_problem_sampling():
    """Test balanced problem sampling."""
    files = [
        "prob_001_sub_1.py",
        "prob_002_sub_1.py",
        "prob_003_sub_1.py",
        "prob_004_sub_1.py"
    ]
    
    pairs = balance_problem_sampling(files, n=4, seed=42)
    
    assert len(pairs) > 0
    assert verify_no_same_problem(pairs)
    
    print("✓ Balanced sampling test passed")


if __name__ == "__main__":
    # Run tests
    print("Running easy negatives tests...\n")
    
    test_extract_problem_id()
    test_group_by_problem()
    test_sample_easy_negatives()
    test_sample_deterministic()
    test_sample_with_stats()
    test_verify_no_same_problem()
    test_empty_input()
    test_balance_problem_sampling()
    
    print("\nAll tests passed!")
    
    # Example usage
    print("\n--- Example Usage ---")
    print("""
# Sample easy negative pairs for training

files = [
    "prob_001_sub_1.py",  # Sorting problem
    "prob_001_sub_2.py",  # Sorting problem
    "prob_002_sub_1.py",  # Graph traversal
    "prob_002_sub_2.py",  # Graph traversal
    "prob_003_sub_1.py",  # Dynamic programming
    "prob_003_sub_2.py",  # Dynamic programming
]

# Sample 10 negative pairs
negatives = sample_easy_negatives(files, n=10, seed=42)

# Each pair will be from different problems:
# - (prob_001_*.py, prob_002_*.py)  ← sorting vs graph
# - (prob_001_*.py, prob_003_*.py)  ← sorting vs DP
# - (prob_002_*.py, prob_003_*.py)  ← graph vs DP

print(f"Generated {len(negatives)} negative pairs")

# Verify quality
assert verify_no_same_problem(negatives)

# Use in dataset
for file_a, file_b in negatives:
    with open(file_a) as f:
        code_a = f.read()
    with open(file_b) as f:
        code_b = f.read()
    
    # Store as negative example
    dataset.append({
        "code_1": code_a,
        "code_2": code_b,
        "label": 0,  # Not a clone
        "difficulty": "easy"
    })
""")
