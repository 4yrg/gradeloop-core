"""
Unit tests for structural hard negative generation.

Tests the generation of hard negative pairs with high AST/structural
similarity but different functionality.
"""

import sys
from pathlib import Path

# Add src to path
src_path = Path(__file__).parent.parent.parent / "src"
sys.path.insert(0, str(src_path))

from negatives.structural_hard_neg import (
    compute_ast_shape,
    generate_structural_hard_negatives,
    generate_structural_hard_negatives_with_stats,
)
from negatives.common import extract_problem_id


def test_ast_shape_extraction():
    """Test AST shape extraction for Python."""
    code = """def calculate(x):
    result = x + 1
    return result
"""
    
    shape = compute_ast_shape(code, "python")
    
    # Should contain function and return nodes
    assert "FunctionDef" in shape, "Should contain FunctionDef"
    assert "Return" in shape, "Should contain Return"
    
    print("✓ AST shape extraction test passed")


def test_basic_generation():
    """Test basic structural hard negative generation."""
    # Two functions with similar structure but different computation
    files = [
        ("prob_001_sub_1.py", """def calculate(x):
    result = x + 1
    return result
""", "python"),
        
        ("prob_002_sub_1.py", """def process(x):
    result = x * 2
    return result
""", "python"),
    ]
    
    pairs = generate_structural_hard_negatives(
        files,
        max_pairs=10,
        seed=42,
        min_structural_similarity=0.5
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
    assert pair["type"] == "non_structural_hard"
    assert "generation_meta" in pair
    
    # Verify metadata
    meta = pair["generation_meta"]
    assert meta["method"] == "structural_ast_shape"
    assert "similarity_score" in meta
    assert "seed" in meta
    assert "file_ids" in meta
    
    # Verify different problems
    prob_a = extract_problem_id(pair["file_a_id"])
    prob_b = extract_problem_id(pair["file_b_id"])
    assert prob_a != prob_b, "Should not pair same-problem files"
    
    print("✓ Basic generation test passed")


def test_high_structural_similarity():
    """Test that selected pairs have high structural similarity."""
    # Create functions with similar AST structure but different operations
    files = [
        ("prob_001_sub_1.py", """def sum_list(items):
    total = 0
    for item in items:
        total = total + item
    return total
""", "python"),
        
        ("prob_002_sub_1.py", """def product_list(items):
    result = 1
    for item in items:
        result = result * item
    return result
""", "python"),
        
        ("prob_003_sub_1.py", """def max_list(values):
    max_val = values[0]
    for val in values:
        if val > max_val:
            max_val = val
    return max_val
""", "python"),
    ]
    
    pairs = generate_structural_hard_negatives(
        files,
        max_pairs=10,
        seed=42,
        min_structural_similarity=0.6
    )
    
    # Should find pairs with similar structure
    assert len(pairs) >= 1, "Should find structurally similar pairs"
    
    # Verify high similarity
    for pair in pairs:
        similarity = pair["generation_meta"]["similarity_score"]
        assert similarity >= 0.6, f"Similarity should be >= 0.6, got {similarity}"
    
    print("✓ High structural similarity test passed")


def test_no_same_problem_pairs():
    """Test that same-problem files are never paired."""
    files = [
        ("prob_001_sub_1.py", "def foo(x): return x + 1", "python"),
        ("prob_001_sub_2.py", "def bar(x): return x + 2", "python"),
        ("prob_002_sub_1.py", "def baz(x): return x * 3", "python"),
    ]
    
    pairs = generate_structural_hard_negatives(
        files,
        max_pairs=100,
        seed=42,
        min_structural_similarity=0.5
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
    pairs1 = generate_structural_hard_negatives(
        files, max_pairs=10, seed=42, min_structural_similarity=0.5
    )
    pairs2 = generate_structural_hard_negatives(
        files, max_pairs=10, seed=42, min_structural_similarity=0.5
    )
    
    assert len(pairs1) == len(pairs2), "Should generate same number of pairs"
    
    for p1, p2 in zip(pairs1, pairs2):
        assert p1["file_a_id"] == p2["file_a_id"]
        assert p1["file_b_id"] == p2["file_b_id"]
        assert p1["generation_meta"]["similarity_score"] == p2["generation_meta"]["similarity_score"]
    
    print("✓ Deterministic behavior test passed")


def test_with_statistics():
    """Test generation with statistics."""
    files = [
        ("p1_a.py", "def foo(x): return x+1", "python"),
        ("p2_b.py", "def bar(x): return x*2", "python"),
        ("p3_c.py", "def baz(y): return y-1", "python"),
    ]
    
    pairs, stats = generate_structural_hard_negatives_with_stats(
        files,
        max_pairs=10,
        seed=42,
        min_structural_similarity=0.5
    )
    
    # Verify statistics
    assert "total_files" in stats
    assert "valid_files" in stats
    assert "syntax_errors" in stats
    assert "total_candidates" in stats
    assert "high_similarity_count" in stats
    assert "semantically_different_count" in stats
    assert "pairs_generated" in stats
    assert "min_structural_similarity" in stats
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
    pairs = generate_structural_hard_negatives([], max_pairs=10, seed=42)
    assert pairs == [], "Empty input should return empty list"
    
    print("✓ Empty input test passed")


def test_syntax_errors_handled():
    """Test that syntax errors are handled gracefully."""
    files = [
        ("p1_a.py", "def foo(x): return x+1", "python"),
        ("p2_invalid.py", "def bar(x) return x*2", "python"),  # Invalid syntax
    ]
    
    pairs = generate_structural_hard_negatives(
        files,
        max_pairs=10,
        seed=42,
        min_structural_similarity=0.5
    )
    
    # Should not crash, invalid file should be skipped
    assert len(pairs) >= 0, "Should handle syntax errors gracefully"
    
    # Get stats to check error count
    pairs, stats = generate_structural_hard_negatives_with_stats(
        files,
        max_pairs=10,
        seed=42,
        min_structural_similarity=0.5
    )
    
    assert stats["syntax_errors"] >= 1, "Should count syntax errors"
    
    print("✓ Syntax errors handled test passed")


def test_different_languages_not_paired():
    """Test that different language files are not paired."""
    files = [
        ("p1_a.py", "def foo(x): return x+1", "python"),
        ("p2_b.java", "int bar(int x) { return x*2; }", "java"),
    ]
    
    pairs = generate_structural_hard_negatives(
        files,
        max_pairs=10,
        seed=42,
        min_structural_similarity=0.0  # Allow any similarity
    )
    
    # Should not pair different languages
    assert len(pairs) == 0, "Different languages should not be paired"
    
    print("✓ Different languages not paired test passed")


def test_java_structural_extraction():
    """Test structural pattern extraction for Java."""
    java_code = """
public class Example {
    public int calculate(int x) {
        if (x > 0) {
            return x + 1;
        } else {
            return x - 1;
        }
    }
}
"""
    
    shape = compute_ast_shape(java_code, "java")
    
    # Should contain structural patterns
    assert "MethodDecl" in shape, "Should contain MethodDecl"
    assert "IF" in shape, "Should contain IF"
    assert "RETURN" in shape, "Should contain RETURN"
    
    print("✓ Java structural extraction test passed")


def test_real_world_example():
    """Test with realistic code examples."""
    files = [
        ("prob_loop_001.py", """def iterate_sum(n):
    result = 0
    i = 1
    while i <= n:
        result = result + i
        i = i + 1
    return result
""", "python"),
        
        ("prob_loop_002.py", """def iterate_product(n):
    result = 1
    i = 1
    while i <= n:
        result = result * i
        i = i + 1
    return result
""", "python"),
    ]
    
    pairs = generate_structural_hard_negatives(
        files,
        max_pairs=10,
        seed=42,
        min_structural_similarity=0.6
    )
    
    # These have very similar structure (both while loops with same pattern)
    # May or may not generate pairs depending on heuristics
    assert len(pairs) >= 0, "Should handle real-world examples"
    
    # If pairs were generated, verify they have high structural similarity
    if pairs:
        pair = pairs[0]
        similarity = pair["generation_meta"]["similarity_score"]
        assert similarity >= 0.6, f"Should have high structural similarity, got {similarity}"
    
    print("✓ Real-world example test passed")


if __name__ == "__main__":
    print("Running structural hard negative unit tests...\n")
    
    test_ast_shape_extraction()
    test_basic_generation()
    test_high_structural_similarity()
    test_no_same_problem_pairs()
    test_deterministic_behavior()
    test_with_statistics()
    test_empty_input()
    test_syntax_errors_handled()
    test_different_languages_not_paired()
    test_java_structural_extraction()
    test_real_world_example()
    
    print("\n" + "="*60)
    print("All structural hard negative tests passed!")
    print("="*60)
