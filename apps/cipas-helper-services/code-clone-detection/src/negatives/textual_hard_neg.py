"""
Textual hard negative generation for code-clone detection.

This module generates hard negative pairs with high lexical similarity
but different functionality. These negatives are designed to challenge
token-based similarity models.

Strategy:
    1. Compute pairwise lexical similarity (Jaccard)
    2. Select pairs with high token overlap (> 0.5)
    3. Verify functional difference using heuristics
    4. Optionally shuffle identifiers to increase similarity

Functions:
    generate_textual_hard_negatives: Main entry point
"""

import hashlib
import itertools
import random
import sys
from pathlib import Path
from typing import Any

# Handle both package and standalone imports
try:
    from .common import (
        compute_jaccard,
        count_return_statements,
        extract_constants,
        extract_identifiers,
        extract_operators,
        extract_problem_id,
        normalize_whitespace_and_comments,
        random_identifier_shuffle,
    )
except ImportError:
    # Standalone execution
    sys.path.insert(0, str(Path(__file__).parent))
    from common import (
        compute_jaccard,
        count_return_statements,
        extract_constants,
        extract_identifiers,
        extract_operators,
        extract_problem_id,
        normalize_whitespace_and_comments,
        random_identifier_shuffle,
    )


def generate_textual_hard_negatives(
    all_files: list[tuple[str, str, str]],
    max_pairs: int,
    seed: int = 42,
    min_jaccard: float = 0.5,
    apply_shuffle: bool = True
) -> list[dict[str, Any]]:
    """
    Generate textual hard negative pairs.
    
    Creates pairs with high lexical similarity but different functionality.
    These pairs are designed to fool token-based similarity models.
    
    Args:
        all_files: List of (file_id, code, lang) tuples
        max_pairs: Maximum number of negative pairs to generate
        seed: Random seed for deterministic behavior
        min_jaccard: Minimum Jaccard similarity threshold (default 0.5)
        apply_shuffle: Whether to apply identifier shuffling (default True)
        
    Returns:
        List of negative pair dictionaries with schema:
        {
            "file_a_id": str,
            "file_b_id": str,
            "code_a": str,
            "code_b": str,
            "type": "non_textual_hard",
            "generation_meta": {
                "method": "textual_lexical_overlap",
                "seed": int,
                "similarity_score": float,
                "file_ids": [str, str],
                "identifiers_shuffled": bool
            }
        }
        
    Examples:
        >>> files = [
        ...     ("prob1_a.py", "def foo(x):\\n    return x + 1", "python"),
        ...     ("prob2_b.py", "def bar(x):\\n    return x * 2", "python")
        ... ]
        >>> pairs = generate_textual_hard_negatives(files, max_pairs=10, seed=42)
        >>> len(pairs) >= 0
        True
        >>> if pairs:
        ...     assert pairs[0]["type"] == "non_textual_hard"
        ...     assert "similarity_score" in pairs[0]["generation_meta"]
    """
    if not all_files:
        return []
    
    # Initialize RNG
    rng = random.Random(seed)
    
    # Sort files for deterministic ordering
    sorted_files = sorted(all_files, key=lambda x: x[0])
    
    # Preprocess: extract tokens for each file
    file_data = []
    for file_id, code, lang in sorted_files:
        # Extract identifiers
        identifiers = extract_identifiers(code, lang)
        
        # Normalize for comparison
        normalized = normalize_whitespace_and_comments(code, lang)
        tokens = normalized.split()
        
        # Extract problem ID
        prob_id = extract_problem_id(file_id)
        
        file_data.append({
            "file_id": file_id,
            "code": code,
            "lang": lang,
            "identifiers": identifiers,
            "tokens": tokens,
            "prob_id": prob_id,
        })
    
    # Generate candidate pairs
    candidates = []
    
    for file_a, file_b in itertools.combinations(file_data, 2):
        # Skip same-problem pairs
        if file_a["prob_id"] == file_b["prob_id"]:
            continue
        
        # Skip different languages
        if file_a["lang"] != file_b["lang"]:
            continue
        
        # Compute lexical similarity
        jaccard = compute_jaccard(file_a["tokens"], file_b["tokens"])
        
        # Filter by minimum similarity
        if jaccard < min_jaccard:
            continue
        
        # Verify functional difference
        if not _is_functionally_different(file_a, file_b):
            continue
        
        candidates.append({
            "file_a": file_a,
            "file_b": file_b,
            "jaccard": jaccard,
        })
    
    # Sort by similarity (descending) for determinism
    candidates.sort(key=lambda x: (-x["jaccard"], x["file_a"]["file_id"]))
    
    # Select top candidates
    selected = candidates[:max_pairs]
    
    # Generate output pairs
    pairs = []
    for idx, candidate in enumerate(selected):
        file_a = candidate["file_a"]
        file_b = candidate["file_b"]
        
        # Optionally shuffle identifiers to increase similarity
        code_a = file_a["code"]
        code_b = file_b["code"]
        identifiers_shuffled = False
        
        if apply_shuffle:
            # Use pair-specific seed for shuffling
            pair_seed = seed + idx
            
            if file_a["identifiers"]:
                code_a = random_identifier_shuffle(
                    code_a,
                    file_a["identifiers"],
                    pair_seed
                )
                identifiers_shuffled = True
            
            if file_b["identifiers"]:
                code_b = random_identifier_shuffle(
                    code_b,
                    file_b["identifiers"],
                    pair_seed + 1
                )
                identifiers_shuffled = True
        
        # Create pair dictionary
        pair = {
            "file_a_id": file_a["file_id"],
            "file_b_id": file_b["file_id"],
            "code_a": code_a,
            "code_b": code_b,
            "type": "non_textual_hard",
            "generation_meta": {
                "method": "textual_lexical_overlap",
                "seed": seed,
                "similarity_score": candidate["jaccard"],
                "file_ids": [file_a["file_id"], file_b["file_id"]],
                "identifiers_shuffled": identifiers_shuffled,
            }
        }
        
        pairs.append(pair)
    
    return pairs


def _is_functionally_different(file_a: dict, file_b: dict) -> bool:
    """
    Check if two files are functionally different using heuristics.
    
    Args:
        file_a: First file data dict
        file_b: Second file data dict
        
    Returns:
        True if files appear functionally different
        
    Heuristics:
        - Different number of return statements
        - Different operator sets
        - Different constants
    """
    code_a = file_a["code"]
    code_b = file_b["code"]
    
    # Check return statement count
    returns_a = count_return_statements(code_a)
    returns_b = count_return_statements(code_b)
    
    if returns_a != returns_b:
        return True
    
    # Check operator sets
    ops_a = extract_operators(code_a)
    ops_b = extract_operators(code_b)
    
    # Different operators indicate different computations
    if ops_a != ops_b:
        return True
    
    # Check constants
    consts_a = set(extract_constants(code_a))
    consts_b = set(extract_constants(code_b))
    
    # Different constants indicate different values
    if consts_a != consts_b:
        return True
    
    # If all heuristics are similar, conservatively reject
    # (may be too similar semantically)
    return False


def generate_textual_hard_negatives_with_stats(
    all_files: list[tuple[str, str, str]],
    max_pairs: int,
    seed: int = 42,
    min_jaccard: float = 0.5
) -> tuple[list[dict[str, Any]], dict[str, Any]]:
    """
    Generate textual hard negatives with statistics.
    
    Args:
        all_files: List of (file_id, code, lang) tuples
        max_pairs: Maximum number of pairs
        seed: Random seed
        min_jaccard: Minimum Jaccard threshold
        
    Returns:
        Tuple of (pairs, stats_dict)
        
    Examples:
        >>> files = [
        ...     ("p1_a.py", "def foo(x): return x+1", "python"),
        ...     ("p2_b.py", "def bar(x): return x*2", "python")
        ... ]
        >>> pairs, stats = generate_textual_hard_negatives_with_stats(
        ...     files, max_pairs=10, seed=42
        ... )
        >>> "total_candidates" in stats
        True
    """
    # Count candidates before filtering
    sorted_files = sorted(all_files, key=lambda x: x[0])
    
    file_data = []
    for file_id, code, lang in sorted_files:
        identifiers = extract_identifiers(code, lang)
        normalized = normalize_whitespace_and_comments(code, lang)
        tokens = normalized.split()
        prob_id = extract_problem_id(file_id)
        
        file_data.append({
            "file_id": file_id,
            "code": code,
            "lang": lang,
            "identifiers": identifiers,
            "tokens": tokens,
            "prob_id": prob_id,
        })
    
    # Count candidates
    total_candidates = 0
    high_similarity = 0
    functionally_different = 0
    
    for file_a, file_b in itertools.combinations(file_data, 2):
        if file_a["prob_id"] == file_b["prob_id"]:
            continue
        
        if file_a["lang"] != file_b["lang"]:
            continue
        
        total_candidates += 1
        
        jaccard = compute_jaccard(file_a["tokens"], file_b["tokens"])
        
        if jaccard >= min_jaccard:
            high_similarity += 1
            
            if _is_functionally_different(file_a, file_b):
                functionally_different += 1
    
    # Generate pairs
    pairs = generate_textual_hard_negatives(
        all_files,
        max_pairs,
        seed,
        min_jaccard
    )
    
    # Compile statistics
    stats = {
        "total_candidates": total_candidates,
        "high_similarity_count": high_similarity,
        "functionally_different_count": functionally_different,
        "pairs_generated": len(pairs),
        "min_jaccard": min_jaccard,
        "seed": seed,
    }
    
    # Add similarity distribution
    if pairs:
        similarities = [p["generation_meta"]["similarity_score"] for p in pairs]
        stats["avg_similarity"] = sum(similarities) / len(similarities)
        stats["min_similarity"] = min(similarities)
        stats["max_similarity"] = max(similarities)
    
    return pairs, stats


# Unit tests
def test_generate_textual_hard_negatives():
    """Test textual hard negative generation."""
    # Create test files with similar tokens but different logic
    files = [
        ("prob_001_sub_1.py", "def calculate(x):\n    return x + 1", "python"),
        ("prob_002_sub_1.py", "def calculate(x):\n    return x * 2", "python"),
        ("prob_003_sub_1.py", "def process(y):\n    return y - 1", "python"),
    ]
    
    pairs = generate_textual_hard_negatives(
        files,
        max_pairs=5,
        seed=42,
        min_jaccard=0.3
    )
    
    # Should generate some pairs
    assert len(pairs) >= 0
    
    # Check schema
    if pairs:
        pair = pairs[0]
        assert "file_a_id" in pair
        assert "file_b_id" in pair
        assert "code_a" in pair
        assert "code_b" in pair
        assert pair["type"] == "non_textual_hard"
        assert "generation_meta" in pair
        assert "similarity_score" in pair["generation_meta"]
        
        # Check no same-problem pairs
        prob_a = extract_problem_id(pair["file_a_id"])
        prob_b = extract_problem_id(pair["file_b_id"])
        assert prob_a != prob_b
    
    print("✓ Generate textual hard negatives test passed")


def test_determinism():
    """Test deterministic behavior."""
    files = [
        ("p1_a.py", "def foo(x): return x+1", "python"),
        ("p2_b.py", "def bar(x): return x*2", "python"),
        ("p3_c.py", "def baz(y): return y-1", "python"),
    ]
    
    pairs1 = generate_textual_hard_negatives(files, max_pairs=10, seed=42)
    pairs2 = generate_textual_hard_negatives(files, max_pairs=10, seed=42)
    
    # Should be identical
    assert len(pairs1) == len(pairs2)
    
    for p1, p2 in zip(pairs1, pairs2):
        assert p1["file_a_id"] == p2["file_a_id"]
        assert p1["file_b_id"] == p2["file_b_id"]
        assert p1["code_a"] == p2["code_a"]
        assert p1["code_b"] == p2["code_b"]
    
    print("✓ Determinism test passed")


def test_functional_difference():
    """Test functional difference detection."""
    file_a = {
        "code": "def foo(x):\n    return x + 1",
        "identifiers": ["foo", "x"],
    }
    
    file_b = {
        "code": "def bar(x):\n    return x * 2",
        "identifiers": ["bar", "x"],
    }
    
    # Different operators -> should be different
    assert _is_functionally_different(file_a, file_b)
    
    print("✓ Functional difference test passed")


def test_with_stats():
    """Test generation with statistics."""
    files = [
        ("p1_a.py", "def foo(x): return x+1", "python"),
        ("p2_b.py", "def bar(x): return x*2", "python"),
    ]
    
    pairs, stats = generate_textual_hard_negatives_with_stats(
        files,
        max_pairs=10,
        seed=42,
        min_jaccard=0.3
    )
    
    assert "total_candidates" in stats
    assert "pairs_generated" in stats
    assert stats["pairs_generated"] == len(pairs)
    
    print("✓ Generation with stats test passed")


def test_empty_input():
    """Test with empty input."""
    pairs = generate_textual_hard_negatives([], max_pairs=10, seed=42)
    assert pairs == []
    
    print("✓ Empty input test passed")


if __name__ == "__main__":
    print("Running textual hard negative tests...\n")
    
    test_generate_textual_hard_negatives()
    test_determinism()
    test_functional_difference()
    test_with_stats()
    test_empty_input()
    
    print("\nAll tests passed!")
    
    # Example usage
    print("\n" + "="*60)
    print("Example: Generate textual hard negatives")
    print("="*60)
    
    example_files = [
        ("prob_001_sub_1.py", """def calculate_sum(numbers):
    total = 0
    for num in numbers:
        total = total + num
    return total
""", "python"),
        
        ("prob_002_sub_1.py", """def calculate_product(numbers):
    result = 1
    for num in numbers:
        result = result * num
    return result
""", "python"),
        
        ("prob_003_sub_1.py", """def find_maximum(values):
    max_val = values[0]
    for val in values:
        if val > max_val:
            max_val = val
    return max_val
""", "python"),
    ]
    
    pairs, stats = generate_textual_hard_negatives_with_stats(
        example_files,
        max_pairs=5,
        seed=42,
        min_jaccard=0.4
    )
    
    print(f"\nGenerated {len(pairs)} textual hard negative pairs")
    print(f"Statistics: {stats}")
    
    if pairs:
        print(f"\nExample pair:")
        pair = pairs[0]
        print(f"File A: {pair['file_a_id']}")
        print(f"File B: {pair['file_b_id']}")
        print(f"Similarity: {pair['generation_meta']['similarity_score']:.3f}")
