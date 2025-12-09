"""
Code canonicalization module.

Provides functions for normalizing code by replacing literals and
standardizing formatting to enable better clone detection.
"""

import logging
import re
from typing import Tuple

logger = logging.getLogger(__name__)


def canonicalize(code: str, lang: str) -> str:
    """
    Canonicalize code by normalizing formatting and replacing literals.
    
    Performs the following transformations:
    1. Remove leading/trailing whitespace
    2. Collapse multiple spaces to single space
    3. Replace string literals with LIT_STR token
    4. Replace numeric literals with LIT_NUM token
    
    This helps identify structural clones regardless of literal values.
    
    Args:
        code: Source code string
        lang: Programming language ('python' or 'java')
        
    Returns:
        Canonicalized code string
        
    Example:
        >>> code = 'x = "hello" + 42'
        >>> canonicalize(code, 'python')
        'x = LIT_STR + LIT_NUM'
        
        >>> code = 'String s = "test"; int n = 100;'
        >>> canonicalize(code, 'java')
        'String s = LIT_STR; int n = LIT_NUM;'
    """
    if not isinstance(code, str):
        logger.warning(f"Non-string input to canonicalize: {type(code)}")
        code = str(code)
    
    lang_lower = lang.lower()
    
    logger.debug(f"Canonicalizing {lang} code ({len(code)} chars)")
    
    # Step 1: Remove leading/trailing whitespace
    code = code.strip()
    
    # Step 2: Replace string and numeric literals
    code = _replace_literals(code, lang_lower)
    
    # Step 3: Collapse multiple spaces to single space
    code = re.sub(r'\s+', ' ', code)
    
    logger.debug(f"Canonicalized code ({len(code)} chars)")
    
    return code


def _replace_literals(code: str, lang: str) -> str:
    """
    Replace string and numeric literals with placeholder tokens.
    
    Internal helper function used by canonicalize.
    
    Args:
        code: Source code string
        lang: Programming language ('python' or 'java')
        
    Returns:
        Code with literals replaced
        
    Example:
        >>> _replace_literals('"hello" + 42', 'python')
        'LIT_STR + LIT_NUM'
    """
    # Replace string literals
    if lang == 'python':
        code = _replace_python_strings(code)
    elif lang == 'java':
        code = _replace_java_strings(code)
    else:
        # Generic string replacement for other languages
        code = _replace_generic_strings(code)
    
    # Replace numeric literals (works for both Python and Java)
    code = _replace_numbers(code)
    
    return code


def _replace_python_strings(code: str) -> str:
    """
    Replace Python string literals with LIT_STR token.
    
    Handles single quotes, double quotes, triple quotes, and raw strings.
    
    Args:
        code: Python source code
        
    Returns:
        Code with string literals replaced
    """
    # Replace triple-quoted strings first (multiline)
    # Triple double quotes
    code = re.sub(r'""".*?"""', 'LIT_STR', code, flags=re.DOTALL)
    # Triple single quotes
    code = re.sub(r"'''.*?'''", 'LIT_STR', code, flags=re.DOTALL)
    
    # Replace raw strings
    code = re.sub(r'r"[^"]*"', 'LIT_STR', code)
    code = re.sub(r"r'[^']*'", 'LIT_STR', code)
    
    # Replace double-quoted strings
    code = re.sub(r'"[^"]*"', 'LIT_STR', code)
    
    # Replace single-quoted strings
    code = re.sub(r"'[^']*'", 'LIT_STR', code)
    
    return code


def _replace_java_strings(code: str) -> str:
    """
    Replace Java string literals with LIT_STR token.
    
    Handles double-quoted strings and character literals.
    
    Args:
        code: Java source code
        
    Returns:
        Code with string literals replaced
    """
    # Replace character literals (single quotes)
    code = re.sub(r"'[^']*'", 'LIT_STR', code)
    
    # Replace string literals (double quotes)
    # Handle escaped quotes
    code = re.sub(r'"(?:[^"\\]|\\.)*"', 'LIT_STR', code)
    
    return code


def _replace_generic_strings(code: str) -> str:
    """
    Replace string literals with LIT_STR token (generic approach).
    
    Args:
        code: Source code
        
    Returns:
        Code with string literals replaced
    """
    # Replace double-quoted strings
    code = re.sub(r'"[^"]*"', 'LIT_STR', code)
    
    # Replace single-quoted strings
    code = re.sub(r"'[^']*'", 'LIT_STR', code)
    
    return code


def _replace_numbers(code: str) -> str:
    """
    Replace numeric literals with LIT_NUM token.
    
    Handles integers, floats, hex, octal, and binary numbers.
    
    Args:
        code: Source code
        
    Returns:
        Code with numeric literals replaced
        
    Example:
        >>> _replace_numbers('x = 42 + 3.14')
        'x = LIT_NUM + LIT_NUM'
    """
    # Replace hex numbers (0x...)
    code = re.sub(r'\b0[xX][0-9a-fA-F]+\b', 'LIT_NUM', code)
    
    # Replace binary numbers (0b...)
    code = re.sub(r'\b0[bB][01]+\b', 'LIT_NUM', code)
    
    # Replace octal numbers (0o... or leading 0)
    code = re.sub(r'\b0[oO]?[0-7]+\b', 'LIT_NUM', code)
    
    # Replace floating point numbers (with decimal point or scientific notation)
    code = re.sub(r'\b\d+\.\d+(?:[eE][+-]?\d+)?\b', 'LIT_NUM', code)
    code = re.sub(r'\b\d+[eE][+-]?\d+\b', 'LIT_NUM', code)
    
    # Replace integers
    code = re.sub(r'\b\d+\b', 'LIT_NUM', code)
    
    return code


def canonicalize_batch(code_list: list[str], lang: str) -> list[str]:
    """
    Canonicalize multiple code snippets in batch.
    
    Args:
        code_list: List of code strings
        lang: Programming language
        
    Returns:
        List of canonicalized code strings
        
    Example:
        >>> codes = ['x = 1', 'y = 2', 'z = 3']
        >>> canonicalize_batch(codes, 'python')
        ['x = LIT_NUM', 'y = LIT_NUM', 'z = LIT_NUM']
    """
    logger.info(f"Canonicalizing batch of {len(code_list)} code snippets")
    
    canonicalized = [canonicalize(code, lang) for code in code_list]
    
    logger.info(f"Batch canonicalization complete")
    
    return canonicalized


def get_canonicalization_stats(original: str, canonicalized: str) -> dict[str, int]:
    """
    Get statistics about canonicalization transformation.
    
    Args:
        original: Original code string
        canonicalized: Canonicalized code string
        
    Returns:
        Dictionary with statistics
        
    Example:
        >>> original = 'x = "hello" + 42'
        >>> canonical = canonicalize(original, 'python')
        >>> stats = get_canonicalization_stats(original, canonical)
        >>> stats['original_length']
        16
    """
    # Count literals replaced
    lit_str_count = canonicalized.count('LIT_STR')
    lit_num_count = canonicalized.count('LIT_NUM')
    
    stats = {
        'original_length': len(original),
        'canonicalized_length': len(canonicalized),
        'size_reduction': len(original) - len(canonicalized),
        'string_literals_replaced': lit_str_count,
        'numeric_literals_replaced': lit_num_count,
        'total_literals_replaced': lit_str_count + lit_num_count,
    }
    
    return stats
