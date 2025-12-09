"""
Code extraction module for CodeNet submissions.

Handles scanning, filtering, and extracting code submissions from
raw data directories for clone detection dataset generation.
"""

import logging
import shutil
from pathlib import Path
from typing import List

logger = logging.getLogger(__name__)


def list_codenet_submissions(raw_data_dir: str, lang: str) -> List[str]:
    """
    List all code submission files for a given language.
    
    Scans the raw_data_dir/{lang} directory and returns paths to all
    files with the appropriate extension (.java or .py).
    
    Args:
        raw_data_dir: Root directory containing raw data
        lang: Language identifier ('java' or 'python')
        
    Returns:
        List of file paths as strings
        
    Example:
        >>> files = list_codenet_submissions("./data/raw", "python")
        >>> print(f"Found {len(files)} Python files")
        Found 150 Python files
        
        >>> files = list_codenet_submissions("./data/raw", "java")
        >>> all(f.endswith('.java') for f in files)
        True
    """
    # Determine file extension based on language
    lang_lower = lang.lower()
    if lang_lower == "python":
        extension = ".py"
    elif lang_lower == "java":
        extension = ".java"
    else:
        logger.warning(f"Unsupported language: {lang}, defaulting to .{lang} extension")
        extension = f".{lang}"
    
    # Build path to language directory
    lang_dir = Path(raw_data_dir) / lang
    
    if not lang_dir.exists():
        logger.warning(f"Language directory does not exist: {lang_dir}")
        return []
    
    if not lang_dir.is_dir():
        logger.error(f"Path is not a directory: {lang_dir}")
        return []
    
    logger.info(f"Scanning for {lang} files in: {lang_dir}")
    
    # Find all files with the appropriate extension
    file_paths: List[str] = []
    
    # Use rglob for recursive search
    for file_path in lang_dir.rglob(f"*{extension}"):
        if file_path.is_file():
            file_paths.append(str(file_path))
    
    logger.info(f"Found {len(file_paths)} {lang} files")
    
    return sorted(file_paths)


def extract_accepted_submissions(
    raw_data_dir: str,
    out_dir: str,
    lang: str
) -> List[str]:
    """
    Extract and copy accepted submissions to output directory.
    
    For testing purposes, assumes every file is accepted. Copies files
    from raw_data_dir/{lang} to out_dir/{lang}/accepted/ while preserving
    the original filename.
    
    Args:
        raw_data_dir: Root directory containing raw data
        out_dir: Output directory for extracted files
        lang: Language identifier ('java' or 'python')
        
    Returns:
        List of saved file paths as strings
        
    Raises:
        OSError: If file operations fail
        
    Example:
        >>> saved = extract_accepted_submissions("./data/raw", "./data/work", "python")
        >>> print(f"Extracted {len(saved)} accepted submissions")
        Extracted 150 accepted submissions
        
        >>> all("accepted" in path for path in saved)
        True
    """
    # List all submissions for the language
    submission_files = list_codenet_submissions(raw_data_dir, lang)
    
    if not submission_files:
        logger.warning(f"No {lang} submissions found in {raw_data_dir}")
        return []
    
    # Create output directory structure
    accepted_dir = Path(out_dir) / lang / "accepted"
    accepted_dir.mkdir(parents=True, exist_ok=True)
    
    logger.info(f"Extracting {len(submission_files)} accepted {lang} submissions to: {accepted_dir}")
    
    saved_paths: List[str] = []
    success_count = 0
    error_count = 0
    
    for source_path_str in submission_files:
        source_path = Path(source_path_str)
        
        # Use original filename
        filename = source_path.name
        dest_path = accepted_dir / filename
        
        # Handle duplicate filenames by adding suffix
        if dest_path.exists():
            stem = source_path.stem
            suffix = source_path.suffix
            counter = 1
            while dest_path.exists():
                dest_path = accepted_dir / f"{stem}_{counter}{suffix}"
                counter += 1
            logger.debug(f"Renamed duplicate file to: {dest_path.name}")
        
        try:
            # Copy file to destination
            shutil.copy2(source_path, dest_path)
            saved_paths.append(str(dest_path))
            success_count += 1
            
            logger.debug(f"Copied: {source_path.name} -> {dest_path}")
            
        except Exception as e:
            logger.error(f"Failed to copy {source_path}: {e}")
            error_count += 1
            continue
    
    logger.info(
        f"Extraction complete: {success_count} successful, {error_count} failed"
    )
    
    return sorted(saved_paths)


def get_language_extension(lang: str) -> str:
    """
    Get file extension for a given language.
    
    Args:
        lang: Language identifier
        
    Returns:
        File extension including dot (e.g., '.py', '.java')
        
    Example:
        >>> get_language_extension("python")
        '.py'
        >>> get_language_extension("java")
        '.java'
    """
    lang_lower = lang.lower()
    
    extension_map = {
        "python": ".py",
        "java": ".java",
        "javascript": ".js",
        "cpp": ".cpp",
        "c": ".c",
    }
    
    return extension_map.get(lang_lower, f".{lang}")


def count_submissions_by_language(raw_data_dir: str) -> dict[str, int]:
    """
    Count submissions for each language in raw data directory.
    
    Args:
        raw_data_dir: Root directory containing raw data
        
    Returns:
        Dictionary mapping language names to file counts
        
    Example:
        >>> counts = count_submissions_by_language("./data/raw")
        >>> print(counts)
        {'java': 200, 'python': 150}
    """
    raw_path = Path(raw_data_dir)
    
    if not raw_path.exists():
        logger.warning(f"Raw data directory does not exist: {raw_data_dir}")
        return {}
    
    counts: dict[str, int] = {}
    
    # Iterate through language subdirectories
    for lang_dir in raw_path.iterdir():
        if lang_dir.is_dir():
            lang = lang_dir.name
            files = list_codenet_submissions(raw_data_dir, lang)
            counts[lang] = len(files)
    
    logger.info(f"Submission counts by language: {counts}")
    
    return counts


def filter_submissions_by_size(
    file_paths: List[str],
    min_lines: int = 5,
    max_lines: int = 500
) -> List[str]:
    """
    Filter submissions by line count.
    
    Args:
        file_paths: List of file paths to filter
        min_lines: Minimum number of lines (inclusive)
        max_lines: Maximum number of lines (inclusive)
        
    Returns:
        Filtered list of file paths
        
    Example:
        >>> files = ["file1.py", "file2.py", "file3.py"]
        >>> filtered = filter_submissions_by_size(files, min_lines=10, max_lines=100)
    """
    filtered_paths: List[str] = []
    
    for file_path_str in file_paths:
        file_path = Path(file_path_str)
        
        if not file_path.exists():
            logger.warning(f"File not found: {file_path}")
            continue
        
        try:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                line_count = sum(1 for _ in f)
            
            if min_lines <= line_count <= max_lines:
                filtered_paths.append(file_path_str)
            else:
                logger.debug(f"Filtered out {file_path.name}: {line_count} lines")
                
        except Exception as e:
            logger.error(f"Error reading file {file_path}: {e}")
            continue
    
    logger.info(
        f"Filtered {len(file_paths)} files to {len(filtered_paths)} "
        f"(lines: {min_lines}-{max_lines})"
    )
    
    return filtered_paths
