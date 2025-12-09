"""
Function extraction for code clone detection.

This module provides heuristic-based extraction of top-level functions from
source code. The implementation uses regex patterns and simple indentation
analysis rather than full AST parsing for simplicity and cross-language support.

**Note**: These are heuristic approaches and may not handle all edge cases.
For production use, consider using language-specific parsers like:
- Python: ast.parse() or libcst
- Java: tree-sitter or JavaParser

Functions:
    extract_top_level_functions: Extract functions from code by language
    _extract_python_functions: Extract Python function definitions
    _extract_java_methods: Extract Java method definitions
    _determine_python_function_end: Find end of Python function by indentation
    _determine_java_method_end: Find end of Java method by brace matching
"""

import logging
import re
from typing import Any

logger = logging.getLogger(__name__)


def extract_top_level_functions(code: str, lang: str) -> list[dict[str, Any]]:
    """
    Extract top-level functions/methods from source code.
    
    Uses heuristic regex-based extraction. This is not a full parser and may
    miss edge cases like nested functions, lambdas, or unusual formatting.
    
    Args:
        code: Source code string
        lang: Programming language ("python" or "java")
        
    Returns:
        List of dictionaries with keys:
            - name (str): Function/method name
            - code (str): Complete function code including signature
            - start_line (int): Starting line number (0-indexed)
            - end_line (int): Ending line number (0-indexed)
            
    Examples:
        >>> code = '''
        ... def hello(name):
        ...     return f"Hello {name}"
        ...
        ... def goodbye():
        ...     return "Bye"
        ... '''
        >>> funcs = extract_top_level_functions(code, "python")
        >>> len(funcs)
        2
        >>> funcs[0]["name"]
        'hello'
        
        >>> java_code = '''
        ... public class Test {
        ...     public int add(int a, int b) {
        ...         return a + b;
        ...     }
        ... }
        ... '''
        >>> methods = extract_top_level_functions(java_code, "java")
        >>> len(methods)
        1
        >>> methods[0]["name"]
        'add'
    """
    lang_lower = lang.lower()
    
    if lang_lower == "python":
        return _extract_python_functions(code)
    elif lang_lower == "java":
        return _extract_java_methods(code)
    else:
        logger.warning(f"Unsupported language: {lang}. Returning empty list.")
        return []


def _extract_python_functions(code: str) -> list[dict[str, Any]]:
    """
    Extract top-level Python function definitions using regex and indentation.
    
    **Heuristic approach**: Matches `def function_name(...):`  at the start of
    a line (no leading whitespace) and determines function end by tracking
    indentation. Does not handle nested functions, decorators spanning multiple
    lines, or unusual indentation styles.
    
    Args:
        code: Python source code
        
    Returns:
        List of function dictionaries with name, code, start_line, end_line
    """
    functions = []
    lines = code.split('\n')
    
    # Pattern: def <name>(...): at line start (top-level only)
    # Captures function name
    func_pattern = re.compile(r'^def\s+(\w+)\s*\([^)]*\)\s*:', re.MULTILINE)
    
    for match in func_pattern.finditer(code):
        func_name = match.group(1)
        start_pos = match.start()
        
        # Find line number
        start_line = code[:start_pos].count('\n')
        
        # Determine end of function by indentation
        end_line = _determine_python_function_end(lines, start_line)
        
        # Extract function code
        func_code = '\n'.join(lines[start_line:end_line + 1])
        
        functions.append({
            "name": func_name,
            "code": func_code,
            "start_line": start_line,
            "end_line": end_line
        })
        
        logger.debug(f"Extracted Python function '{func_name}' "
                    f"(lines {start_line}-{end_line})")
    
    return functions


def _determine_python_function_end(lines: list[str], start_line: int) -> int:
    """
    Determine where a Python function ends by tracking indentation.
    
    **Heuristic**: A function ends when we encounter a line with same or less
    indentation than the function definition line, or at EOF. Ignores blank
    lines and comments when checking indentation.
    
    Args:
        lines: List of source code lines
        start_line: Line index where function definition starts
        
    Returns:
        Line index where function ends (inclusive)
    """
    if start_line >= len(lines):
        return start_line
    
    # Base indentation (should be 0 for top-level)
    base_indent = len(lines[start_line]) - len(lines[start_line].lstrip())
    
    end_line = start_line
    
    # Scan forward to find end of function body
    for i in range(start_line + 1, len(lines)):
        line = lines[i]
        stripped = line.strip()
        
        # Skip empty lines and comments
        if not stripped or stripped.startswith('#'):
            end_line = i
            continue
        
        # Check indentation
        current_indent = len(line) - len(line.lstrip())
        
        # If indentation is same or less than base, function ended
        if current_indent <= base_indent:
            break
        
        end_line = i
    
    return end_line


def _extract_java_methods(code: str) -> list[dict[str, Any]]:
    """
    Extract Java method definitions using regex and brace matching.
    
    **Heuristic approach**: Matches method signatures with access modifiers
    (public, private, protected) and determines method end by counting braces.
    Does not handle:
    - Methods without access modifiers (package-private)
    - Nested classes
    - Anonymous classes
    - Complex generics
    - Multi-line method signatures with unusual formatting
    
    Args:
        code: Java source code
        
    Returns:
        List of method dictionaries with name, code, start_line, end_line
    """
    methods = []
    lines = code.split('\n')
    
    # Pattern: (public|private|protected) ... methodName(...) {
    # Captures method name
    # Matches: modifiers, optional keywords (static, final, etc), return type, name, params
    method_pattern = re.compile(
        r'^\s*(public|private|protected)\s+'  # Access modifier
        r'(?:static\s+|final\s+|abstract\s+|synchronized\s+)*'  # Optional keywords
        r'(?:<[^>]+>\s+)?'  # Optional generic type parameters
        r'([\w<>\[\]]+)\s+'  # Return type
        r'(\w+)\s*'  # Method name (capture)
        r'\([^)]*\)\s*'  # Parameters
        r'(?:throws\s+[\w\s,]+\s*)?'  # Optional throws
        r'\{',  # Opening brace
        re.MULTILINE
    )
    
    for match in method_pattern.finditer(code):
        method_name = match.group(3)
        start_pos = match.start()
        
        # Find line number
        start_line = code[:start_pos].count('\n')
        
        # Determine end of method by brace matching
        end_line = _determine_java_method_end(code, match.end(), lines, start_line)
        
        # Extract method code
        method_code = '\n'.join(lines[start_line:end_line + 1])
        
        methods.append({
            "name": method_name,
            "code": method_code,
            "start_line": start_line,
            "end_line": end_line
        })
        
        logger.debug(f"Extracted Java method '{method_name}' "
                    f"(lines {start_line}-{end_line})")
    
    return methods


def _determine_java_method_end(
    code: str,
    brace_start_pos: int,
    lines: list[str],
    start_line: int
) -> int:
    """
    Determine where a Java method ends by matching braces.
    
    **Heuristic**: Count opening and closing braces from the method's opening
    brace until they balance. Does not handle braces in strings or comments.
    
    Args:
        code: Complete source code
        brace_start_pos: Character position after opening brace
        lines: List of source code lines
        start_line: Line where method starts
        
    Returns:
        Line index where method ends (inclusive)
    """
    brace_count = 1  # Already counted opening brace
    current_pos = brace_start_pos
    
    # Scan character by character
    while current_pos < len(code) and brace_count > 0:
        char = code[current_pos]
        
        if char == '{':
            brace_count += 1
        elif char == '}':
            brace_count -= 1
            
        current_pos += 1
    
    # Find line number of closing brace
    if brace_count == 0:
        end_line = code[:current_pos].count('\n')
    else:
        # Unmatched braces - return EOF
        end_line = len(lines) - 1
        logger.warning(f"Unmatched braces in Java method starting at line {start_line}")
    
    return end_line


def extract_function_names(code: str, lang: str) -> list[str]:
    """
    Extract only the names of top-level functions (convenience function).
    
    Args:
        code: Source code string
        lang: Programming language
        
    Returns:
        List of function/method names
        
    Examples:
        >>> code = "def foo():\\n    pass\\ndef bar():\\n    pass"
        >>> extract_function_names(code, "python")
        ['foo', 'bar']
    """
    functions = extract_top_level_functions(code, lang)
    return [func["name"] for func in functions]


def count_functions(code: str, lang: str) -> int:
    """
    Count the number of top-level functions in source code.
    
    Args:
        code: Source code string
        lang: Programming language
        
    Returns:
        Number of functions found
        
    Examples:
        >>> count_functions("def a(): pass\\ndef b(): pass", "python")
        2
    """
    return len(extract_top_level_functions(code, lang))
