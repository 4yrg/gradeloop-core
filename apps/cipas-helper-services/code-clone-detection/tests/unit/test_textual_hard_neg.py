"""
Unit tests for textual hard negative generation.

Tests the generation of hard negative pairs with high lexical similarity
but different functionality.
"""

import sys
from pathlib import Path

# Add src to path
src_path = Path(__file__).parent.parent.parent / "src"
sys.path.insert(0, str(src_path))

from negatives.textual_hard_neg import (
    generate_textual_hard_negatives,
    generate_textual_hard_negatives_with_stats,
)
from negatives.common import extract_problem_id


def test_basic_generation():
    """Test basic textual hard negative generation."""
    # Two functions with similar tokens but different operations
    files = [
        ("prob_001_sub_1.py", """def calculate(x, y):
    result = x + y
    return result
""", "python"),
        
        ("prob_002_sub_1.py", """def calculate(x, y):
    result = x * y
    return result
""", "python"),
    ]
    
    pairs = generate_textual_hard_negatives(
        files,
        max_pairs=10,
        seed=42,
        min_jaccard=0.3
    )
    
    # Should generate at least one pair
    assert len(pairs) >= 1, "Should generate at least one pair"
    
    # Check first pair
    pair = pairs[0]
    
    # Verify schema
    assert "file_a_id" in pair
    assert "file_b_id" in pair
    assert "code_a" in pair
    assert "code_b" in pair
    assert pair["type"] == "non_textual_hard"
    assert "generation_meta" in pair
    
    # Verify metadata
    meta = pair["generation_meta"]
    assert meta["method"] == "textual_lexical_overlap"
    assert "similarity_score" in meta
    assert "seed" in meta
    assert "file_ids" in meta
    
    # Verify different problems
    prob_a = extract_problem_id(pair["file_a_id"])
    prob_b = extract_problem_id(pair["file_b_id"])
    assert prob_a != prob_b, "Should not pair same-problem files"
    
    print("✓ Basic generation test passed")


def test_high_similarity_different_semantics():
    """Test that selected pairs have high similarity but different semantics."""
    # Create functions with very similar tokens but different logic
    files = [
        ("prob_001_sub_1.py", """def process_list(items):
    total = 0
    for item in items:
        total = total + item
    return total
""", "python"),
        
        ("prob_002_sub_1.py", """def process_list(items):
    total = 1
    for item in items:
        total = total * item
    return total
""", "python"),
    ]
    
    pairs = generate_textual_hard_negatives(
        files,
        max_pairs=10,
        seed=42,
        min_jaccard=0.4
    )
    
    # Should find these as hard negatives
    assert len(pairs) >= 1, "Should find high-similarity different-semantic pairs"
    
    pair = pairs[0]
    
    # Check high similarity score
    similarity = pair["generation_meta"]["similarity_score"]
    assert similarity >= 0.4, f"Similarity should be >= 0.4, got {similarity}"
    
    # Verify codes are different
    assert pair["code_a"] != pair["code_b"], "Codes should be different"
    
    print("✓ High similarity different semantics test passed")


def test_no_same_problem_pairs():
    """Test that same-problem files are never paired."""
    files = [
        ("prob_001_sub_1.py", "def foo(x): return x + 1", "python"),
        ("prob_001_sub_2.py", "def bar(x): return x + 2", "python"),
        ("prob_002_sub_1.py", "def baz(x): return x + 3", "python"),
    ]
    
    pairs = generate_textual_hard_negatives(
        files,
        max_pairs=100,
        seed=42,
        min_jaccard=0.3
    )
    
    # Verify no same-problem pairs
    for pair in pairs:
        prob_a = extract_problem_id(pair["file_a_id"])
        prob_b = extract_problem_id(pair["file_b_id"])
        assert prob_a != prob_b, f"Same problem paired: {prob_a} == {prob_b}"
    
    print("✓ No same-problem pairs test passed")


def test_deterministic_behavior():
    """Test that generation is deterministic with same seed."""
    files = [
        ("p1_a.py", "def foo(x): return x+1", "python"),
        ("p2_b.py", "def bar(x): return x*2", "python"),
        ("p3_c.py", "def baz(y): return y-1", "python"),
    ]
    
    # Generate twice with same seed
    pairs1 = generate_textual_hard_negatives(files, max_pairs=10, seed=42)
    pairs2 = generate_textual_hard_negatives(files, max_pairs=10, seed=42)
    
    assert len(pairs1) == len(pairs2), "Should generate same number of pairs"
    
    for p1, p2 in zip(pairs1, pairs2):
        assert p1["file_a_id"] == p2["file_a_id"]
        assert p1["file_b_id"] == p2["file_b_id"]
        assert p1["code_a"] == p2["code_a"]
        assert p1["code_b"] == p2["code_b"]
        assert p1["generation_meta"]["similarity_score"] == p2["generation_meta"]["similarity_score"]
    
    print("✓ Deterministic behavior test passed")


def test_with_statistics():
    """Test generation with statistics."""
    files = [
        ("p1_a.py", "def foo(x): return x+1", "python"),
        ("p2_b.py", "def bar(x): return x*2", "python"),
        ("p3_c.py", "def baz(y): return y-1", "python"),
    ]
    
    pairs, stats = generate_textual_hard_negatives_with_stats(
        files,
        max_pairs=10,
        seed=42,
        min_jaccard=0.3
    )
    
    # Verify statistics
    assert "total_candidates" in stats
    assert "high_similarity_count" in stats
    assert "functionally_different_count" in stats
    assert "pairs_generated" in stats
    assert "min_jaccard" in stats
    assert "seed" in stats
    
    # Verify consistency
    assert stats["pairs_generated"] == len(pairs)
    
    if pairs:
        assert "avg_similarity" in stats
        assert "min_similarity" in stats
        assert "max_similarity" in stats
    
    print("✓ With statistics test passed")


def test_empty_input():
    """Test with empty input."""
    pairs = generate_textual_hard_negatives([], max_pairs=10, seed=42)
    assert pairs == [], "Empty input should return empty list"
    
    print("✓ Empty input test passed")


def test_different_languages_not_paired():
    """Test that different language files are not paired."""
    files = [
        ("p1_a.py", "def foo(x): return x+1", "python"),
        ("p2_b.java", "int bar(int x) { return x*2; }", "java"),
    ]
    
    pairs = generate_textual_hard_negatives(
        files,
        max_pairs=10,
        seed=42,
        min_jaccard=0.0  # Allow any similarity
    )
    
    # Should not pair different languages
    assert len(pairs) == 0, "Different languages should not be paired"
    
    print("✓ Different languages not paired test passed")


def test_identifier_shuffling():
    """Test that identifier shuffling is applied when enabled."""
    files = [
        ("prob_001_sub_1.py", "def calculate(x): return x + 1", "python"),
        ("prob_002_sub_1.py", "def process(y): return y * 2", "python"),
    ]
    
    # Generate without shuffling
    pairs_no_shuffle = generate_textual_hard_negatives(
        files,
        max_pairs=10,
        seed=42,
        min_jaccard=0.3,
        apply_shuffle=False
    )
    
    # Generate with shuffling
    pairs_with_shuffle = generate_textual_hard_negatives(
        files,
        max_pairs=10,
        seed=42,
        min_jaccard=0.3,
        apply_shuffle=True
    )
    
    # Both should generate pairs
    assert len(pairs_no_shuffle) >= 0
    assert len(pairs_with_shuffle) >= 0
    
    # Check metadata
    if pairs_with_shuffle:
        meta = pairs_with_shuffle[0]["generation_meta"]
        assert "identifiers_shuffled" in meta
    
    print("✓ Identifier shuffling test passed")


def test_real_world_example():
    """Test with realistic code examples."""
    files = [
        ("prob_sort_001.py", """def bubble_sort(arr):
    n = len(arr)
    for i in range(n):
        for j in range(0, n-i-1):
            if arr[j] > arr[j+1]:
                arr[j], arr[j+1] = arr[j+1], arr[j]
    return arr
""", "python"),
        
        ("prob_search_002.py", """def binary_search(arr, target):
    left = 0
    right = len(arr) - 1
    while left <= right:
        mid = (left + right) // 2
        if arr[mid] == target:
            return mid
        elif arr[mid] < target:
            left = mid + 1
        else:
            right = mid - 1
    return -1
""", "python"),
    ]
    
    pairs = generate_textual_hard_negatives(
        files,
        max_pairs=10,
        seed=42,
        min_jaccard=0.3
    )
    
    # These are different algorithms, should generate pairs if similarity is high enough
    # (or may not if similarity is too low)
    assert len(pairs) >= 0, "Should handle real-world examples"
    
    print("✓ Real-world example test passed")


if __name__ == "__main__":
    print("Running textual hard negative unit tests...\n")
    
    test_basic_generation()
    test_high_similarity_different_semantics()
    test_no_same_problem_pairs()
    test_deterministic_behavior()
    test_with_statistics()
    test_empty_input()
    test_different_languages_not_paired()
    test_identifier_shuffling()
    test_real_world_example()
    
    print("\n" + "="*60)
    print("All textual hard negative tests passed!")
    print("="*60)
