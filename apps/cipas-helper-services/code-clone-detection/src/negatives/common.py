"""
Common utilities for hard negative generation.

This module provides shared helper functions for generating textual and
structural hard negatives. These utilities focus on lexical and structural
analysis without heavy dependencies.

Functions:
    extract_identifiers: Extract identifier tokens from code
    random_identifier_shuffle: Shuffle identifier mappings deterministically
    normalize_whitespace_and_comments: Remove comments and normalize whitespace
    compute_jaccard: Calculate Jaccard similarity between token sets
    compute_levenshtein_ratio: Calculate normalized edit distance
"""

import keyword
import random
import re
from typing import Any


# Python and Java keywords to exclude
PYTHON_KEYWORDS = set(keyword.kwlist) | {
    'self', 'cls', 'True', 'False', 'None'
}

JAVA_KEYWORDS = {
    'abstract', 'assert', 'boolean', 'break', 'byte', 'case', 'catch',
    'char', 'class', 'const', 'continue', 'default', 'do', 'double',
    'else', 'enum', 'extends', 'final', 'finally', 'float', 'for',
    'goto', 'if', 'implements', 'import', 'instanceof', 'int', 'interface',
    'long', 'native', 'new', 'package', 'private', 'protected', 'public',
    'return', 'short', 'static', 'strictfp', 'super', 'switch', 'synchronized',
    'this', 'throw', 'throws', 'transient', 'try', 'void', 'volatile', 'while',
}


def extract_identifiers(code: str, lang: str = "python") -> list[str]:
    """
    Extract identifiers from code using regex.
    
    Filters out language keywords to return only user-defined identifiers.
    
    Args:
        code: Source code string
        lang: Programming language ("python" or "java")
        
    Returns:
        List of identifier strings (may contain duplicates for frequency)
        
    Examples:
        >>> code = "def calculate(num):\\n    result = num * 2\\n    return result"
        >>> ids = extract_identifiers(code, "python")
        >>> "calculate" in ids and "num" in ids
        True
        >>> "def" not in ids and "return" not in ids
        True
    """
    # Pattern for valid identifiers
    pattern = r'\b[a-zA-Z_][a-zA-Z0-9_]*\b'
    
    # Extract all matches
    identifiers = re.findall(pattern, code)
    
    # Filter keywords based on language
    if lang.lower() == "python":
        excluded = PYTHON_KEYWORDS
    elif lang.lower() == "java":
        excluded = JAVA_KEYWORDS
    else:
        excluded = set()
    
    # Keep identifiers that are not keywords
    filtered = [ident for ident in identifiers if ident not in excluded]
    
    return filtered


def random_identifier_shuffle(
    code: str,
    identifiers: list[str],
    seed: int
) -> str:
    """
    Shuffle identifier mappings deterministically.
    
    Creates a random permutation of identifiers and applies the mapping
    to the code. Preserves semantics while changing lexical appearance.
    
    Args:
        code: Source code string
        identifiers: List of identifiers to shuffle
        seed: Random seed for deterministic shuffling
        
    Returns:
        Code with shuffled identifier names
        
    Examples:
        >>> code = "x = 1\\ny = 2\\nz = x + y"
        >>> ids = ["x", "y", "z"]
        >>> shuffled = random_identifier_shuffle(code, ids, seed=42)
        >>> shuffled != code  # Names changed
        True
    """
    if not identifiers:
        return code
    
    # Get unique identifiers while preserving order
    unique_ids = []
    seen = set()
    for ident in identifiers:
        if ident not in seen:
            unique_ids.append(ident)
            seen.add(ident)
    
    # Create shuffled mapping
    rng = random.Random(seed)
    shuffled = unique_ids.copy()
    rng.shuffle(shuffled)
    
    # Create mapping
    mapping = dict(zip(unique_ids, shuffled))
    
    # Apply mapping (sort by length to avoid partial replacements)
    result = code
    for old_name in sorted(mapping.keys(), key=len, reverse=True):
        new_name = mapping[old_name]
        # Use word boundaries to match complete identifiers only
        pattern = r'\b' + re.escape(old_name) + r'\b'
        result = re.sub(pattern, new_name, result)
    
    return result


def normalize_whitespace_and_comments(code: str, lang: str = "python") -> str:
    """
    Remove comments and normalize whitespace for similarity comparison.
    
    Args:
        code: Source code string
        lang: Programming language
        
    Returns:
        Normalized code string
        
    Examples:
        >>> code = "x = 1  # comment\\n\\n\\ny = 2"
        >>> normalized = normalize_whitespace_and_comments(code, "python")
        >>> "# comment" not in normalized
        True
    """
    result = code
    
    # Remove comments based on language
    if lang.lower() == "python":
        # Remove Python comments (# to end of line)
        result = re.sub(r'#.*$', '', result, flags=re.MULTILINE)
        # Remove docstrings (simplified - may not catch all cases)
        result = re.sub(r'""".*?"""', '', result, flags=re.DOTALL)
        result = re.sub(r"'''.*?'''", '', result, flags=re.DOTALL)
    
    elif lang.lower() == "java":
        # Remove single-line comments
        result = re.sub(r'//.*$', '', result, flags=re.MULTILINE)
        # Remove multi-line comments
        result = re.sub(r'/\*.*?\*/', '', result, flags=re.DOTALL)
    
    # Normalize whitespace
    # Replace multiple spaces with single space
    result = re.sub(r' +', ' ', result)
    # Replace multiple newlines with single newline
    result = re.sub(r'\n+', '\n', result)
    # Strip leading/trailing whitespace
    result = result.strip()
    
    return result


def compute_jaccard(tokens_a: list[str], tokens_b: list[str]) -> float:
    """
    Calculate Jaccard similarity between token lists.
    
    Jaccard similarity = |intersection| / |union|
    
    Args:
        tokens_a: First token list
        tokens_b: Second token list
        
    Returns:
        Similarity score between 0.0 and 1.0
        
    Examples:
        >>> compute_jaccard(["a", "b", "c"], ["b", "c", "d"])
        0.5
        >>> compute_jaccard(["a", "b"], ["a", "b"])
        1.0
        >>> compute_jaccard(["a"], ["b"])
        0.0
    """
    if not tokens_a and not tokens_b:
        return 1.0
    
    if not tokens_a or not tokens_b:
        return 0.0
    
    set_a = set(tokens_a)
    set_b = set(tokens_b)
    
    intersection = len(set_a & set_b)
    union = len(set_a | set_b)
    
    if union == 0:
        return 0.0
    
    return intersection / union


def compute_levenshtein_ratio(seq_a: list[Any], seq_b: list[Any]) -> float:
    """
    Calculate normalized Levenshtein (edit) distance ratio.
    
    Ratio = 1 - (edit_distance / max_length)
    
    Args:
        seq_a: First sequence
        seq_b: Second sequence
        
    Returns:
        Similarity ratio between 0.0 and 1.0
        
    Examples:
        >>> compute_levenshtein_ratio(["a", "b", "c"], ["a", "b", "d"])
        0.666...
        >>> compute_levenshtein_ratio(["a"], ["a"])
        1.0
    """
    # Compute edit distance
    m, n = len(seq_a), len(seq_b)
    
    if m == 0 and n == 0:
        return 1.0
    
    if m == 0 or n == 0:
        return 0.0
    
    # Dynamic programming matrix
    dp = [[0] * (n + 1) for _ in range(m + 1)]
    
    # Initialize first row and column
    for i in range(m + 1):
        dp[i][0] = i
    for j in range(n + 1):
        dp[0][j] = j
    
    # Fill matrix
    for i in range(1, m + 1):
        for j in range(1, n + 1):
            if seq_a[i - 1] == seq_b[j - 1]:
                cost = 0
            else:
                cost = 1
            
            dp[i][j] = min(
                dp[i - 1][j] + 1,      # deletion
                dp[i][j - 1] + 1,      # insertion
                dp[i - 1][j - 1] + cost  # substitution
            )
    
    edit_distance = dp[m][n]
    max_length = max(m, n)
    
    # Normalize to ratio
    ratio = 1.0 - (edit_distance / max_length)
    return ratio


def extract_problem_id(file_id: str) -> str:
    """
    Extract problem ID from file identifier.
    
    Uses same logic as other modules for consistency.
    
    Args:
        file_id: File identifier (e.g., "prob_001_sub_1")
        
    Returns:
        Problem ID (e.g., "prob_001")
        
    Examples:
        >>> extract_problem_id("prob_001_sub_1.py")
        'prob_001'
        >>> extract_problem_id("p123_s1.java")
        'p123'
    """
    # Remove extension
    name = file_id.rsplit('.', 1)[0] if '.' in file_id else file_id
    
    # Check for common patterns
    if "_sub_" in name:
        return name.split("_sub_")[0]
    elif "_solution_" in name:
        return name.split("_solution_")[0]
    elif "_" in name:
        return name.split("_")[0]
    else:
        return name


def count_return_statements(code: str) -> int:
    """
    Count return statements in code (heuristic).
    
    Args:
        code: Source code string
        
    Returns:
        Number of return statements found
        
    Examples:
        >>> count_return_statements("def foo():\\n    return 1")
        1
        >>> count_return_statements("def bar():\\n    if x:\\n        return 1\\n    return 2")
        2
    """
    # Simple pattern matching for return statements
    pattern = r'\breturn\b'
    matches = re.findall(pattern, code)
    return len(matches)


def extract_operators(code: str) -> set[str]:
    """
    Extract operators used in code.
    
    Args:
        code: Source code string
        
    Returns:
        Set of operator strings
        
    Examples:
        >>> ops = extract_operators("x = a + b * c")
        >>> "+" in ops and "*" in ops and "=" in ops
        True
    """
    # Common operators
    operator_pattern = r'[+\-*/%=<>!&|^~]+'
    operators = re.findall(operator_pattern, code)
    return set(operators)


def extract_constants(code: str) -> list[str]:
    """
    Extract numeric and string constants from code.
    
    Args:
        code: Source code string
        
    Returns:
        List of constant strings
        
    Examples:
        >>> consts = extract_constants("x = 42; y = 'hello'")
        >>> "42" in consts
        True
    """
    constants = []
    
    # Find numeric constants
    numbers = re.findall(r'\b\d+\.?\d*\b', code)
    constants.extend(numbers)
    
    # Find string constants (simplified)
    strings = re.findall(r'"[^"]*"', code)
    strings.extend(re.findall(r"'[^']*'", code))
    constants.extend(strings)
    
    return constants


# Unit tests
def test_extract_identifiers():
    """Test identifier extraction."""
    code = "def calculate(num):\n    result = num * 2\n    return result"
    ids = extract_identifiers(code, "python")
    
    assert "calculate" in ids
    assert "num" in ids
    assert "result" in ids
    assert "def" not in ids
    assert "return" not in ids
    
    print("✓ Extract identifiers test passed")


def test_random_identifier_shuffle():
    """Test identifier shuffling."""
    code = "x = 1\ny = 2\nz = x + y"
    ids = ["x", "y", "z"]
    
    shuffled1 = random_identifier_shuffle(code, ids, seed=42)
    shuffled2 = random_identifier_shuffle(code, ids, seed=42)
    
    # Deterministic
    assert shuffled1 == shuffled2
    
    print("✓ Identifier shuffle test passed")


def test_normalize_whitespace():
    """Test whitespace normalization."""
    code = "x = 1  # comment\n\n\ny = 2"
    normalized = normalize_whitespace_and_comments(code, "python")
    
    assert "# comment" not in normalized
    assert normalized.count('\n') < code.count('\n')
    
    print("✓ Normalize whitespace test passed")


def test_compute_jaccard():
    """Test Jaccard similarity."""
    assert compute_jaccard(["a", "b", "c"], ["b", "c", "d"]) == 0.5
    assert compute_jaccard(["a", "b"], ["a", "b"]) == 1.0
    assert compute_jaccard(["a"], ["b"]) == 0.0
    
    print("✓ Jaccard similarity test passed")


def test_compute_levenshtein():
    """Test Levenshtein ratio."""
    ratio = compute_levenshtein_ratio(["a", "b", "c"], ["a", "b", "d"])
    assert 0.6 < ratio < 0.7
    
    ratio = compute_levenshtein_ratio(["a"], ["a"])
    assert ratio == 1.0
    
    print("✓ Levenshtein ratio test passed")


def test_extract_problem_id():
    """Test problem ID extraction."""
    assert extract_problem_id("prob_001_sub_1.py") == "prob_001"
    assert extract_problem_id("p123_s1.java") == "p123"
    
    print("✓ Problem ID extraction test passed")


if __name__ == "__main__":
    print("Running common utilities tests...\n")
    
    test_extract_identifiers()
    test_random_identifier_shuffle()
    test_normalize_whitespace()
    test_compute_jaccard()
    test_compute_levenshtein()
    test_extract_problem_id()
    
    print("\nAll tests passed!")
