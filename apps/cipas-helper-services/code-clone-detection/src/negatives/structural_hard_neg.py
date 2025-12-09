"""
Structural hard negative generation for code-clone detection.

This module generates hard negative pairs with high structural (AST)
similarity but different functionality. These negatives are designed
to challenge structure-based similarity models.

Strategy:
    1. Extract lightweight AST shape from code
    2. Compute structural similarity (Levenshtein on node sequences)
    3. Select pairs with high structural similarity (> 0.7)
    4. Verify functional difference using heuristics

Functions:
    generate_structural_hard_negatives: Main entry point
    compute_ast_shape: Extract AST node sequence
"""

import ast
import itertools
import random
import re
import sys
from pathlib import Path
from typing import Any

# Handle both package and standalone imports
try:
    from .common import (
        compute_levenshtein_ratio,
        count_return_statements,
        extract_constants,
        extract_identifiers,
        extract_operators,
        extract_problem_id,
    )
except ImportError:
    # Standalone execution
    sys.path.insert(0, str(Path(__file__).parent))
    from common import (
        compute_levenshtein_ratio,
        count_return_statements,
        extract_constants,
        extract_identifiers,
        extract_operators,
        extract_problem_id,
    )


def compute_ast_shape(code: str, lang: str) -> list[str]:
    """
    Extract lightweight AST shape as node type sequence.
    
    For Python: Uses ast module to get node types
    For Java: Uses regex-based structural patterns
    
    Args:
        code: Source code string
        lang: Programming language
        
    Returns:
        List of node type strings representing AST structure
        
    Examples:
        >>> code = "def foo(x):\\n    return x + 1"
        >>> shape = compute_ast_shape(code, "python")
        >>> "FunctionDef" in shape
        True
        >>> "Return" in shape
        True
    """
    if lang.lower() == "python":
        return _compute_python_ast_shape(code)
    elif lang.lower() == "java":
        return _compute_java_structural_shape(code)
    else:
        # Fallback: return empty
        return []


def _compute_python_ast_shape(code: str) -> list[str]:
    """
    Extract Python AST node types using ast module.
    
    Args:
        code: Python source code
        
    Returns:
        List of node type names in traversal order
    """
    try:
        tree = ast.parse(code)
    except SyntaxError:
        # Invalid syntax, return empty
        return []
    
    node_types = []
    
    def visit(node):
        """Recursively visit AST nodes."""
        node_types.append(node.__class__.__name__)
        
        for child in ast.iter_child_nodes(node):
            visit(child)
    
    # Start traversal
    for node in ast.walk(tree):
        node_types.append(node.__class__.__name__)
    
    return node_types


def _compute_java_structural_shape(code: str) -> list[str]:
    """
    Extract Java structural patterns using regex.
    
    Captures method signatures, control flow, and blocks.
    
    Args:
        code: Java source code
        
    Returns:
        List of structural pattern strings
    """
    patterns = []
    
    # Method declarations
    method_pattern = r'\b(public|private|protected|static|final|void|int|boolean|String)\s+\w+\s*\('
    for match in re.finditer(method_pattern, code):
        patterns.append("MethodDecl")
    
    # Control flow keywords
    control_keywords = [
        "if", "else", "while", "for", "switch", "case",
        "try", "catch", "finally", "return"
    ]
    
    for keyword in control_keywords:
        pattern = r'\b' + keyword + r'\b'
        count = len(re.findall(pattern, code))
        patterns.extend([keyword.upper()] * count)
    
    # Block structures (braces)
    open_braces = code.count('{')
    close_braces = code.count('}')
    patterns.extend(['BLOCK_START'] * open_braces)
    patterns.extend(['BLOCK_END'] * close_braces)
    
    # Operators (simplified)
    for op in ['+', '-', '*', '/', '%', '==', '!=', '<', '>', '&&', '||']:
        count = code.count(op)
        patterns.extend(['OP'] * count)
    
    return patterns


def generate_structural_hard_negatives(
    all_files: list[tuple[str, str, str]],
    max_pairs: int,
    seed: int = 42,
    min_structural_similarity: float = 0.7
) -> list[dict[str, Any]]:
    """
    Generate structural hard negative pairs.
    
    Creates pairs with high AST/structural similarity but different
    functionality. These pairs are designed to fool structure-based models.
    
    Args:
        all_files: List of (file_id, code, lang) tuples
        max_pairs: Maximum number of negative pairs to generate
        seed: Random seed for deterministic behavior
        min_structural_similarity: Minimum structural similarity (default 0.7)
        
    Returns:
        List of negative pair dictionaries with schema:
        {
            "file_a_id": str,
            "file_b_id": str,
            "code_a": str,
            "code_b": str,
            "type": "non_structural_hard",
            "generation_meta": {
                "method": "structural_ast_shape",
                "seed": int,
                "similarity_score": float,
                "file_ids": [str, str]
            }
        }
        
    Examples:
        >>> files = [
        ...     ("prob1_a.py", "def foo(x):\\n    return x + 1", "python"),
        ...     ("prob2_b.py", "def bar(x):\\n    return x * 2", "python")
        ... ]
        >>> pairs = generate_structural_hard_negatives(
        ...     files, max_pairs=10, seed=42
        ... )
        >>> len(pairs) >= 0
        True
        >>> if pairs:
        ...     assert pairs[0]["type"] == "non_structural_hard"
        ...     assert "similarity_score" in pairs[0]["generation_meta"]
    """
    if not all_files:
        return []
    
    # Initialize RNG
    rng = random.Random(seed)
    
    # Sort files for deterministic ordering
    sorted_files = sorted(all_files, key=lambda x: x[0])
    
    # Preprocess: extract AST shapes
    file_data = []
    for file_id, code, lang in sorted_files:
        # Extract AST shape
        ast_shape = compute_ast_shape(code, lang)
        
        # Extract problem ID
        prob_id = extract_problem_id(file_id)
        
        # Skip files with empty AST (syntax errors)
        if not ast_shape:
            continue
        
        file_data.append({
            "file_id": file_id,
            "code": code,
            "lang": lang,
            "ast_shape": ast_shape,
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
        
        # Compute structural similarity
        structural_sim = compute_levenshtein_ratio(
            file_a["ast_shape"],
            file_b["ast_shape"]
        )
        
        # Filter by minimum similarity
        if structural_sim < min_structural_similarity:
            continue
        
        # Verify functional difference
        if not _is_semantically_different(file_a, file_b):
            continue
        
        candidates.append({
            "file_a": file_a,
            "file_b": file_b,
            "structural_sim": structural_sim,
        })
    
    # Sort by similarity (descending) for determinism
    candidates.sort(
        key=lambda x: (-x["structural_sim"], x["file_a"]["file_id"])
    )
    
    # Select top candidates
    selected = candidates[:max_pairs]
    
    # Generate output pairs
    pairs = []
    for candidate in selected:
        file_a = candidate["file_a"]
        file_b = candidate["file_b"]
        
        # Create pair dictionary
        pair = {
            "file_a_id": file_a["file_id"],
            "file_b_id": file_b["file_id"],
            "code_a": file_a["code"],
            "code_b": file_b["code"],
            "type": "non_structural_hard",
            "generation_meta": {
                "method": "structural_ast_shape",
                "seed": seed,
                "similarity_score": candidate["structural_sim"],
                "file_ids": [file_a["file_id"], file_b["file_id"]],
            }
        }
        
        pairs.append(pair)
    
    return pairs


def _is_semantically_different(file_a: dict, file_b: dict) -> bool:
    """
    Check if two files are semantically different using heuristics.
    
    Args:
        file_a: First file data dict
        file_b: Second file data dict
        
    Returns:
        True if files appear semantically different
        
    Heuristics:
        - Different number of return statements
        - Different operator sets
        - Different constant values
    """
    code_a = file_a["code"]
    code_b = file_b["code"]
    
    # Check return statement count
    returns_a = count_return_statements(code_a)
    returns_b = count_return_statements(code_b)
    
    # Different return counts may indicate different logic paths
    if abs(returns_a - returns_b) >= 1:
        return True
    
    # Check operator sets
    ops_a = extract_operators(code_a)
    ops_b = extract_operators(code_b)
    
    # Different operators indicate different computations
    op_diff = ops_a.symmetric_difference(ops_b)
    if op_diff:
        return True
    
    # Check constants
    consts_a = set(extract_constants(code_a))
    consts_b = set(extract_constants(code_b))
    
    # Different constants indicate different values
    const_diff = consts_a.symmetric_difference(consts_b)
    if const_diff:
        return True
    
    # Check identifiers
    ids_a = set(extract_identifiers(code_a, file_a["lang"]))
    ids_b = set(extract_identifiers(code_b, file_b["lang"]))
    
    # Very different identifier sets may indicate different logic
    id_similarity = len(ids_a & ids_b) / max(len(ids_a | ids_b), 1)
    if id_similarity < 0.3:
        return True
    
    # If all heuristics are similar, conservatively reject
    return False


def generate_structural_hard_negatives_with_stats(
    all_files: list[tuple[str, str, str]],
    max_pairs: int,
    seed: int = 42,
    min_structural_similarity: float = 0.7
) -> tuple[list[dict[str, Any]], dict[str, Any]]:
    """
    Generate structural hard negatives with statistics.
    
    Args:
        all_files: List of (file_id, code, lang) tuples
        max_pairs: Maximum number of pairs
        seed: Random seed
        min_structural_similarity: Minimum structural similarity threshold
        
    Returns:
        Tuple of (pairs, stats_dict)
        
    Examples:
        >>> files = [
        ...     ("p1_a.py", "def foo(x): return x+1", "python"),
        ...     ("p2_b.py", "def bar(x): return x*2", "python")
        ... ]
        >>> pairs, stats = generate_structural_hard_negatives_with_stats(
        ...     files, max_pairs=10, seed=42
        ... )
        >>> "total_candidates" in stats
        True
    """
    # Sort files for deterministic ordering
    sorted_files = sorted(all_files, key=lambda x: x[0])
    
    # Preprocess
    file_data = []
    syntax_errors = 0
    
    for file_id, code, lang in sorted_files:
        ast_shape = compute_ast_shape(code, lang)
        
        if not ast_shape:
            syntax_errors += 1
            continue
        
        prob_id = extract_problem_id(file_id)
        
        file_data.append({
            "file_id": file_id,
            "code": code,
            "lang": lang,
            "ast_shape": ast_shape,
            "prob_id": prob_id,
        })
    
    # Count candidates
    total_candidates = 0
    high_similarity = 0
    semantically_different = 0
    
    for file_a, file_b in itertools.combinations(file_data, 2):
        if file_a["prob_id"] == file_b["prob_id"]:
            continue
        
        if file_a["lang"] != file_b["lang"]:
            continue
        
        total_candidates += 1
        
        structural_sim = compute_levenshtein_ratio(
            file_a["ast_shape"],
            file_b["ast_shape"]
        )
        
        if structural_sim >= min_structural_similarity:
            high_similarity += 1
            
            if _is_semantically_different(file_a, file_b):
                semantically_different += 1
    
    # Generate pairs
    pairs = generate_structural_hard_negatives(
        all_files,
        max_pairs,
        seed,
        min_structural_similarity
    )
    
    # Compile statistics
    stats = {
        "total_files": len(sorted_files),
        "valid_files": len(file_data),
        "syntax_errors": syntax_errors,
        "total_candidates": total_candidates,
        "high_similarity_count": high_similarity,
        "semantically_different_count": semantically_different,
        "pairs_generated": len(pairs),
        "min_structural_similarity": min_structural_similarity,
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
def test_compute_ast_shape():
    """Test AST shape extraction."""
    code = "def foo(x):\n    return x + 1"
    shape = compute_ast_shape(code, "python")
    
    assert "FunctionDef" in shape
    assert "Return" in shape
    
    print("✓ AST shape extraction test passed")


def test_generate_structural_hard_negatives():
    """Test structural hard negative generation."""
    # Create test files with similar structure but different logic
    files = [
        ("prob_001_sub_1.py", """def calculate(x):
    result = x + 1
    return result
""", "python"),
        
        ("prob_002_sub_1.py", """def process(x):
    result = x * 2
    return result
""", "python"),
        
        ("prob_003_sub_1.py", """def compute(y):
    result = y - 1
    return result
""", "python"),
    ]
    
    pairs = generate_structural_hard_negatives(
        files,
        max_pairs=5,
        seed=42,
        min_structural_similarity=0.5
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
        assert pair["type"] == "non_structural_hard"
        assert "generation_meta" in pair
        assert "similarity_score" in pair["generation_meta"]
        
        # Check no same-problem pairs
        prob_a = extract_problem_id(pair["file_a_id"])
        prob_b = extract_problem_id(pair["file_b_id"])
        assert prob_a != prob_b
    
    print("✓ Generate structural hard negatives test passed")


def test_determinism():
    """Test deterministic behavior."""
    files = [
        ("p1_a.py", "def foo(x): return x+1", "python"),
        ("p2_b.py", "def bar(x): return x*2", "python"),
        ("p3_c.py", "def baz(y): return y-1", "python"),
    ]
    
    pairs1 = generate_structural_hard_negatives(
        files, max_pairs=10, seed=42, min_structural_similarity=0.5
    )
    pairs2 = generate_structural_hard_negatives(
        files, max_pairs=10, seed=42, min_structural_similarity=0.5
    )
    
    # Should be identical
    assert len(pairs1) == len(pairs2)
    
    for p1, p2 in zip(pairs1, pairs2):
        assert p1["file_a_id"] == p2["file_a_id"]
        assert p1["file_b_id"] == p2["file_b_id"]
    
    print("✓ Determinism test passed")


def test_semantic_difference():
    """Test semantic difference detection."""
    file_a = {
        "code": "def foo(x):\n    return x + 1",
        "lang": "python",
    }
    
    file_b = {
        "code": "def bar(x):\n    return x * 2",
        "lang": "python",
    }
    
    # Different operators -> should be different
    assert _is_semantically_different(file_a, file_b)
    
    print("✓ Semantic difference test passed")


def test_with_stats():
    """Test generation with statistics."""
    files = [
        ("p1_a.py", "def foo(x): return x+1", "python"),
        ("p2_b.py", "def bar(x): return x*2", "python"),
    ]
    
    pairs, stats = generate_structural_hard_negatives_with_stats(
        files,
        max_pairs=10,
        seed=42,
        min_structural_similarity=0.5
    )
    
    assert "total_candidates" in stats
    assert "pairs_generated" in stats
    assert stats["pairs_generated"] == len(pairs)
    
    print("✓ Generation with stats test passed")


def test_empty_input():
    """Test with empty input."""
    pairs = generate_structural_hard_negatives([], max_pairs=10, seed=42)
    assert pairs == []
    
    print("✓ Empty input test passed")


def test_java_structural_shape():
    """Test Java structural pattern extraction."""
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
    
    assert "MethodDecl" in shape
    assert "IF" in shape
    assert "RETURN" in shape
    
    print("✓ Java structural shape test passed")


if __name__ == "__main__":
    print("Running structural hard negative tests...\n")
    
    test_compute_ast_shape()
    test_generate_structural_hard_negatives()
    test_determinism()
    test_semantic_difference()
    test_with_stats()
    test_empty_input()
    test_java_structural_shape()
    
    print("\nAll tests passed!")
    
    # Example usage
    print("\n" + "="*60)
    print("Example: Generate structural hard negatives")
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
        
        ("prob_003_sub_1.py", """def find_minimum(values):
    min_val = values[0]
    for val in values:
        if val < min_val:
            min_val = val
    return min_val
""", "python"),
    ]
    
    pairs, stats = generate_structural_hard_negatives_with_stats(
        example_files,
        max_pairs=5,
        seed=42,
        min_structural_similarity=0.6
    )
    
    print(f"\nGenerated {len(pairs)} structural hard negative pairs")
    print(f"Statistics: {stats}")
    
    if pairs:
        print(f"\nExample pair:")
        pair = pairs[0]
        print(f"File A: {pair['file_a_id']}")
        print(f"File B: {pair['file_b_id']}")
        print(f"Structural similarity: {pair['generation_meta']['similarity_score']:.3f}")
