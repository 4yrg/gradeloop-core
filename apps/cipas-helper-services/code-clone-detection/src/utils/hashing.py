"""
Hashing utilities for code clone detection.

Provides functions for computing hashes and fingerprints of code,
including normalized hashes that ignore formatting differences.
"""

import hashlib
import logging
import re
from typing import Optional

logger = logging.getLogger(__name__)


def compute_md5(text: str) -> str:
    """
    Compute MD5 hash of text.
    
    Args:
        text: Input text string
        
    Returns:
        Hexadecimal MD5 hash string (32 characters)
        
    Example:
        >>> compute_md5("hello world")
        '5eb63bbbe01eeed093cb22bb8f5acdc3'
        >>> compute_md5("")
        'd41d8cd98f00b204e9800998ecf8427e'
    """
    if not isinstance(text, str):
        logger.warning(f"Non-string input to compute_md5: {type(text)}")
        text = str(text)
    
    # Encode to bytes and compute hash
    hash_obj = hashlib.md5(text.encode('utf-8'))
    hash_hex = hash_obj.hexdigest()
    
    logger.debug(f"Computed MD5 hash: {hash_hex[:8]}... (length: {len(text)})")
    
    return hash_hex


def compute_normalized_token_hash(code: str) -> str:
    """
    Compute normalized hash of code by removing formatting differences.
    
    This function normalizes code by:
    1. Removing single-line comments (# and //)
    2. Removing multi-line comments (/* */ and ''' ''')
    3. Removing all whitespace
    4. Converting to lowercase
    5. Computing MD5 hash
    
    This helps identify structurally similar code regardless of formatting.
    
    Args:
        code: Source code string
        
    Returns:
        Hexadecimal MD5 hash of normalized code
        
    Example:
        >>> code1 = "def foo():\\n    return 42"
        >>> code2 = "def foo():return 42"
        >>> compute_normalized_token_hash(code1) == compute_normalized_token_hash(code2)
        True
        
        >>> code_with_comment = "def foo():\\n    # comment\\n    return 42"
        >>> hash1 = compute_normalized_token_hash(code_with_comment)
        >>> hash2 = compute_normalized_token_hash(code1)
        >>> hash1 == hash2
        True
    """
    if not isinstance(code, str):
        logger.warning(f"Non-string input to compute_normalized_token_hash: {type(code)}")
        code = str(code)
    
    # Remove single-line comments (# for Python, // for Java/C++)
    code = re.sub(r'#.*$', '', code, flags=re.MULTILINE)
    code = re.sub(r'//.*$', '', code, flags=re.MULTILINE)
    
    # Remove multi-line comments (/* */ for Java/C++)
    code = re.sub(r'/\*.*?\*/', '', code, flags=re.DOTALL)
    
    # Remove Python multi-line strings/comments (''' and """)
    code = re.sub(r'""".*?"""', '', code, flags=re.DOTALL)
    code = re.sub(r"'''.*?'''", '', code, flags=re.DOTALL)
    
    # Remove all whitespace (spaces, tabs, newlines)
    code = re.sub(r'\s+', '', code)
    
    # Convert to lowercase for case-insensitive comparison
    code = code.lower()
    
    # Compute MD5 hash of normalized code
    hash_value = compute_md5(code)
    
    logger.debug(f"Computed normalized token hash: {hash_value[:8]}...")
    
    return hash_value


def compute_sha256(text: str) -> str:
    """
    Compute SHA256 hash of text (more secure than MD5).
    
    Args:
        text: Input text string
        
    Returns:
        Hexadecimal SHA256 hash string (64 characters)
        
    Example:
        >>> compute_sha256("hello world")
        'b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9'
    """
    if not isinstance(text, str):
        text = str(text)
    
    hash_obj = hashlib.sha256(text.encode('utf-8'))
    return hash_obj.hexdigest()


def compute_code_fingerprint(
    code: str,
    algorithm: str = "md5",
    normalize: bool = True
) -> str:
    """
    Compute fingerprint of code with configurable options.
    
    Args:
        code: Source code string
        algorithm: Hash algorithm ('md5' or 'sha256')
        normalize: Whether to normalize code before hashing
        
    Returns:
        Hexadecimal hash string
        
    Raises:
        ValueError: If algorithm is not supported
        
    Example:
        >>> code = "def foo():\\n    return 42"
        >>> fp1 = compute_code_fingerprint(code, algorithm="md5", normalize=True)
        >>> fp2 = compute_code_fingerprint(code, algorithm="sha256", normalize=True)
        >>> len(fp1), len(fp2)
        (32, 64)
    """
    if algorithm not in ["md5", "sha256"]:
        raise ValueError(f"Unsupported algorithm: {algorithm}. Use 'md5' or 'sha256'.")
    
    # Normalize if requested
    if normalize:
        code = _normalize_code(code)
    
    # Compute hash
    if algorithm == "md5":
        return compute_md5(code)
    else:
        return compute_sha256(code)


def _normalize_code(code: str) -> str:
    """
    Normalize code by removing comments and whitespace.
    
    Internal helper function used by compute_normalized_token_hash
    and compute_code_fingerprint.
    
    Args:
        code: Source code string
        
    Returns:
        Normalized code string
    """
    # Remove single-line comments
    code = re.sub(r'#.*$', '', code, flags=re.MULTILINE)
    code = re.sub(r'//.*$', '', code, flags=re.MULTILINE)
    
    # Remove multi-line comments
    code = re.sub(r'/\*.*?\*/', '', code, flags=re.DOTALL)
    code = re.sub(r'""".*?"""', '', code, flags=re.DOTALL)
    code = re.sub(r"'''.*?'''", '', code, flags=re.DOTALL)
    
    # Remove whitespace and lowercase
    code = re.sub(r'\s+', '', code)
    code = code.lower()
    
    return code


def compute_structural_hash(code: str, language: Optional[str] = None) -> str:
    """
    Compute structural hash focusing on code structure.
    
    This is a more aggressive normalization that also:
    - Removes string literals (replaced with placeholder)
    - Removes numeric literals (replaced with placeholder)
    
    Args:
        code: Source code string
        language: Programming language (for language-specific handling)
        
    Returns:
        Hexadecimal MD5 hash of structural representation
        
    Example:
        >>> code1 = 'x = "hello" + str(42)'
        >>> code2 = 'x = "world" + str(99)'
        >>> h1 = compute_structural_hash(code1)
        >>> h2 = compute_structural_hash(code2)
        >>> # Should be similar since structure is the same
    """
    # Start with normalized code
    normalized = _normalize_code(code)
    
    # Replace string literals with placeholder
    normalized = re.sub(r'"[^"]*"', 'STR', normalized)
    normalized = re.sub(r"'[^']*'", 'STR', normalized)
    
    # Replace numeric literals with placeholder
    normalized = re.sub(r'\b\d+\.?\d*\b', 'NUM', normalized)
    
    # Compute hash
    hash_value = compute_md5(normalized)
    
    logger.debug(f"Computed structural hash: {hash_value[:8]}...")
    
    return hash_value
