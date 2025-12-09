"""
Type-2 clone generation for code clone detection.

Type-2 clones are syntactically identical but differ in identifiers and literal
values. This module generates Type-2 variants by systematically renaming
identifiers while preserving keywords and language constructs.

Transformations include:
- Renaming variables to var_0, var_1, var_2, etc.
- Renaming functions to func_0, func_1, func_2, etc.
- Preserving language keywords and built-in types
- Maintaining consistent renaming across all occurrences

Functions:
    alpha_rename: Generate a Type-2 clone by renaming identifiers
    _extract_identifiers: Find all identifiers in code
    _create_rename_mapping: Build deterministic identifier mapping
    _apply_renaming: Apply rename mapping to code
"""

import hashlib
import keyword
import logging
import random
import re
from typing import Any

logger = logging.getLogger(__name__)

# Python keywords (already in keyword module, but defining for clarity)
PYTHON_KEYWORDS = set(keyword.kwlist) | {
    'self', 'cls', 'True', 'False', 'None'
}

# Common Java keywords and types
JAVA_KEYWORDS = {
    # Keywords
    'abstract', 'assert', 'boolean', 'break', 'byte', 'case', 'catch',
    'char', 'class', 'const', 'continue', 'default', 'do', 'double',
    'else', 'enum', 'extends', 'final', 'finally', 'float', 'for',
    'goto', 'if', 'implements', 'import', 'instanceof', 'int', 'interface',
    'long', 'native', 'new', 'package', 'private', 'protected', 'public',
    'return', 'short', 'static', 'strictfp', 'super', 'switch', 'synchronized',
    'this', 'throw', 'throws', 'transient', 'try', 'void', 'volatile', 'while',
    # Common types
    'String', 'Integer', 'Long', 'Double', 'Float', 'Boolean', 'Character',
    'Byte', 'Short', 'Object', 'Class', 'System', 'Math', 'List', 'Map',
    'Set', 'ArrayList', 'HashMap', 'HashSet', 'Collection', 'Collections',
    # Common methods (to avoid breaking standard library calls)
    'println', 'print', 'length', 'size', 'get', 'put', 'add', 'remove',
    'contains', 'isEmpty', 'clear', 'toString', 'equals', 'hashCode',
    'compareTo', 'valueOf', 'parseInt', 'parseDouble', 'parseLong',
}

# Identifier pattern (valid identifier starting with letter or underscore)
IDENTIFIER_PATTERN = r'\b[a-zA-Z_][a-zA-Z0-9_]*\b'


def alpha_rename(code: str, lang: str, seed: int | None = None) -> str:
    """
    Generate a Type-2 clone by renaming identifiers systematically.
    
    Type-2 clones are syntactically identical but differ in identifier names
    and literal values. This function renames all user-defined identifiers
    while preserving language keywords and built-in constructs.
    
    **Heuristic approach**: Uses regex to find identifiers. May not handle
    all edge cases like identifiers in strings or comments.
    
    Args:
        code: Original source code
        lang: Programming language ("python" or "java")
        seed: Random seed for deterministic renaming. If None, generates
              seed from code hash.
              
    Returns:
        Type-2 variant with renamed identifiers
        
    Examples:
        >>> code = "def calculate(num):\\n    result = num * 2\\n    return result"
        >>> renamed = alpha_rename(code, "python", seed=42)
        >>> "calculate" not in renamed  # Function name changed
        True
        >>> "def" in renamed  # Keyword preserved
        True
        >>> # Same seed produces same output
        >>> renamed2 = alpha_rename(code, "python", seed=42)
        >>> renamed == renamed2
        True
        
        >>> java_code = "public int add(int x, int y) { return x + y; }"
        >>> java_renamed = alpha_rename(java_code, "java", seed=42)
        >>> "public" in java_renamed  # Keyword preserved
        True
        >>> "int" in java_renamed  # Built-in type preserved
        True
    """
    if not code or not code.strip():
        logger.warning("Empty or whitespace-only code provided")
        return code
    
    # Generate seed if not provided
    if seed is None:
        seed = _generate_seed_from_code(code)
    
    # Extract identifiers from code
    identifiers = _extract_identifiers(code, lang)
    
    if not identifiers:
        logger.warning(f"No identifiers found to rename in {lang} code")
        return code
    
    # Create deterministic rename mapping
    rename_map = _create_rename_mapping(identifiers, seed)
    
    # Apply renaming
    renamed_code = _apply_renaming(code, rename_map)
    
    logger.debug(f"Renamed {len(rename_map)} identifiers (seed={seed})")
    return renamed_code


def _generate_seed_from_code(code: str) -> int:
    """
    Generate a deterministic seed from code content.
    
    Args:
        code: Source code string
        
    Returns:
        Integer seed for random number generator
    """
    hash_digest = hashlib.md5(code.encode('utf-8')).hexdigest()
    seed = int(hash_digest[:8], 16)
    return seed


def _extract_identifiers(code: str, lang: str) -> set[str]:
    """
    Extract all user-defined identifiers from code.
    
    Uses regex to find identifier patterns and filters out language keywords
    and built-in types.
    
    **Limitations**: May include identifiers from comments or strings.
    
    Args:
        code: Source code
        lang: Programming language
        
    Returns:
        Set of unique identifiers to rename
    """
    # Find all potential identifiers
    all_matches = re.findall(IDENTIFIER_PATTERN, code)
    
    # Determine which keywords to exclude
    if lang.lower() == "python":
        excluded = PYTHON_KEYWORDS
    elif lang.lower() == "java":
        excluded = JAVA_KEYWORDS
    else:
        logger.warning(f"Unsupported language: {lang}. Using minimal exclusions.")
        excluded = set()
    
    # Filter out keywords and reserved words
    identifiers = {match for match in all_matches if match not in excluded}
    
    return identifiers


def _create_rename_mapping(identifiers: set[str], seed: int) -> dict[str, str]:
    """
    Create a deterministic mapping from old to new identifier names.
    
    Identifiers are sorted alphabetically and assigned new names sequentially:
    - Variables: var_0, var_1, var_2, ...
    - Functions: detected heuristically and named func_0, func_1, ...
    
    For simplicity, this implementation uses generic var_N naming for all
    identifiers. A more sophisticated approach could differentiate based on
    context (function definitions, class names, etc.).
    
    Args:
        identifiers: Set of identifiers to rename
        seed: Random seed for deterministic ordering
        
    Returns:
        Dictionary mapping old names to new names
    """
    # Sort identifiers for deterministic ordering
    sorted_ids = sorted(identifiers)
    
    # Use seeded RNG to shuffle (provides variation while staying deterministic)
    rng = random.Random(seed)
    rng.shuffle(sorted_ids)
    
    # Create mapping
    rename_map = {}
    for i, old_name in enumerate(sorted_ids):
        # Use generic var_N naming
        # Could be enhanced to use func_N for function names, class_N for classes, etc.
        new_name = f"var_{i}"
        rename_map[old_name] = new_name
    
    return rename_map


def _apply_renaming(code: str, rename_map: dict[str, str]) -> str:
    """
    Apply identifier renaming to code using word boundary matching.
    
    Uses regex word boundaries to ensure we only replace complete identifiers,
    not substrings within other identifiers.
    
    **Important**: Applies replacements in order of decreasing length to avoid
    partial replacements (e.g., replacing "var" before "variable").
    
    Args:
        code: Original source code
        rename_map: Mapping from old to new identifier names
        
    Returns:
        Code with identifiers renamed
    """
    # Sort by length (longest first) to avoid partial replacements
    sorted_items = sorted(rename_map.items(), key=lambda x: len(x[0]), reverse=True)
    
    result = code
    for old_name, new_name in sorted_items:
        # Use word boundaries to match complete identifiers only
        pattern = r'\b' + re.escape(old_name) + r'\b'
        result = re.sub(pattern, new_name, result)
    
    return result


def alpha_rename_with_stats(
    code: str,
    lang: str,
    seed: int | None = None
) -> dict[str, Any]:
    """
    Perform alpha renaming and return statistics.
    
    Args:
        code: Original source code
        lang: Programming language
        seed: Random seed for deterministic renaming
        
    Returns:
        Dictionary with keys:
            - renamed_code (str): Code with renamed identifiers
            - rename_map (dict): Mapping of old to new names
            - num_identifiers (int): Number of identifiers renamed
            - seed (int): Seed used for renaming
            
    Examples:
        >>> code = "def foo(x):\\n    return x * 2"
        >>> result = alpha_rename_with_stats(code, "python", seed=42)
        >>> result["num_identifiers"] >= 2
        True
        >>> "renamed_code" in result
        True
    """
    if seed is None:
        seed = _generate_seed_from_code(code)
    
    identifiers = _extract_identifiers(code, lang)
    rename_map = _create_rename_mapping(identifiers, seed)
    renamed_code = _apply_renaming(code, rename_map)
    
    return {
        "renamed_code": renamed_code,
        "rename_map": rename_map,
        "num_identifiers": len(rename_map),
        "seed": seed
    }


def batch_alpha_rename(
    code_list: list[str],
    lang: str,
    seed: int | None = None
) -> list[str]:
    """
    Apply alpha renaming to multiple code snippets.
    
    Each snippet is renamed independently with its own derived seed
    (based on base seed + index).
    
    Args:
        code_list: List of source code strings
        lang: Programming language
        seed: Base random seed
        
    Returns:
        List of renamed code snippets
        
    Examples:
        >>> codes = ["def foo(): pass", "def bar(): pass"]
        >>> renamed = batch_alpha_rename(codes, "python", seed=42)
        >>> len(renamed)
        2
    """
    if seed is None:
        seed = 42  # Default seed
    
    results = []
    for i, code in enumerate(code_list):
        # Derive unique seed for each snippet
        snippet_seed = seed + i
        renamed = alpha_rename(code, lang, seed=snippet_seed)
        results.append(renamed)
    
    return results


# Unit tests
def test_alpha_rename_python():
    """Test Python identifier renaming."""
    code = "def calculate(num):\n    result = num * 2\n    return result"
    renamed = alpha_rename(code, "python", seed=42)
    
    # Keywords should be preserved
    assert "def" in renamed
    assert "return" in renamed
    
    # Identifiers should be renamed
    assert "var_" in renamed
    
    print("✓ Python rename test passed")


def test_alpha_rename_java():
    """Test Java identifier renaming."""
    code = "public int add(int x, int y) { return x + y; }"
    renamed = alpha_rename(code, "java", seed=42)
    
    # Keywords and types should be preserved
    assert "public" in renamed
    assert "int" in renamed
    assert "return" in renamed
    
    # User identifiers should be renamed
    assert "var_" in renamed
    
    print("✓ Java rename test passed")


def test_alpha_rename_deterministic():
    """Test that renaming is deterministic."""
    code = "def foo(x):\n    return x * 2"
    renamed1 = alpha_rename(code, "python", seed=42)
    renamed2 = alpha_rename(code, "python", seed=42)
    
    assert renamed1 == renamed2
    print("✓ Deterministic rename test passed")


def test_extract_identifiers_python():
    """Test identifier extraction for Python."""
    code = "def foo(x):\n    result = x + 1\n    return result"
    identifiers = _extract_identifiers(code, "python")
    
    # Should include user identifiers
    assert "foo" in identifiers
    assert "x" in identifiers
    assert "result" in identifiers
    
    # Should exclude keywords
    assert "def" not in identifiers
    assert "return" not in identifiers
    
    print("✓ Python identifier extraction test passed")


def test_extract_identifiers_java():
    """Test identifier extraction for Java."""
    code = "public int add(int x, int y) { return x + y; }"
    identifiers = _extract_identifiers(code, "java")
    
    # Should include user identifiers
    assert "add" in identifiers
    assert "x" in identifiers
    assert "y" in identifiers
    
    # Should exclude keywords and types
    assert "public" not in identifiers
    assert "int" not in identifiers
    assert "return" not in identifiers
    
    print("✓ Java identifier extraction test passed")


def test_create_rename_mapping():
    """Test rename mapping creation."""
    identifiers = {"foo", "bar", "baz"}
    rename_map = _create_rename_mapping(identifiers, seed=42)
    
    assert len(rename_map) == 3
    assert all(new_name.startswith("var_") for new_name in rename_map.values())
    
    # Test determinism
    rename_map2 = _create_rename_mapping(identifiers, seed=42)
    assert rename_map == rename_map2
    
    print("✓ Rename mapping test passed")


def test_apply_renaming():
    """Test applying renaming to code."""
    code = "foo = bar + baz"
    rename_map = {"foo": "var_0", "bar": "var_1", "baz": "var_2"}
    renamed = _apply_renaming(code, rename_map)
    
    assert "var_0" in renamed
    assert "var_1" in renamed
    assert "var_2" in renamed
    assert "foo" not in renamed
    
    print("✓ Apply renaming test passed")


def test_alpha_rename_with_stats():
    """Test renaming with statistics."""
    code = "def foo(x):\n    return x * 2"
    result = alpha_rename_with_stats(code, "python", seed=42)
    
    assert "renamed_code" in result
    assert "rename_map" in result
    assert "num_identifiers" in result
    assert "seed" in result
    assert result["num_identifiers"] > 0
    
    print("✓ Rename with stats test passed")


def test_batch_alpha_rename():
    """Test batch renaming."""
    codes = ["def foo(): pass", "def bar(): pass"]
    renamed = batch_alpha_rename(codes, "python", seed=42)
    
    assert len(renamed) == 2
    assert all(isinstance(code, str) for code in renamed)
    
    print("✓ Batch rename test passed")


def test_empty_code():
    """Test handling of empty code."""
    assert alpha_rename("", "python") == ""
    assert alpha_rename("   ", "python") == "   "
    
    print("✓ Empty code test passed")


if __name__ == "__main__":
    # Run tests
    print("Running Type-2 generation tests...\n")
    
    test_alpha_rename_python()
    test_alpha_rename_java()
    test_alpha_rename_deterministic()
    test_extract_identifiers_python()
    test_extract_identifiers_java()
    test_create_rename_mapping()
    test_apply_renaming()
    test_alpha_rename_with_stats()
    test_batch_alpha_rename()
    test_empty_code()
    
    print("\nAll tests passed!")
    
    # Example usage
    print("\n--- Example Usage ---")
    
    python_example = """def calculate_sum(numbers):
    total = 0
    for num in numbers:
        total += num
    return total"""
    
    print("Original Python:")
    print(python_example)
    print("\nRenamed Python:")
    print(alpha_rename(python_example, "python", seed=42))
    
    java_example = """public int factorial(int n) {
    if (n <= 1) return 1;
    return n * factorial(n - 1);
}"""
    
    print("\n\nOriginal Java:")
    print(java_example)
    print("\nRenamed Java:")
    print(alpha_rename(java_example, "java", seed=42))
