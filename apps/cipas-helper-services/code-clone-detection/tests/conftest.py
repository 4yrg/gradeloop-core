"""
Test configuration and fixtures for pytest.
"""

import tempfile
from pathlib import Path

import pytest

from src.models import CodeFragment


@pytest.fixture
def temp_dir():
    """Create temporary directory for tests."""
    with tempfile.TemporaryDirectory() as tmpdir:
        yield Path(tmpdir)


@pytest.fixture
def sample_python_code():
    """Sample Python code for testing."""
    return """
def calculate_sum(a, b):
    '''Calculate sum of two numbers.'''
    return a + b

def calculate_product(a, b):
    '''Calculate product of two numbers.'''
    return a * b

class Calculator:
    def add(self, x, y):
        return x + y
    
    def subtract(self, x, y):
        return x - y
"""


@pytest.fixture
def sample_fragments():
    """Sample code fragments for testing."""
    return [
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
            start_line=10,
            end_line=15,
            language="python",
            content="def bar(): return 42",
            tokens=["def", "bar", "(", ")", ":", "return", "42"],
            ast_hash="hash456"
        ),
    ]
