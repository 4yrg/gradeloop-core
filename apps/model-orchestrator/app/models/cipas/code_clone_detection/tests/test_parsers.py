# tests/test_parsers.py
import pytest
from ..parsers.normalizers import (
    strip_comments,
    ast_rename_identifiers,
    normalize_whitespace_and_format,
)
from ..parsers.tree_sitter_wrapper import TREE_SITTER_AVAILABLE

# Mark all tests in this file as asyncio
pytestmark = pytest.mark.asyncio

# --- Test Data ---

PYTHON_CODE_WITH_COMMENTS = """
# This is a full-line comment
def my_function(arg1):  # This is an inline comment
    """This is a docstring, not a comment."""
    a = 1  # Set a value
    # Another comment
    return a
"""

PYTHON_CODE_NO_COMMENTS = """

def my_function(arg1):
    """This is a docstring, not a comment."""
    a = 1
    
    return a
"""

JS_CODE_WITH_COMMENTS = """
// Main function
function calculate(x, y) {
    let result = x + y; // Add numbers
    /*
     * A multi-line comment block.
     */
    return result;
}
"""

JS_CODE_NO_COMMENTS = """

function calculate(x, y) {
    let result = x + y;
    
    
    return result;
}
"""

PYTHON_CODE_FOR_RENAMING = """
def greet(name):
    message = "Hello, " + name
    if len(name) > 10:
        long_name_message = "That's a long name!"
        return long_name_message
    return message

def farewell(name):
    return "Bye, " + name
"""

# --- Tests for strip_comments ---

@pytest.mark.skipif(not TREE_SITTER_AVAILABLE, reason="tree-sitter or python grammar not installed")
async def test_strip_comments_python_with_tree_sitter():
    stripped = await strip_comments(PYTHON_CODE_WITH_COMMENTS, "python")
    # Comparing line by line to ignore subtle whitespace differences from parsing
    stripped_lines = {line.strip() for line in stripped.splitlines() if line.strip()}
    expected_lines = {line.strip() for line in PYTHON_CODE_NO_COMMENTS.splitlines() if line.strip()}
    assert stripped_lines == expected_lines

@pytest.mark.skipif(not TREE_SITTER_AVAILABLE, reason="tree-sitter or javascript grammar not installed")
async def test_strip_comments_js_with_tree_sitter():
    stripped = await strip_comments(JS_CODE_WITH_COMMENTS, "javascript")
    stripped_lines = {line.strip() for line in stripped.splitlines() if line.strip()}
    expected_lines = {line.strip() for line in JS_CODE_NO_COMMENTS.splitlines() if line.strip()}
    assert stripped_lines == expected_lines

# --- Tests for ast_rename_identifiers ---

async def test_rename_identifiers_python_ast_fallback():
    """Tests renaming using Python's builtin AST module."""
    renamed_code = await ast_rename_identifiers(PYTHON_CODE_FOR_RENAMING, "python")
    
    # We expect function and variable names to be replaced, but not strings.
    assert "greet" not in renamed_code
    assert "farewell" not in renamed_code
    assert "message" not in renamed_code
    assert "long_name_message" not in renamed_code
    assert "name" not in renamed_code
    
    assert "FUNC_1" in renamed_code or "VAR_1" in renamed_code # Name can be either
    assert "FUNC_2" in renamed_code or "VAR_2" in renamed_code

    # Check that string literals are preserved
    assert '"Hello, "' in renamed_code
    assert '"That\'s a long name!"' in renamed_code
    assert '"Bye, "' in renamed_code

@pytest.mark.skipif(not TREE_SITTER_AVAILABLE, reason="tree-sitter or python grammar not installed")
async def test_rename_identifiers_python_tree_sitter():
    """Tests the simplified tree-sitter based renaming for Python."""
    # This test uses the less precise global renamer in normalizers.py
    renamed_code = await ast_rename_identifiers(PYTHON_CODE_FOR_RENAMING, "python")
    
    assert "greet" not in renamed_code
    assert "name" not in renamed_code
    
    assert "ID_1" in renamed_code
    assert "ID_2" in renamed_code

# --- Tests for normalize_whitespace_and_format ---

@pytest.mark.asyncio
async def test_normalize_whitespace_formatter_not_found(mocker):
    """
    Test that if a formatter is not found, the original code is returned.
    We mock the subprocess call to simulate FileNotFoundError.
    """
    mocker.patch(
        "asyncio.create_subprocess_exec",
        side_effect=FileNotFoundError("Mocked: black not found"),
    )
    
    badly_formatted_code = "def  my_func( a:int )->int:return a"
    result = await normalize_whitespace_and_format(badly_formatted_code, "python")
    
    # Should return the original code
    assert result == badly_formatted_code
