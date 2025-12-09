"""
File system utilities for code file discovery and handling.

Provides functions to scan directories, filter files, and read code files.
"""

import logging
from pathlib import Path
from typing import Generator, List, Optional

logger = logging.getLogger(__name__)


def scan_directory(
    directory: str | Path,
    extensions: Optional[List[str]] = None,
    recursive: bool = True,
    exclude_patterns: Optional[List[str]] = None
) -> List[Path]:
    """
    Scan directory for files with specified extensions.
    
    Args:
        directory: Directory path to scan
        extensions: List of file extensions to include (e.g., [".py", ".java"])
        recursive: Whether to scan subdirectories
        exclude_patterns: Patterns to exclude (e.g., ["__pycache__", ".git"])
        
    Returns:
        List of Path objects for matched files
        
    Example:
        >>> files = scan_directory("data/raw", extensions=[".py"], recursive=True)
        >>> len(files)
        42
    """
    directory = Path(directory)
    
    if not directory.exists():
        logger.warning(f"Directory does not exist: {directory}")
        return []
    
    if not directory.is_dir():
        logger.warning(f"Path is not a directory: {directory}")
        return []
    
    # Default exclusions
    if exclude_patterns is None:
        exclude_patterns = ["__pycache__", ".git", ".venv", "node_modules", ".pytest_cache"]
    
    # Normalize extensions
    if extensions:
        extensions = [ext if ext.startswith('.') else f'.{ext}' for ext in extensions]
    
    matched_files: List[Path] = []
    
    # Use rglob for recursive, glob for non-recursive
    pattern = "**/*" if recursive else "*"
    
    for file_path in directory.glob(pattern):
        # Skip if not a file
        if not file_path.is_file():
            continue
        
        # Check exclusions
        if any(pattern in str(file_path) for pattern in exclude_patterns):
            continue
        
        # Check extensions
        if extensions and file_path.suffix not in extensions:
            continue
        
        matched_files.append(file_path)
    
    logger.info(f"Found {len(matched_files)} files in {directory}")
    return matched_files


def read_file_content(file_path: str | Path, encoding: str = 'utf-8') -> str:
    """
    Read content from a file.
    
    Args:
        file_path: Path to the file
        encoding: File encoding (default: utf-8)
        
    Returns:
        File content as string
        
    Raises:
        FileNotFoundError: If file doesn't exist
        UnicodeDecodeError: If file encoding is incorrect
    """
    file_path = Path(file_path)
    
    if not file_path.exists():
        raise FileNotFoundError(f"File not found: {file_path}")
    
    logger.debug(f"Reading file: {file_path}")
    
    with open(file_path, 'r', encoding=encoding) as f:
        content = f.read()
    
    return content


def iter_files(
    directory: str | Path,
    extensions: Optional[List[str]] = None,
    batch_size: int = 10
) -> Generator[List[Path], None, None]:
    """
    Iterate over files in batches (memory efficient).
    
    Args:
        directory: Directory to scan
        extensions: File extensions to include
        batch_size: Number of files per batch
        
    Yields:
        Batches of file paths
        
    Example:
        >>> for batch in iter_files("data/raw", extensions=[".py"], batch_size=5):
        ...     process_batch(batch)
    """
    files = scan_directory(directory, extensions=extensions)
    
    for i in range(0, len(files), batch_size):
        batch = files[i:i + batch_size]
        yield batch


def get_relative_path(file_path: Path, base_path: Path) -> str:
    """
    Get relative path from base path.
    
    Args:
        file_path: File path
        base_path: Base directory path
        
    Returns:
        Relative path as string
    """
    try:
        return str(file_path.relative_to(base_path))
    except ValueError:
        # Not relative, return absolute path
        return str(file_path)


def ensure_directory(directory: str | Path) -> Path:
    """
    Ensure directory exists, create if it doesn't.
    
    Args:
        directory: Directory path
        
    Returns:
        Path object for the directory
    """
    directory = Path(directory)
    directory.mkdir(parents=True, exist_ok=True)
    logger.debug(f"Ensured directory exists: {directory}")
    return directory
