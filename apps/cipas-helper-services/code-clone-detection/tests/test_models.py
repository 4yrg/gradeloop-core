"""
Unit tests for data models.
"""

import pytest

from src.models import (
    ClonePair,
    CodeFragment,
    CodeMetrics,
    validate_clone_pair,
    validate_fragment,
)


def test_code_metrics():
    """Test CodeMetrics dataclass."""
    metrics = CodeMetrics(loc=10, complexity=3, token_count=25)
    
    assert metrics.loc == 10
    assert metrics.complexity == 3
    assert metrics.token_count == 25
    
    data = metrics.to_dict()
    assert data["loc"] == 10


def test_code_fragment_creation():
    """Test CodeFragment creation."""
    fragment = CodeFragment(
        file_path="test.py",
        start_line=1,
        end_line=10,
        language="python",
        content="def foo():\n    pass"
    )
    
    assert fragment.id is not None
    assert fragment.file_path == "test.py"
    assert fragment.start_line == 1
    assert fragment.end_line == 10


def test_code_fragment_serialization():
    """Test CodeFragment to_dict and from_dict."""
    fragment = CodeFragment(
        file_path="test.py",
        start_line=1,
        end_line=10,
        language="python",
        content="def foo(): pass",
        tokens=["def", "foo", "(", ")", ":", "pass"]
    )
    
    data = fragment.to_dict()
    assert data["file_path"] == "test.py"
    assert data["tokens"] == ["def", "foo", "(", ")", ":", "pass"]
    
    # Recreate from dict
    fragment2 = CodeFragment.from_dict(data)
    assert fragment2.file_path == fragment.file_path
    assert fragment2.tokens == fragment.tokens


def test_clone_pair_creation():
    """Test ClonePair creation."""
    pair = ClonePair(
        fragment_1_id="abc123",
        fragment_2_id="def456",
        clone_type="type2",
        similarity_score=0.92
    )
    
    assert pair.id is not None
    assert pair.fragment_1_id == "abc123"
    assert pair.fragment_2_id == "def456"
    assert pair.clone_type == "type2"
    assert pair.similarity_score == 0.92


def test_clone_pair_serialization():
    """Test ClonePair to_dict and from_dict."""
    pair = ClonePair(
        fragment_1_id="abc",
        fragment_2_id="def",
        clone_type="type1",
        similarity_score=0.95,
        metadata={"token_similarity": 0.96}
    )
    
    data = pair.to_dict()
    assert data["clone_type"] == "type1"
    assert data["metadata"]["token_similarity"] == 0.96
    
    pair2 = ClonePair.from_dict(data)
    assert pair2.clone_type == pair.clone_type


def test_validate_fragment():
    """Test fragment validation."""
    valid_fragment = CodeFragment(
        file_path="test.py",
        start_line=1,
        end_line=10,
        language="python",
        content="code"
    )
    assert validate_fragment(valid_fragment)
    
    # Invalid: start_line < 1
    with pytest.raises(ValueError):
        invalid = CodeFragment(
            file_path="test.py",
            start_line=0,
            end_line=10,
            language="python",
            content="code"
        )
        validate_fragment(invalid)


def test_validate_clone_pair():
    """Test clone pair validation."""
    valid_pair = ClonePair(
        fragment_1_id="abc",
        fragment_2_id="def",
        clone_type="type2",
        similarity_score=0.85
    )
    assert validate_clone_pair(valid_pair)
    
    # Invalid: similarity out of range
    with pytest.raises(ValueError):
        invalid = ClonePair(
            fragment_1_id="abc",
            fragment_2_id="def",
            clone_type="type2",
            similarity_score=1.5
        )
        validate_clone_pair(invalid)
