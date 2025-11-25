# tests/test_structural_clones.py
import pytest
from ..parsers.tree_sitter_wrapper import TREE_SITTER_AVAILABLE
from ..scripts.generate_structural_clones import ast_similarity

# Mark all tests in this file as asyncio
pytestmark = pytest.mark.asyncio

# --- Test Data ---

# Identical structure
CODE_A = "def my_func(a, b):\n    return a + b"
CODE_B = "def my_func(a, b):\n    return a + b"

# Structurally similar but with an extra statement
CODE_C = "def my_func(a, b):\n    c = a + b\n    return c"

# Structurally different
CODE_D = "class MyClass:\n    def __init__(self):\n        pass"


@pytest.mark.skipif(not TREE_SITTER_AVAILABLE, reason="tree-sitter or python grammar not installed")
async def test_ast_similarity_identical_code():
    """
    Two identical pieces of code should have a Jaccard similarity of 1.0.
    """
    score = await ast_similarity(CODE_A, CODE_B, "python", method="jaccard")
    assert score == pytest.approx(1.0)

@pytest.mark.skipif(not TREE_SITTER_AVAILABLE, reason="tree-sitter or python grammar not installed")
async def test_ast_similarity_similar_code():
    """
    Two structurally similar pieces of code should have a high similarity score.
    """
    # Let's manually calculate the expected score for A vs C
    # AST for A: (roughly)
    # function_definition, identifier, parameters, block, return_statement, binary_expression, identifier, identifier
    # counts_A = {'function_definition': 1, 'identifier': 4, 'parameters': 1, 'block': 1, 'return_statement': 1, 'binary_expression': 1, '+': 1}
    
    # AST for C:
    # function_definition, identifier, parameters, block, expression_statement, assignment, identifier, binary_expression, identifier, identifier, return_statement, identifier
    # counts_C = {'function_definition': 1, 'identifier': 6, 'parameters': 1, 'block': 1, 'return_statement': 1, 'binary_expression': 1, '+': 1, 'expression_statement': 1, 'assignment':1, '=': 1}
    
    # The actual node types will be more specific, but the principle holds.
    # We expect a score > 0.5 but < 1.0
    score = await ast_similarity(CODE_A, CODE_C, "python", method="jaccard")
    assert 0.5 < score < 1.0

@pytest.mark.skipif(not TREE_SITTER_AVAILABLE, reason="tree-sitter or python grammar not installed")
async def test_ast_similarity_different_code():
    """
    Two structurally different pieces of code should have a low similarity score.
    """
    score = await ast_similarity(CODE_A, CODE_D, "python", method="jaccard")
    assert score < 0.3

@pytest.mark.skipif(not TREE_SITTER_AVAILABLE, reason="tree-sitter or python grammar not installed")
async def test_ast_similarity_with_unparsable_code():
    """
    If code cannot be parsed, similarity should be 0.0.
    """
    unparsable_code = "def my_func(a, b):\n  return a +"
    score = await ast_similarity(CODE_A, unparsable_code, "python", method="jaccard")
    assert score == 0.0
