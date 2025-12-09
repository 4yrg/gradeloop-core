"""
Static validation for generated code clones.

This module provides lightweight syntax validation to ensure that generated
code clones are syntactically valid. Invalid code can corrupt datasets and
cause training issues.

Validation approaches:
- Python: Use built-in compile() to check syntax
- Java: Heuristic-based validation (brace matching, basic structure)

For production use with Java, consider integrating:
- JavaParser library for proper AST validation
- javac compiler integration
- tree-sitter for language-agnostic parsing

Functions:
    is_syntax_ok: Check if code has valid syntax
    _validate_python_syntax: Python-specific validation
    _validate_java_syntax: Java-specific heuristic validation
    validate_batch: Validate multiple code snippets
    get_validation_stats: Get statistics on validation results
"""

import logging
from typing import Any

logger = logging.getLogger(__name__)


def is_syntax_ok(code: str, lang: str) -> bool:
    """
    Check if code has valid syntax.
    
    Validation strategies by language:
    - Python: Use compile() to check syntax (accurate)
    - Java: Heuristic-based validation (brace matching, basic checks)
    
    **Note**: Java validation is heuristic-only and may have false positives/
    negatives. For production use, integrate proper Java parser.
    
    Args:
        code: Source code to validate
        lang: Programming language ("python" or "java")
        
    Returns:
        True if syntax appears valid, False otherwise
        
    Examples:
        >>> # Valid Python
        >>> is_syntax_ok("def foo():\\n    pass", "python")
        True
        
        >>> # Invalid Python (syntax error)
        >>> is_syntax_ok("def foo(\\n    pass", "python")
        False
        
        >>> # Valid Java (heuristic)
        >>> is_syntax_ok("public void foo() { }", "java")
        True
        
        >>> # Invalid Java (unbalanced braces)
        >>> is_syntax_ok("public void foo() { ", "java")
        False
    """
    if not code or not code.strip():
        logger.debug("Empty code provided")
        return False
    
    lang_lower = lang.lower()
    
    if lang_lower == "python":
        return _validate_python_syntax(code)
    elif lang_lower == "java":
        return _validate_java_syntax(code)
    else:
        logger.warning(f"Unsupported language: {lang}. Skipping validation.")
        return True  # Assume valid for unsupported languages


def _validate_python_syntax(code: str) -> bool:
    """
    Validate Python code syntax using compile().
    
    This is accurate and catches all Python syntax errors.
    
    Args:
        code: Python source code
        
    Returns:
        True if syntax is valid, False otherwise
        
    Examples:
        >>> _validate_python_syntax("x = 1")
        True
        >>> _validate_python_syntax("x = ")
        False
    """
    try:
        compile(code, "<string>", "exec")
        logger.debug("Python syntax validation: PASS")
        return True
    except SyntaxError as e:
        logger.debug(f"Python syntax validation: FAIL - {e}")
        return False
    except Exception as e:
        # Other compilation errors (e.g., encoding issues)
        logger.warning(f"Python compilation error: {e}")
        return False


def _validate_java_syntax(code: str) -> bool:
    """
    Validate Java code syntax using heuristics.
    
    **Heuristic validation** - checks basic structural requirements:
    1. Balanced braces: count of '{' equals count of '}'
    2. Balanced parentheses: count of '(' equals count of ')'
    3. Balanced brackets: count of '[' equals count of ']'
    4. No obviously malformed constructs
    
    **Limitations**:
    - Does not parse actual Java grammar
    - Cannot detect semantic errors
    - May miss subtle syntax errors
    - Cannot validate against Java specification
    - Braces in strings/comments can cause false negatives
    
    **For production**: Use JavaParser, tree-sitter, or javac integration
    for accurate validation.
    
    Args:
        code: Java source code
        
    Returns:
        True if basic heuristics pass, False otherwise
        
    Examples:
        >>> _validate_java_syntax("class A { void foo() { } }")
        True
        >>> _validate_java_syntax("class A { void foo() { }")  # Missing }
        False
        >>> _validate_java_syntax("void foo() ( { }")  # Wrong order
        False
    """
    # Check balanced braces
    if code.count('{') != code.count('}'):
        logger.debug("Java validation: FAIL - Unbalanced braces")
        return False
    
    # Check balanced parentheses
    if code.count('(') != code.count(')'):
        logger.debug("Java validation: FAIL - Unbalanced parentheses")
        return False
    
    # Check balanced brackets
    if code.count('[') != code.count(']'):
        logger.debug("Java validation: FAIL - Unbalanced brackets")
        return False
    
    # Check for empty braces (must have content or be interface/abstract)
    # This is too strict, so commenting out
    # if '{}' in code.replace(' ', ''):
    #     logger.debug("Java validation: WARN - Empty braces found")
    
    # Check for basic structure - should have at least one of:
    # class, interface, enum, or method
    has_structure = any(keyword in code for keyword in [
        'class ', 'interface ', 'enum ', 'public ', 'private ', 'protected ', 'void ', 'int ', 'String '
    ])
    
    if not has_structure:
        logger.debug("Java validation: WARN - No recognizable Java structure")
        # Don't fail on this, as it might be a valid snippet
    
    # Additional heuristic: check for common syntax errors
    # Unmatched quotes (simplified check)
    double_quotes = code.count('"')
    if double_quotes % 2 != 0:
        logger.debug("Java validation: FAIL - Unmatched double quotes")
        return False
    
    # Check for semicolons in non-empty, non-comment lines
    # This is optional and might be too strict for snippets
    lines = code.split('\n')
    for line in lines:
        stripped = line.strip()
        # Skip empty lines, comments, and control structures
        if not stripped or stripped.startswith('//') or stripped.startswith('/*'):
            continue
        # Lines ending with {, }, or being part of multi-line don't need ;
        if stripped.endswith(('{', '}', ',', '(', ')')):
            continue
        # Control structures don't need semicolons
        if any(stripped.startswith(kw) for kw in ['if', 'else', 'for', 'while', 'do', 'switch', 'case', 'default', 'try', 'catch', 'finally', 'class', 'interface', 'enum', 'public', 'private', 'protected', '@']):
            continue
        # Otherwise, check for semicolon (but be lenient for snippets)
        # This check is too strict, so commenting out
        # if not stripped.endswith(';'):
        #     logger.debug(f"Java validation: WARN - Line without semicolon: {stripped[:50]}")
    
    logger.debug("Java syntax validation (heuristic): PASS")
    return True


def validate_batch(
    code_list: list[str],
    lang: str
) -> list[bool]:
    """
    Validate multiple code snippets.
    
    Args:
        code_list: List of source code strings
        lang: Programming language
        
    Returns:
        List of boolean validation results (parallel to input)
        
    Examples:
        >>> codes = ["def foo(): pass", "def bar(): pass"]
        >>> results = validate_batch(codes, "python")
        >>> len(results)
        2
        >>> all(results)
        True
    """
    results = []
    for i, code in enumerate(code_list):
        is_valid = is_syntax_ok(code, lang)
        results.append(is_valid)
        if not is_valid:
            logger.info(f"Validation failed for snippet {i}")
    
    return results


def get_validation_stats(
    code_list: list[str],
    lang: str
) -> dict[str, Any]:
    """
    Validate code snippets and return statistics.
    
    Args:
        code_list: List of source code strings
        lang: Programming language
        
    Returns:
        Dictionary with validation statistics:
            - total: Total number of snippets
            - valid: Number of valid snippets
            - invalid: Number of invalid snippets
            - valid_rate: Percentage of valid snippets
            - results: List of boolean validation results
            
    Examples:
        >>> codes = ["def foo(): pass", "def bar(: pass"]
        >>> stats = get_validation_stats(codes, "python")
        >>> stats["total"]
        2
        >>> stats["valid"]
        1
        >>> stats["invalid"]
        1
    """
    results = validate_batch(code_list, lang)
    
    total = len(results)
    valid = sum(results)
    invalid = total - valid
    valid_rate = (valid / total * 100) if total > 0 else 0.0
    
    return {
        "total": total,
        "valid": valid,
        "invalid": invalid,
        "valid_rate": valid_rate,
        "results": results
    }


def filter_valid_code(
    code_list: list[str],
    lang: str
) -> list[str]:
    """
    Filter out invalid code snippets.
    
    Args:
        code_list: List of source code strings
        lang: Programming language
        
    Returns:
        List containing only valid code snippets
        
    Examples:
        >>> codes = ["def foo(): pass", "def bar("]
        >>> valid = filter_valid_code(codes, "python")
        >>> len(valid)
        1
    """
    results = validate_batch(code_list, lang)
    return [code for code, is_valid in zip(code_list, results) if is_valid]


def validate_pairs(
    pairs: list[tuple[str, str]],
    lang: str
) -> list[bool]:
    """
    Validate that both codes in each pair are syntactically valid.
    
    Useful for validating clone pairs before adding to dataset.
    
    Args:
        pairs: List of (code_a, code_b) tuples
        lang: Programming language
        
    Returns:
        List of booleans indicating if both codes in pair are valid
        
    Examples:
        >>> pairs = [("def foo(): pass", "def bar(): pass")]
        >>> validate_pairs(pairs, "python")
        [True]
    """
    results = []
    for code_a, code_b in pairs:
        valid_a = is_syntax_ok(code_a, lang)
        valid_b = is_syntax_ok(code_b, lang)
        results.append(valid_a and valid_b)
    
    return results


# Unit tests
def test_python_valid():
    """Test valid Python code."""
    code = "def foo():\n    x = 1\n    return x"
    assert is_syntax_ok(code, "python") == True
    print("✓ Python valid syntax test passed")


def test_python_invalid():
    """Test invalid Python code."""
    code = "def foo(\n    x = 1"  # Missing closing paren
    assert is_syntax_ok(code, "python") == False
    print("✓ Python invalid syntax test passed")


def test_java_valid():
    """Test valid Java code (heuristic)."""
    code = "public class Test { public void foo() { } }"
    assert is_syntax_ok(code, "java") == True
    print("✓ Java valid syntax test passed")


def test_java_invalid_braces():
    """Test Java with unbalanced braces."""
    code = "public class Test { public void foo() { }"  # Missing }
    assert is_syntax_ok(code, "java") == False
    print("✓ Java invalid braces test passed")


def test_java_invalid_parens():
    """Test Java with unbalanced parentheses."""
    code = "public void foo( { }"  # Missing )
    assert is_syntax_ok(code, "java") == False
    print("✓ Java invalid parentheses test passed")


def test_validate_batch():
    """Test batch validation."""
    codes = [
        "def foo(): pass",
        "def bar(): return 1",
        "def baz(: pass"  # Invalid
    ]
    results = validate_batch(codes, "python")
    assert len(results) == 3
    assert results[0] == True
    assert results[1] == True
    assert results[2] == False
    print("✓ Batch validation test passed")


def test_get_validation_stats():
    """Test validation statistics."""
    codes = ["def foo(): pass", "def bar("]
    stats = get_validation_stats(codes, "python")
    
    assert stats["total"] == 2
    assert stats["valid"] == 1
    assert stats["invalid"] == 1
    assert stats["valid_rate"] == 50.0
    print("✓ Validation stats test passed")


def test_filter_valid_code():
    """Test filtering valid code."""
    codes = ["def foo(): pass", "def bar(", "def baz(): return 1"]
    valid = filter_valid_code(codes, "python")
    assert len(valid) == 2
    assert "def foo(): pass" in valid
    assert "def baz(): return 1" in valid
    print("✓ Filter valid code test passed")


def test_validate_pairs():
    """Test pair validation."""
    pairs = [
        ("def foo(): pass", "def bar(): pass"),  # Both valid
        ("def foo(): pass", "def bar("),  # Second invalid
    ]
    results = validate_pairs(pairs, "python")
    assert results[0] == True
    assert results[1] == False
    print("✓ Pair validation test passed")


def test_empty_code():
    """Test empty code handling."""
    assert is_syntax_ok("", "python") == False
    assert is_syntax_ok("   ", "python") == False
    print("✓ Empty code test passed")


if __name__ == "__main__":
    # Run tests
    print("Running static validation tests...\n")
    
    test_python_valid()
    test_python_invalid()
    test_java_valid()
    test_java_invalid_braces()
    test_java_invalid_parens()
    test_validate_batch()
    test_get_validation_stats()
    test_filter_valid_code()
    test_validate_pairs()
    test_empty_code()
    
    print("\nAll tests passed!")
    
    # Example usage
    print("\n--- Example Usage ---")
    
    python_code = """def calculate_sum(numbers):
    total = 0
    for num in numbers:
        total += num
    return total"""
    
    print("Valid Python code:")
    print(python_code)
    print(f"Validation: {is_syntax_ok(python_code, 'python')}")
    
    invalid_python = "def foo(\n    pass"
    print("\nInvalid Python code:")
    print(invalid_python)
    print(f"Validation: {is_syntax_ok(invalid_python, 'python')}")
    
    java_code = """public int add(int a, int b) {
    return a + b;
}"""
    
    print("\nValid Java code (heuristic):")
    print(java_code)
    print(f"Validation: {is_syntax_ok(java_code, 'java')}")
    
    print("\n--- Pipeline Integration ---")
    print("""
# In your clone generation pipeline:

# Generate Type-1 variant
from src.generation.type1 import produce_type1_variant

original = "def foo(x):\\n    return x * 2"
variant = produce_type1_variant(original, "python")

# Validate both original and variant
if is_syntax_ok(original, "python") and is_syntax_ok(variant, "python"):
    # Add to dataset
    dataset.append({
        "code_1": original,
        "code_2": variant,
        "clone_type": "type1",
        "label": 1
    })
else:
    print("Skipping invalid pair")

# Batch validation for efficiency
code_variants = [produce_type1_variant(code, lang) for code in originals]
valid_variants = filter_valid_code(code_variants, lang)
print(f"Generated {len(code_variants)} variants, {len(valid_variants)} valid")

# Validate pairs before export
stats = get_validation_stats(code_variants, lang)
print(f"Validation rate: {stats['valid_rate']:.1f}%")
""")
    
    print("\n--- Java Validation Limitations ---")
    print("""
**Important**: Java validation uses heuristics only.

Limitations:
- Checks brace/paren/bracket balance only
- Cannot validate actual Java grammar
- May miss semantic errors
- Cannot check type compatibility
- Braces in strings can cause issues

For production:
1. Use JavaParser library:
   from javaparser import parse
   try:
       parse(java_code)
       return True
   except:
       return False

2. Use tree-sitter:
   from tree_sitter import Language, Parser
   parser = Parser()
   parser.set_language(Language('build/java.so', 'java'))
   tree = parser.parse(bytes(code, 'utf8'))
   return not tree.root_node.has_error

3. Use javac integration:
   import subprocess
   result = subprocess.run(['javac', '-'], input=code, ...)
   return result.returncode == 0
""")
