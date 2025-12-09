"""
Unit tests for clone detector.
"""

import pytest

from src.clone_detector import (
    ast_similarity,
    classify_clone_type,
    compute_similarity,
    detect_clones,
    token_similarity,
)
from src.models import CodeFragment


def test_token_similarity():
    """Test token-based similarity."""
    tokens1 = ["def", "foo", "(", ")", ":", "pass"]
    tokens2 = ["def", "foo", "(", ")", ":", "return"]
    
    similarity = token_similarity(tokens1, tokens2)
    assert 0.7 < similarity < 0.9  # Most tokens are the same


def test_ast_similarity():
    """Test AST-based similarity."""
    hash1 = "abcdef123456"
    hash2 = "abcdef123456"
    
    similarity = ast_similarity(hash1, hash2)
    assert similarity == 1.0
    
    hash3 = "xyz789654321"
    similarity2 = ast_similarity(hash1, hash3)
    assert similarity2 < 0.5


def test_classify_clone_type():
    """Test clone type classification."""
    # Type 1: Nearly identical
    metadata1 = {"token_similarity": 0.96, "ast_similarity": 0.99}
    assert classify_clone_type(0.97, metadata1) == "type1"
    
    # Type 2: Syntactically identical
    metadata2 = {"token_similarity": 0.75, "ast_similarity": 0.92}
    assert classify_clone_type(0.83, metadata2) == "type2"
    
    # Type 3: Modified
    metadata3 = {"token_similarity": 0.72, "ast_similarity": 0.78}
    assert classify_clone_type(0.75, metadata3) == "type3"
    
    # Type 4: Semantically similar
    metadata4 = {"token_similarity": 0.50, "ast_similarity": 0.50}
    assert classify_clone_type(0.50, metadata4) == "type4"


def test_compute_similarity():
    """Test computing similarity between fragments."""
    frag1 = CodeFragment(
        file_path="test1.py",
        start_line=1,
        end_line=5,
        language="python",
        content="def foo(): pass",
        tokens=["def", "foo", "(", ")", ":", "pass"],
        ast_hash="hash123"
    )
    
    frag2 = CodeFragment(
        file_path="test2.py",
        start_line=10,
        end_line=15,
        language="python",
        content="def bar(): pass",
        tokens=["def", "bar", "(", ")", ":", "pass"],
        ast_hash="hash123"
    )
    
    similarity, metadata = compute_similarity(frag1, frag2, ["token", "ast"])
    
    assert 0 <= similarity <= 1
    assert "token_similarity" in metadata
    assert "ast_similarity" in metadata


def test_detect_clones():
    """Test detecting clones from fragments."""
    fragments = [
        CodeFragment(
            file_path="test1.py",
            start_line=1,
            end_line=5,
            language="python",
            content="def foo(): pass",
            tokens=["def", "foo", "(", ")", ":", "pass"],
            ast_hash="hash123"
        ),
        CodeFragment(
            file_path="test2.py",
            start_line=1,
            end_line=5,
            language="python",
            content="def bar(): pass",
            tokens=["def", "bar", "(", ")", ":", "pass"],
            ast_hash="hash123"
        ),
        CodeFragment(
            file_path="test3.py",
            start_line=1,
            end_line=5,
            language="python",
            content="def completely_different(): return 42",
            tokens=["def", "completely_different", "(", ")", ":", "return", "42"],
            ast_hash="hash999"
        ),
    ]
    
    clones = detect_clones(fragments, threshold=0.70, methods=["token", "ast"])
    
    # Should find at least one clone pair (fragments 1 and 2 are similar)
    assert len(clones) >= 1
    assert all(clone.similarity_score >= 0.70 for clone in clones)
