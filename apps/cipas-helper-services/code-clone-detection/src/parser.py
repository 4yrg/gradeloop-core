"""
Code parser for extracting code fragments from source files.

Provides basic parsing functionality without heavy AST dependencies.
"""

import hashlib
import logging
import re
from pathlib import Path
from typing import List, Optional

from .models import CodeFragment, CodeMetrics

logger = logging.getLogger(__name__)


def extract_fragments_from_file(
    file_path: str | Path,
    language: str,
    min_lines: int = 5,
    extract_functions: bool = True,
    extract_classes: bool = True
) -> List[CodeFragment]:
    """
    Extract code fragments from a source file.
    
    Args:
        file_path: Path to source file
        language: Programming language
        min_lines: Minimum lines for a fragment
        extract_functions: Whether to extract functions
        extract_classes: Whether to extract classes
        
    Returns:
        List of CodeFragment objects
        
    Example:
        >>> fragments = extract_fragments_from_file("main.py", "python", min_lines=5)
        >>> len(fragments)
        3
    """
    file_path = Path(file_path)
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
    except Exception as e:
        logger.error(f"Failed to read file {file_path}: {e}")
        return []
    
    lines = content.split('\n')
    fragments: List[CodeFragment] = []
    
    # Use simple pattern matching for now (can be extended with tree-sitter)
    if language.lower() == "python":
        fragments.extend(_extract_python_fragments(
            file_path, lines, min_lines, extract_functions, extract_classes
        ))
    elif language.lower() in ["java", "javascript", "cpp"]:
        fragments.extend(_extract_c_style_fragments(
            file_path, lines, language, min_lines, extract_functions, extract_classes
        ))
    else:
        logger.warning(f"Unsupported language: {language}")
    
    logger.info(f"Extracted {len(fragments)} fragments from {file_path}")
    return fragments


def _extract_python_fragments(
    file_path: Path,
    lines: List[str],
    min_lines: int,
    extract_functions: bool,
    extract_classes: bool
) -> List[CodeFragment]:
    """Extract fragments from Python source code."""
    fragments: List[CodeFragment] = []
    
    i = 0
    while i < len(lines):
        line = lines[i].strip()
        
        # Detect function definition
        if extract_functions and line.startswith('def '):
            start_line = i + 1  # 1-indexed
            end_line = _find_python_block_end(lines, i)
            
            if (end_line - start_line + 1) >= min_lines:
                content = '\n'.join(lines[i:end_line])
                fragment = _create_fragment(file_path, start_line, end_line, "python", content)
                fragments.append(fragment)
            
            i = end_line
            continue
        
        # Detect class definition
        if extract_classes and line.startswith('class '):
            start_line = i + 1
            end_line = _find_python_block_end(lines, i)
            
            if (end_line - start_line + 1) >= min_lines:
                content = '\n'.join(lines[i:end_line])
                fragment = _create_fragment(file_path, start_line, end_line, "python", content)
                fragments.append(fragment)
            
            i = end_line
            continue
        
        i += 1
    
    return fragments


def _find_python_block_end(lines: List[str], start_idx: int) -> int:
    """Find the end of a Python code block based on indentation."""
    if start_idx >= len(lines):
        return start_idx
    
    # Get base indentation
    base_indent = len(lines[start_idx]) - len(lines[start_idx].lstrip())
    
    i = start_idx + 1
    while i < len(lines):
        line = lines[i]
        
        # Skip empty lines
        if not line.strip():
            i += 1
            continue
        
        # Check indentation
        current_indent = len(line) - len(line.lstrip())
        if current_indent <= base_indent:
            return i
        
        i += 1
    
    return len(lines)


def _extract_c_style_fragments(
    file_path: Path,
    lines: List[str],
    language: str,
    min_lines: int,
    extract_functions: bool,
    extract_classes: bool
) -> List[CodeFragment]:
    """Extract fragments from C-style languages (Java, JavaScript, C++)."""
    fragments: List[CodeFragment] = []
    
    # Simple brace-matching parser
    i = 0
    while i < len(lines):
        line = lines[i].strip()
        
        # Detect function/method (simplified pattern)
        if extract_functions and ('(' in line and ')' in line and '{' in line):
            start_line = i + 1
            end_line = _find_brace_block_end(lines, i)
            
            if (end_line - start_line + 1) >= min_lines:
                content = '\n'.join(lines[i:end_line])
                fragment = _create_fragment(file_path, start_line, end_line, language, content)
                fragments.append(fragment)
            
            i = end_line
            continue
        
        # Detect class
        if extract_classes and 'class ' in line and '{' in line:
            start_line = i + 1
            end_line = _find_brace_block_end(lines, i)
            
            if (end_line - start_line + 1) >= min_lines:
                content = '\n'.join(lines[i:end_line])
                fragment = _create_fragment(file_path, start_line, end_line, language, content)
                fragments.append(fragment)
            
            i = end_line
            continue
        
        i += 1
    
    return fragments


def _find_brace_block_end(lines: List[str], start_idx: int) -> int:
    """Find matching closing brace."""
    brace_count = 0
    i = start_idx
    
    while i < len(lines):
        line = lines[i]
        brace_count += line.count('{')
        brace_count -= line.count('}')
        
        if brace_count == 0 and i > start_idx:
            return i + 1
        
        i += 1
    
    return len(lines)


def _create_fragment(
    file_path: Path,
    start_line: int,
    end_line: int,
    language: str,
    content: str
) -> CodeFragment:
    """Create a CodeFragment with computed metrics."""
    tokens = tokenize_code(content, language)
    ast_hash = compute_ast_hash(content)
    
    metrics = CodeMetrics(
        loc=len([line for line in content.split('\n') if line.strip()]),
        complexity=1,  # Simplified
        token_count=len(tokens)
    )
    
    return CodeFragment(
        file_path=str(file_path),
        start_line=start_line,
        end_line=end_line,
        language=language,
        content=content,
        tokens=tokens,
        ast_hash=ast_hash,
        metrics=metrics
    )


def tokenize_code(code: str, language: str) -> List[str]:
    """
    Simple tokenization of code (splits on whitespace and symbols).
    
    Args:
        code: Source code string
        language: Programming language
        
    Returns:
        List of tokens
    """
    # Remove comments (simplified)
    if language.lower() == "python":
        code = re.sub(r'#.*$', '', code, flags=re.MULTILINE)
    else:
        code = re.sub(r'//.*$', '', code, flags=re.MULTILINE)
        code = re.sub(r'/\*.*?\*/', '', code, flags=re.DOTALL)
    
    # Split on whitespace and common symbols
    tokens = re.findall(r'\w+|[^\w\s]', code)
    return [t for t in tokens if t.strip()]


def compute_ast_hash(code: str) -> str:
    """
    Compute a hash representing the code structure.
    
    Args:
        code: Source code string
        
    Returns:
        Hash string (simplified, not true AST)
    """
    # Normalize: remove whitespace, comments, etc.
    normalized = re.sub(r'\s+', '', code)
    normalized = re.sub(r'["\'].*?["\']', 'STR', normalized)  # Replace strings
    normalized = re.sub(r'\d+', 'NUM', normalized)  # Replace numbers
    
    return hashlib.sha256(normalized.encode()).hexdigest()[:16]
