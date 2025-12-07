"""
Clone Generators for Code Clone Detection

This module implements generators for all types of code clones:
- Type-1: Exact copies with whitespace and comment variations
- Type-2: Copies with renamed identifiers
- Type-3: Copies with structural modifications
- Type-4: Semantically similar but syntactically different implementations

- sample_clone_pairs: Balanced dataset generation with data leakage prevention
- Negative pair generation (easy and hard negatives)
"""

import re
import json
import subprocess
import random
from pathlib import Path
from typing import Set, Dict, List, Tuple, Generator
from tree_sitter import Node

from .parser import PolyglotParser
from .config import CODENET_ROOT, MAX_PAIRS_PER_PROBLEM, TYPE4_THRESHOLD


# Common comment node types across different languages
COMMENT_NODE_TYPES = {
    'c': ['comment'],
    'cpp': ['comment'],
    'c-sharp': ['comment'],
    'java': ['line_comment', 'block_comment'],
    'python': ['comment'],
    'javascript': ['comment'],
    'typescript': ['comment'],
    'go': ['comment'],
    'rust': ['line_comment', 'block_comment'],
    'ruby': ['comment'],
    'php': ['comment'],
    'kotlin': ['comment'],
    'swift': ['comment'],
    'scala': ['comment'],
    'r': ['comment'],
    'matlab': ['comment'],
    'sql': ['comment']
}


def _get_comment_node_types(lang: str) -> Set[str]:
    """
    Get comment node types for a specific language.

    Args:
        lang: Programming language name

    Returns:
        Set of comment node type strings for the language
    """
    # Normalize language name using PolyglotParser's mapping
    parser = PolyglotParser()
    normalized_lang = parser._normalize_language_name(lang)

    # Get comment types for this language, default to generic 'comment'
    return set(COMMENT_NODE_TYPES.get(normalized_lang, ['comment']))


def _traverse_and_collect_non_comments(node: Node, comment_types: Set[str], code_bytes: bytes) -> str:
    """
    Recursively traverse the tree and collect text from non-comment nodes.

    Args:
        node: Current node in the tree
        comment_types: Set of comment node types to exclude
        code_bytes: Original code as bytes for text extraction

    Returns:
        Concatenated text from non-comment nodes
    """
    result_parts = []

    # Skip comment nodes entirely
    if node.type in comment_types:
        return ""

    # If this is a leaf node (no children), extract its text
    if len(node.children) == 0:
        if node.text:
            text = node.text.decode('utf-8') if isinstance(node.text, bytes) else str(node.text)
            result_parts.append(text)
    else:
        # Recursively process children
        for child in node.children:
            child_text = _traverse_and_collect_non_comments(child, comment_types, code_bytes)
            if child_text:
                result_parts.append(child_text)

    return "".join(result_parts)


def _normalize_whitespace(text: str) -> str:
    """
    Normalize whitespace and newlines in the text.

    Args:
        text: Input text to normalize

    Returns:
        Text with normalized whitespace
    """
    # Replace multiple consecutive whitespace characters (spaces, tabs, newlines) with single space
    normalized = re.sub(r'\s+', ' ', text)

    # Remove leading and trailing whitespace
    normalized = normalized.strip()

    return normalized


def generate_type1(code: str, lang: str, parser: PolyglotParser) -> str:
    """
    Generate Type-1 normalized version of code by removing comments and normalizing whitespace.

    Type-1 clones are exact copies with possible variations in whitespace and comments.
    This function:
    1. Parses the code using Tree-sitter
    2. Removes all comment nodes
    3. Collapses whitespace and normalizes newlines
    4. Returns the minified, comment-free string

    Args:
        code: Source code to normalize
        lang: Programming language name (e.g., 'java', 'python', 'cpp')
        parser: PolyglotParser instance for parsing the code

    Returns:
        Normalized code string with comments removed and whitespace collapsed

    Raises:
        ValueError: If the code cannot be parsed
        ImportError: If the language is not supported
    """
    try:
        # Parse the code
        tree = parser.parse(code, lang)

        # Get comment node types for this language
        comment_types = _get_comment_node_types(lang)

        # Convert code to bytes for Tree-sitter text extraction
        code_bytes = code.encode('utf-8')

        # Traverse the tree and collect non-comment text
        filtered_text = _traverse_and_collect_non_comments(
            tree.root_node,
            comment_types,
            code_bytes
        )

        # Normalize whitespace
        normalized_text = _normalize_whitespace(filtered_text)

        return normalized_text

    except Exception as e:
        raise ValueError(f"Failed to generate Type-1 normalized code for language '{lang}': {str(e)}") from e


def generate_type1_batch(code_samples: list, lang: str) -> list:
    """
    Generate Type-1 normalized versions for multiple code samples.

    Args:
        code_samples: List of code strings to normalize
        lang: Programming language name

    Returns:
        List of normalized code strings
    """
    parser = PolyglotParser()
    results = []

    for code in code_samples:
        try:
            normalized = generate_type1(code, lang, parser)
            results.append(normalized)
        except Exception as e:
            # Return empty string for failed normalizations
            print(f"Warning: Failed to normalize code sample: {str(e)}")
            results.append("")

    return results


# Language-specific keyword sets to avoid renaming reserved words
LANGUAGE_KEYWORDS = {
    'python': {
        'and', 'as', 'assert', 'break', 'class', 'continue', 'def', 'del', 'elif', 'else',
        'except', 'exec', 'finally', 'for', 'from', 'global', 'if', 'import', 'in', 'is',
        'lambda', 'not', 'or', 'pass', 'print', 'raise', 'return', 'try', 'while', 'with',
        'yield', 'True', 'False', 'None', '__init__', '__main__', 'self', 'cls'
    },
    'java': {
        'abstract', 'assert', 'boolean', 'break', 'byte', 'case', 'catch', 'char', 'class',
        'const', 'continue', 'default', 'do', 'double', 'else', 'enum', 'extends', 'final',
        'finally', 'float', 'for', 'goto', 'if', 'implements', 'import', 'instanceof', 'int',
        'interface', 'long', 'native', 'new', 'null', 'package', 'private', 'protected',
        'public', 'return', 'short', 'static', 'strictfp', 'super', 'switch', 'synchronized',
        'this', 'throw', 'throws', 'transient', 'try', 'void', 'volatile', 'while', 'true', 'false'
    },
    'javascript': {
        'abstract', 'arguments', 'await', 'boolean', 'break', 'byte', 'case', 'catch', 'char',
        'class', 'const', 'continue', 'debugger', 'default', 'delete', 'do', 'double', 'else',
        'enum', 'eval', 'export', 'extends', 'false', 'final', 'finally', 'float', 'for',
        'function', 'goto', 'if', 'implements', 'import', 'in', 'instanceof', 'int', 'interface',
        'let', 'long', 'native', 'new', 'null', 'package', 'private', 'protected', 'public',
        'return', 'short', 'static', 'super', 'switch', 'synchronized', 'this', 'throw',
        'throws', 'transient', 'true', 'try', 'typeof', 'var', 'void', 'volatile', 'while', 'with', 'yield'
    },
    'cpp': {
        'alignas', 'alignof', 'and', 'and_eq', 'asm', 'auto', 'bitand', 'bitor', 'bool', 'break',
        'case', 'catch', 'char', 'char16_t', 'char32_t', 'class', 'compl', 'const', 'constexpr',
        'const_cast', 'continue', 'decltype', 'default', 'delete', 'do', 'double', 'dynamic_cast',
        'else', 'enum', 'explicit', 'export', 'extern', 'false', 'float', 'for', 'friend', 'goto',
        'if', 'inline', 'int', 'long', 'mutable', 'namespace', 'new', 'noexcept', 'not', 'not_eq',
        'nullptr', 'operator', 'or', 'or_eq', 'private', 'protected', 'public', 'register',
        'reinterpret_cast', 'return', 'short', 'signed', 'sizeof', 'static', 'static_assert',
        'static_cast', 'struct', 'switch', 'template', 'this', 'thread_local', 'throw', 'true',
        'try', 'typedef', 'typeid', 'typename', 'union', 'unsigned', 'using', 'virtual', 'void',
        'volatile', 'wchar_t', 'while', 'xor', 'xor_eq', 'include', 'define', 'ifdef', 'ifndef'
    },
    'c': {
        'auto', 'break', 'case', 'char', 'const', 'continue', 'default', 'do', 'double', 'else',
        'enum', 'extern', 'float', 'for', 'goto', 'if', 'int', 'long', 'register', 'return',
        'short', 'signed', 'sizeof', 'static', 'struct', 'switch', 'typedef', 'union', 'unsigned',
        'void', 'volatile', 'while', 'include', 'define', 'ifdef', 'ifndef'
    },
    'c-sharp': {
        'abstract', 'as', 'base', 'bool', 'break', 'byte', 'case', 'catch', 'char', 'checked',
        'class', 'const', 'continue', 'decimal', 'default', 'delegate', 'do', 'double', 'else',
        'enum', 'event', 'explicit', 'extern', 'false', 'finally', 'fixed', 'float', 'for',
        'foreach', 'goto', 'if', 'implicit', 'in', 'int', 'interface', 'internal', 'is', 'lock',
        'long', 'namespace', 'new', 'null', 'object', 'operator', 'out', 'override', 'params',
        'private', 'protected', 'public', 'readonly', 'ref', 'return', 'sbyte', 'sealed',
        'short', 'sizeof', 'stackalloc', 'static', 'string', 'struct', 'switch', 'this', 'throw',
        'true', 'try', 'typeof', 'uint', 'ulong', 'unchecked', 'unsafe', 'ushort', 'using',
        'virtual', 'void', 'volatile', 'while'
    },
    'go': {
        'break', 'case', 'chan', 'const', 'continue', 'default', 'defer', 'else', 'fallthrough',
        'for', 'func', 'go', 'goto', 'if', 'import', 'interface', 'map', 'package', 'range',
        'return', 'select', 'struct', 'switch', 'type', 'var'
    },
    'rust': {
        'as', 'break', 'const', 'continue', 'crate', 'else', 'enum', 'extern', 'false', 'fn',
        'for', 'if', 'impl', 'in', 'let', 'loop', 'match', 'mod', 'move', 'mut', 'pub', 'ref',
        'return', 'self', 'Self', 'static', 'struct', 'super', 'trait', 'true', 'type', 'unsafe',
        'use', 'where', 'while'
    }
}

# Language-specific node types that should NOT be renamed (imports, module names, etc.)
EXCLUDED_NODE_TYPES = {
    'python': {
        'module', 'import_statement', 'import_from_statement', 'dotted_name', 'aliased_import'
    },
    'java': {
        'package_declaration', 'import_declaration', 'scoped_identifier'
    },
    'javascript': {
        'import_statement', 'export_statement', 'import_specifier', 'export_specifier'
    },
    'cpp': {
        'preproc_include', 'namespace_identifier', 'using_declaration'
    },
    'c': {
        'preproc_include'
    },
    'c-sharp': {
        'using_directive', 'namespace_declaration', 'qualified_name'
    },
    'go': {
        'package_clause', 'import_declaration', 'import_spec'
    },
    'rust': {
        'use_declaration', 'mod_item', 'extern_crate_declaration'
    }
}


def _get_keywords_for_language(lang: str) -> Set[str]:
    """Get language-specific keywords that should not be renamed."""
    parser = PolyglotParser()
    normalized_lang = parser._normalize_language_name(lang)
    return LANGUAGE_KEYWORDS.get(normalized_lang, set())


def _get_excluded_node_types(lang: str) -> Set[str]:
    """Get language-specific node types that should not be renamed."""
    parser = PolyglotParser()
    normalized_lang = parser._normalize_language_name(lang)
    return EXCLUDED_NODE_TYPES.get(normalized_lang, set())


def _is_import_or_module_context(node: Node, excluded_types: Set[str]) -> bool:
    """Check if a node is in an import or module context that should not be renamed."""
    current = node
    while current:
        if current.type in excluded_types:
            return True
        current = current.parent
    return False


def _collect_renameable_identifiers(tree, lang: str) -> List[Tuple[Node, str]]:
    """
    Collect all renameable identifier nodes with their text.

    Args:
        tree: Tree-sitter Tree object
        lang: Programming language name

    Returns:
        List of tuples (node, identifier_text) for identifiers that can be renamed
    """
    parser = PolyglotParser()
    normalized_lang = parser._normalize_language_name(lang)

    # Get identifier node types for this language
    identifier_types = parser.IDENTIFIER_NODE_MAPPINGS.get(normalized_lang, ['identifier'])
    keywords = _get_keywords_for_language(lang)
    excluded_types = _get_excluded_node_types(lang)

    renameable_identifiers = []

    def traverse(node: Node):
        """Recursively traverse and collect renameable identifiers."""
        if node.type in identifier_types:
            # Get the identifier text
            identifier_text = node.text.decode('utf-8') if isinstance(node.text, bytes) else str(node.text)

            # Skip if it's a keyword
            if identifier_text in keywords:
                return

            # Skip if it's in an import/module context
            if _is_import_or_module_context(node, excluded_types):
                return

            # Skip if it starts with underscore (often special/magic methods)
            if identifier_text.startswith('_'):
                return

            # Skip if it's all uppercase (often constants)
            if identifier_text.isupper() and len(identifier_text) > 1:
                return

            renameable_identifiers.append((node, identifier_text))

        # Continue traversing children
        for child in node.children:
            traverse(child)

    traverse(tree.root_node)
    return renameable_identifiers


def _create_identifier_mapping(identifiers: List[Tuple[Node, str]]) -> Dict[str, str]:
    """
    Create a mapping from original identifiers to new variable names.

    Args:
        identifiers: List of (node, identifier_text) tuples

    Returns:
        Dictionary mapping original identifiers to new names (var_1, var_2, etc.)
    """
    unique_identifiers = set()
    for _, identifier_text in identifiers:
        unique_identifiers.add(identifier_text)

    # Sort for consistent ordering
    sorted_identifiers = sorted(unique_identifiers)

    identifier_mapping = {}
    for i, identifier in enumerate(sorted_identifiers, 1):
        identifier_mapping[identifier] = f"var_{i}"

    return identifier_mapping


def generate_type2(code: str, lang: str, parser: PolyglotParser) -> str:
    """
    Generate Type-2 normalized version of code by renaming local variables and function identifiers.

    Type-2 clones are copies with renamed identifiers. This function:
    1. Parses the code using Tree-sitter
    2. Finds all local variable and function identifiers (not keywords or imports)
    3. Renames them consistently to var_1, var_2, etc.
    4. Applies edits from end to start to avoid offset shifts
    5. Uses Tree-sitter's byte offsets for safe mutation

    Args:
        code: Source code to normalize
        lang: Programming language name (e.g., 'java', 'python', 'cpp')
        parser: PolyglotParser instance for parsing the code

    Returns:
        Normalized code string with identifiers renamed consistently

    Raises:
        ValueError: If the code cannot be parsed
        ImportError: If the language is not supported
    """
    try:
        # Parse the code
        tree = parser.parse(code, lang)

        # Convert code to bytes for Tree-sitter operations
        code_bytes = code.encode('utf-8')

        # Collect all renameable identifiers
        renameable_identifiers = _collect_renameable_identifiers(tree, lang)

        if not renameable_identifiers:
            # No identifiers to rename, return original code
            return code

        # Create mapping from original identifiers to new names
        identifier_mapping = _create_identifier_mapping(renameable_identifiers)

        # Collect all edit operations (byte_start, byte_end, replacement)
        edits = []
        for node, identifier_text in renameable_identifiers:
            if identifier_text in identifier_mapping:
                new_name = identifier_mapping[identifier_text]
                edits.append((node.start_byte, node.end_byte, new_name))

        # Sort edits by start position in reverse order (end to start) to avoid offset shifts
        edits.sort(key=lambda x: x[0], reverse=True)

        # Apply edits from end to start
        result_bytes = code_bytes
        for start_byte, end_byte, replacement in edits:
            replacement_bytes = replacement.encode('utf-8')
            result_bytes = result_bytes[:start_byte] + replacement_bytes + result_bytes[end_byte:]

        return result_bytes.decode('utf-8')

    except Exception as e:
        raise ValueError(f"Failed to generate Type-2 normalized code for language '{lang}': {str(e)}") from e


def generate_type2_batch(code_samples: list, lang: str) -> list:
    """
    Generate Type-2 normalized versions for multiple code samples.

    Args:
        code_samples: List of code strings to normalize
        lang: Programming language name

    Returns:
        List of normalized code strings
    """
    parser = PolyglotParser()
    results = []

    for code in code_samples:
        try:
            normalized = generate_type2(code, lang, parser)
            results.append(normalized)
        except Exception as e:
            # Return empty string for failed normalizations
            print(f"Warning: Failed to normalize code sample: {str(e)}")
            results.append("")

    return results


def _apply_rule_based_type3_mutations(code: str, lang: str) -> str:
    """
    Apply rule-based Type-3 mutations to code.

    Args:
        code: Source code to mutate
        lang: Programming language name

    Returns:
        Mutated code with Type-3 transformations
    """
    mutated_code = code

    # Convert for loops to while loops where safe (language-aware)
    if lang in ['python', 'java', 'javascript', 'cpp', 'c', 'c_sharp']:
        # Python for loop to while loop conversion
        if lang == 'python':
            # Simple for loop over range
            for_range_pattern = r'for\s+(\w+)\s+in\s+range\((\d+)\):\s*\n'
            def replace_for_range(match):
                var_name = match.group(1)
                range_end = match.group(2)
                return f'{var_name} = 0\nwhile {var_name} < {range_end}:\n'
            mutated_code = re.sub(for_range_pattern, replace_for_range, mutated_code)

            # For loop over range with start and end
            for_range_start_end_pattern = r'for\s+(\w+)\s+in\s+range\((\d+),\s*(\d+)\):\s*\n'
            def replace_for_range_start_end(match):
                var_name = match.group(1)
                range_start = match.group(2)
                range_end = match.group(3)
                return f'{var_name} = {range_start}\nwhile {var_name} < {range_end}:\n'
            mutated_code = re.sub(for_range_start_end_pattern, replace_for_range_start_end, mutated_code)

        # Java/C/C++/C# for loop to while loop conversion
        elif lang in ['java', 'cpp', 'c', 'c_sharp']:
            # Standard for loop: for(int i = 0; i < n; i++)
            for_pattern = r'for\s*\(\s*(?:int\s+)?(\w+)\s*=\s*(\d+)\s*;\s*\1\s*<\s*(\w+)\s*;\s*\1\+\+\s*\)'
            def replace_for_loop(match):
                var_name = match.group(1)
                init_val = match.group(2)
                condition_var = match.group(3)
                return f'{var_name} = {init_val};\nwhile ({var_name} < {condition_var})'
            mutated_code = re.sub(for_pattern, replace_for_loop, mutated_code)

        # JavaScript for loop to while loop
        elif lang == 'javascript':
            # for(let i = 0; i < n; i++)
            for_pattern = r'for\s*\(\s*(?:let|var)\s+(\w+)\s*=\s*(\d+)\s*;\s*\1\s*<\s*(\w+)\s*;\s*\1\+\+\s*\)'
            def replace_js_for_loop(match):
                var_name = match.group(1)
                init_val = match.group(2)
                condition_var = match.group(3)
                return f'let {var_name} = {init_val};\nwhile ({var_name} < {condition_var})'
            mutated_code = re.sub(for_pattern, replace_js_for_loop, mutated_code)

    # Insert inert statements based on language
    lines = mutated_code.split('\n')
    mutated_lines = []

    for i, line in enumerate(lines):
        mutated_lines.append(line)

        # Add inert statements after certain patterns
        stripped = line.strip()

        # Skip empty lines and comments
        if not stripped or stripped.startswith('#') or stripped.startswith('//') or stripped.startswith('/*'):
            continue

        # Insert inert statements based on language patterns
        if lang == 'python':
            # Add assert True after function definitions or class definitions
            if stripped.endswith(':') and ('def ' in stripped or 'class ' in stripped):
                # Get indentation level
                indent = len(line) - len(line.lstrip())
                mutated_lines.append(' ' * (indent + 4) + 'assert True  # Type-3 inert statement')

            # Add pass statements in loops occasionally
            elif stripped.startswith('for ') and stripped.endswith(':'):
                indent = len(line) - len(line.lstrip())
                if i % 3 == 0:  # Insert occasionally, not always
                    mutated_lines.append(' ' * (indent + 4) + 'pass  # Type-3 inert statement')

        elif lang in ['java', 'cpp', 'c', 'c_sharp']:
            # Add debug comments
            if stripped.endswith('{'):
                indent = len(line) - len(line.lstrip())
                mutated_lines.append(' ' * indent + '    // Type-3 debug comment')

            # Add empty statements
            elif stripped.endswith(';') and i % 4 == 0:
                indent = len(line) - len(line.lstrip())
                mutated_lines.append(' ' * indent + ';  // Type-3 inert statement')

        elif lang == 'javascript':
            # Add console.log statements
            if stripped.endswith('{') and i % 3 == 0:
                indent = len(line) - len(line.lstrip())
                mutated_lines.append(' ' * indent + '    // Type-3 debug comment')

            # Add debug variables
            elif stripped.endswith(';') and 'var ' in stripped and i % 5 == 0:
                indent = len(line) - len(line.lstrip())
                mutated_lines.append(' ' * indent + 'var debug_var = true;  // Type-3 inert statement')

        elif lang == 'go':
            # Add debug comments
            if stripped.endswith('{'):
                indent = len(line) - len(line.lstrip())
                mutated_lines.append(' ' * indent + '\t// Type-3 debug comment')

    return '\n'.join(mutated_lines)


def _call_ollama_for_type3(code: str, lang: str) -> str:
    """
    Call Ollama with codegemma:7b model to generate Type-3 clone.

    Args:
        code: Source code to mutate
        lang: Programming language name

    Returns:
        LLM-generated mutated code, or original code on failure
    """
    try:
        prompt = (
            "You are a code mutation engine. Create a Type-3 clone: "
            "preserve behavior, add inert code (e.g., print, assert), "
            "or restructure loops. Output ONLY the mutated code—no explanations."
            f"\n\nLanguage: {lang}\n\nCode:\n{code}"
        )

        # Prepare the request for Ollama
        payload = {
            "model": "codegemma:7b",
            "prompt": prompt,
            "stream": False
        }

        # Call Ollama API
        result = subprocess.run(
            ['curl', '-s', 'http://localhost:11434/api/generate',
             '-H', 'Content-Type: application/json',
             '-d', json.dumps(payload)],
            capture_output=True,
            text=True,
            timeout=30
        )

        if result.returncode == 0:
            response = json.loads(result.stdout)
            mutated_code = response.get('response', '').strip()

            # Strip markdown code fences if present
            if mutated_code.startswith('```'):
                lines = mutated_code.split('\n')
                if len(lines) > 2:
                    # Remove first and last lines if they are code fences
                    if lines[0].startswith('```') and lines[-1].strip() == '```':
                        mutated_code = '\n'.join(lines[1:-1])
                    elif lines[0].startswith('```'):
                        # Remove just the opening fence
                        mutated_code = '\n'.join(lines[1:])

            return mutated_code if mutated_code else code
        else:
            return code

    except Exception:
        # Return original code on any failure
        return code


def _has_syntax_errors(tree) -> bool:
    """
    Check if a Tree-sitter parse tree contains syntax errors.

    Args:
        tree: Tree-sitter Tree object

    Returns:
        True if the tree has syntax errors, False otherwise
    """
    def check_node_for_errors(node: Node) -> bool:
        """Recursively check for ERROR nodes."""
        if node.has_error or node.type == 'ERROR':
            return True

        for child in node.children:
            if check_node_for_errors(child):
                return True

        return False

    return check_node_for_errors(tree.root_node)


def generate_type3(code: str, lang: str, use_llm: bool = False, parser: PolyglotParser = None) -> str:
    """
    Generate Type-3 normalized version of code by applying structural mutations.

    Type-3 clones are copies with modified statements. This function can apply:
    - Rule-based mutations: Convert for loops to while loops, insert inert statements
    - LLM-based mutations: Use Ollama with codegemma:7b for intelligent transformations

    Args:
        code: Source code to mutate
        lang: Programming language name (java, c, cpp, go, python, javascript, c_sharp)
        use_llm: Whether to use LLM-based mutations instead of rule-based
        parser: PolyglotParser instance for validation (if None, creates new one)

    Returns:
        Mutated code string, or original code if mutation fails validation

    Raises:
        ValueError: If the language is not supported
    """
    # Validate language support
    supported_languages = ['java', 'c', 'cpp', 'go', 'python', 'javascript', 'c_sharp']
    if lang not in supported_languages:
        raise ValueError(f"Language '{lang}' not supported. Supported languages: {supported_languages}")

    # Create parser if not provided
    if parser is None:
        parser = PolyglotParser()

    try:
        # Validate original code can be parsed
        original_tree = parser.parse(code, lang)
        if _has_syntax_errors(original_tree):
            return code

        # Apply mutations based on method
        if use_llm:
            mutated_code = _call_ollama_for_type3(code, lang)
        else:
            mutated_code = _apply_rule_based_type3_mutations(code, lang)

        # Validate mutated code
        try:
            mutated_tree = parser.parse(mutated_code, lang)
            if _has_syntax_errors(mutated_tree):
                return code  # Return original if mutated version has syntax errors
            else:
                return mutated_code
        except Exception:
            return code  # Return original if parsing fails

    except Exception:
        # Return original code on any failure
        return code


def _tokenize_code(code: str, lang: str, parser: PolyglotParser) -> set:
    """
    Tokenize code using Tree-sitter and extract meaningful tokens.

    Args:
        code: Source code to tokenize
        lang: Programming language name
        parser: PolyglotParser instance

    Returns:
        Set of tokens (strings) extracted from the code
    """
    try:
        # Parse the code
        tree = parser.parse(code, lang)

        # Get comment node types for this language
        comment_types = _get_comment_node_types(lang)

        tokens = set()

        def traverse_and_extract_tokens(node):
            """Recursively traverse and extract tokens from non-comment nodes."""
            # Skip comment nodes
            if node.type in comment_types:
                return

            # If this is a leaf node, extract its text as a token
            if len(node.children) == 0:
                if node.text:
                    token = node.text.decode('utf-8') if isinstance(node.text, bytes) else str(node.text)
                    # Clean and normalize the token
                    token = token.strip()
                    if token and not token.isspace():
                        tokens.add(token)
            else:
                # Recursively process children
                for child in node.children:
                    traverse_and_extract_tokens(child)

        traverse_and_extract_tokens(tree.root_node)
        return tokens

    except Exception:
        # If tokenization fails, fall back to simple string splitting
        # Remove comments using basic regex
        import re

        # Basic comment removal for common languages
        if lang in ['java', 'c', 'cpp', 'c_sharp', 'javascript']:
            # Remove // comments
            code = re.sub(r'//.*$', '', code, flags=re.MULTILINE)
            # Remove /* */ comments
            code = re.sub(r'/\*.*?\*/', '', code, flags=re.DOTALL)
        elif lang == 'python':
            # Remove # comments
            code = re.sub(r'#.*$', '', code, flags=re.MULTILINE)

        # Split by whitespace and common delimiters
        tokens = set()
        for token in re.findall(r'\w+|[^\w\s]', code):
            token = token.strip()
            if token and not token.isspace():
                tokens.add(token)

        return tokens


def _jaccard_similarity(set1: set, set2: set) -> float:
    """
    Calculate Jaccard similarity between two sets.

    Args:
        set1: First set
        set2: Second set

    Returns:
        Jaccard similarity coefficient (0.0 to 1.0)
    """
    if not set1 and not set2:
        return 1.0  # Both empty sets are considered identical

    intersection = len(set1 & set2)
    union = len(set1 | set2)

    if union == 0:
        return 0.0

    return intersection / union


def get_type4_pairs(problem_id: str, submissions: dict, parser: PolyglotParser, threshold: float = 0.4) -> list[tuple]:
    """
    Generate Type-4 clone pairs by finding submissions with low token Jaccard similarity.

    Type-4 clones are functionally similar code that implements the same algorithm
    but may have different syntactic structure. This function:
    1. Takes all accepted submissions for a problem
    2. Tokenizes each submission using Tree-sitter
    3. Computes token Jaccard similarity between all pairs
    4. Returns pairs with similarity < threshold (indicating structural differences)

    Args:
        problem_id: Identifier for the problem
        submissions: Dictionary mapping submission_id to {code: str, language: str, status: str}
        parser: PolyglotParser instance for tokenization
        threshold: Similarity threshold (default 0.4) - pairs below this are considered Type-4

    Returns:
        List of tuples (code_a, code_b, lang_a, lang_b) representing Type-4 clone pairs

    Raises:
        ValueError: If submissions format is invalid
    """
    if not isinstance(submissions, dict):
        raise ValueError("submissions must be a dictionary")

    if not (0.0 <= threshold <= 1.0):
        raise ValueError("threshold must be between 0.0 and 1.0")

    # Filter for accepted submissions only
    accepted_submissions = []
    for submission_id, submission_data in submissions.items():
        if not isinstance(submission_data, dict):
            continue

        status = submission_data.get('status', '').lower()
        code = submission_data.get('code', '')
        language = submission_data.get('language', '')

        # Check if submission is accepted and has valid code/language
        if status == 'accepted' and code.strip() and language.strip():
            accepted_submissions.append({
                'id': submission_id,
                'code': code,
                'language': language
            })

    if len(accepted_submissions) < 2:
        return []  # Need at least 2 submissions to form pairs

    # Tokenize all submissions
    tokenized_submissions = []
    for submission in accepted_submissions:
        try:
            tokens = _tokenize_code(submission['code'], submission['language'], parser)
            tokenized_submissions.append({
                'id': submission['id'],
                'code': submission['code'],
                'language': submission['language'],
                'tokens': tokens
            })
        except Exception:
            # Skip submissions that fail tokenization
            continue

    if len(tokenized_submissions) < 2:
        return []  # Need at least 2 successfully tokenized submissions

    # Generate all pairs and compute similarities
    type4_pairs = []

    for i in range(len(tokenized_submissions)):
        for j in range(i + 1, len(tokenized_submissions)):
            sub_a = tokenized_submissions[i]
            sub_b = tokenized_submissions[j]

            # Calculate Jaccard similarity between token sets
            similarity = _jaccard_similarity(sub_a['tokens'], sub_b['tokens'])

            # If similarity is below threshold, it's a Type-4 pair
            if similarity < threshold:
                type4_pairs.append((
                    sub_a['code'],
                    sub_b['code'],
                    sub_a['language'],
                    sub_b['language']
                ))

    return type4_pairs


def _split_problems_by_hash(master_index: Dict[str, Dict[str, List[str]]],
                           train_ratio: float = 0.6,
                           val_ratio: float = 0.2) -> Dict[str, List[str]]:
    """
    Split problems into train/val/test sets to prevent data leakage.

    Uses hash-based deterministic splitting to ensure consistent splits across runs.

    Args:
        master_index: Master index of problems and submissions
        train_ratio: Ratio for training set (default: 0.6)
        val_ratio: Ratio for validation set (default: 0.2, test gets remainder)

    Returns:
        Dictionary with 'train', 'val', 'test' keys containing problem lists
    """
    problems = list(master_index.keys())
    problems.sort()  # Ensure consistent ordering

    # Hash-based deterministic splitting
    train_problems = []
    val_problems = []
    test_problems = []

    for problem in problems:
        hash_val = hash(problem) % 10
        if hash_val < int(train_ratio * 10):
            train_problems.append(problem)
        elif hash_val < int((train_ratio + val_ratio) * 10):
            val_problems.append(problem)
        else:
            test_problems.append(problem)

    return {
        'train': train_problems,
        'val': val_problems,
        'test': test_problems
    }


def _load_code_from_submission(codenet_root: str, problem_id: str,
                              submission_id: str, language: str) -> str:
    """
    Load actual code content from CodeNet directory structure.
    
    CodeNet structure: {codenet_root}/data/{problem_id}/{Language}/{submission_id}.ext
    Note: submission_id from CSV does NOT include extension, but files do have extensions.
    Note: CodeNet uses capitalized language names in directories (Java, Python, C++, etc.)

    Args:
        codenet_root: Path to CodeNet dataset root
        problem_id: Problem identifier (e.g., 'p00001')
        submission_id: Submission identifier WITHOUT extension (e.g., 's123456789')
        language: Programming language in lowercase (e.g., 'java', 'python', 'cpp')

    Returns:
        Code content as string, empty if file not found
    """
    from pathlib import Path

    # Map lowercase language names to CodeNet directory names
    lang_dir_map = {
        'java': 'Java',
        'python': 'Python',
        'c': 'C',
        'cpp': 'C++',
        'c++': 'C++',
        'c_sharp': 'C#',
        'csharp': 'C#',
        'javascript': 'JavaScript',
        'go': 'Go',
        'ruby': 'Ruby',
        'rust': 'Rust',
        'kotlin': 'Kotlin',
        'swift': 'Swift',
        'php': 'PHP'
    }

    # Get the proper directory name for the language
    lang_dir = lang_dir_map.get(language.lower(), language)

    # CodeNet directory structure: codenet_root/data/{problem_id}/{Language}/
    problem_dir = Path(codenet_root) / "data" / problem_id / lang_dir

    if not problem_dir.exists():
        return ""

    # Submission ID does not include extension, so we need to find the file
    # Try to find file matching the submission_id pattern
    base_name = submission_id.rsplit('.', 1)[0] if '.' in submission_id else submission_id
    
    try:
        for file_path in problem_dir.glob(f"{base_name}.*"):
            try:
                with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                    content = f.read()
                    # Validate the content is not empty and has reasonable size
                    if content and len(content.strip()) > 0:
                        return content
            except Exception:
                continue
    except Exception:
        pass
    
    return ""


def _generate_negative_pairs(master_index: Dict[str, Dict[str, List[str]]],
                           parser: PolyglotParser,
                           codenet_root: str,
                           target_easy: int,
                           target_hard: int,
                           used_problems: Set[str]) -> List[Dict]:
    """
    Generate negative clone pairs (non-clones).

    Args:
        master_index: Master index of problems and submissions
        parser: PolyglotParser instance
        codenet_root: Path to CodeNet dataset
        target_easy: Number of easy negatives to generate (different problems)
        target_hard: Number of hard negatives to generate (same problem, low similarity)
        used_problems: Set of problems already used for positives

    Returns:
        List of negative pair dictionaries
    """
    negatives = []
    available_problems = [p for p in master_index.keys() if p not in used_problems]

    # Generate easy negatives (different problems)
    print("  Generating easy negatives (different problems)...")
    easy_count = 0
    attempts = 0
    max_attempts = target_easy * 20  # Allow more attempts for failures

    while easy_count < target_easy and attempts < max_attempts:
        attempts += 1

        # Select two different problems
        if len(available_problems) < 2:
            break

        problem1, problem2 = random.sample(available_problems, 2)

        # Get common languages between the two problems
        langs1 = set(master_index[problem1].keys())
        langs2 = set(master_index[problem2].keys())
        common_langs = langs1.intersection(langs2)

        if not common_langs:
            continue

        lang = random.choice(list(common_langs))

        # Select random submissions from each problem
        if (len(master_index[problem1][lang]) == 0 or
            len(master_index[problem2][lang]) == 0):
            continue

        sub1 = random.choice(master_index[problem1][lang])
        sub2 = random.choice(master_index[problem2][lang])

        # Load code content
        code1 = _load_code_from_submission(codenet_root, problem1, sub1, lang)
        code2 = _load_code_from_submission(codenet_root, problem2, sub2, lang)

        if len(code1.strip()) < 50 or len(code2.strip()) < 50:  # Minimum code size
            continue

        negatives.append({
            'id': f"neg_easy_{easy_count}",
            'code1': code1,
            'code2': code2,
            'label': 0,
            'type': 'negative_easy',
            'lang': lang
        })
        easy_count += 1

    print(f"    Easy negatives: {easy_count}/{target_easy} from {attempts} attempts")

    # Generate hard negatives (same problem, low similarity)
    print("  Generating hard negatives (same problem, different approaches)...")
    hard_count = 0
    attempts = 0
    max_attempts = target_hard * 20

    while hard_count < target_hard and attempts < max_attempts:
        attempts += 1

        if not available_problems:
            break

        problem = random.choice(available_problems)
        langs = list(master_index[problem].keys())

        if not langs:
            continue

        lang = random.choice(langs)
        submissions = master_index[problem][lang]

        if len(submissions) < 2:
            continue

        # Select two different submissions from the same problem
        sub1, sub2 = random.sample(submissions, 2)

        code1 = _load_code_from_submission(codenet_root, problem, sub1, lang)
        code2 = _load_code_from_submission(codenet_root, problem, sub2, lang)

        if len(code1.strip()) < 50 or len(code2.strip()) < 50:
            continue

        # Check if similarity is low enough (different coding approaches to same problem)
        try:
            tokens1 = _tokenize_code(code1, lang, parser)
            tokens2 = _tokenize_code(code2, lang, parser)
            similarity = _jaccard_similarity(tokens1, tokens2)

            # Consider it a hard negative if similarity is moderately low
            # These are from the same problem but use different approaches
            if similarity < 0.6:  # Low similarity threshold
                negatives.append({
                    'id': f"neg_hard_{hard_count}",
                    'code1': code1,
                    'code2': code2,
                    'label': 0,
                    'type': 'negative_hard',
                    'lang': lang
                })
                hard_count += 1
        except Exception:
            # On tokenization failure, treat as hard negative if codes are different
            if code1 != code2:
                negatives.append({
                    'id': f"neg_hard_{hard_count}",
                    'code1': code1,
                    'code2': code2,
                    'label': 0,
                    'type': 'negative_hard',
                    'lang': lang
                })
                hard_count += 1

    print(f"    Hard negatives: {hard_count}/{target_hard} from {attempts} attempts")

    return negatives


def sample_clone_pairs(master_index: Dict[str, Dict[str, List[str]]],
                      parser: PolyglotParser,
                      codenet_root: str,
                      target_pairs: int = 100_000,
                      split: str = 'train') -> Generator[Dict, None, None]:
    """
    Sample clone pairs according to specified ratios with data leakage prevention.

    Samples positives in ratio: T1=10%, T2=20%, T3=10%, T4=10%
    Samples negatives: 25% easy (different problem), 25% hard (same problem, low similarity)
    Ensures no data leakage: all samples from disjoint problem sets per split.

    Args:
        master_index: Master index of problems and submissions from build_master_index()
        parser: PolyglotParser instance for code processing
        codenet_root: Path to CodeNet dataset root directory
        target_pairs: Total number of pairs to generate (default: 100,000)
        split: Dataset split to generate ('train', 'val', or 'test')

    Yields:
        Dictionaries with keys: id, code1, code2, label, type, lang

    Example:
        ```python
        from indexing import build_master_index
        from parsers import PolyglotParser

        master_index = build_master_index("/path/to/codenet", ["java", "python"])
        parser = PolyglotParser()

        for pair in sample_clone_pairs(master_index, parser, "/path/to/codenet",
                                     target_pairs=10000, split='train'):
            print(f"Pair {pair['id']}: {pair['type']}, Label: {pair['label']}")
        ```
    """
    # Split problems to prevent data leakage
    problem_splits = _split_problems_by_hash(master_index)

    if split not in problem_splits:
        raise ValueError(f"Split '{split}' not found. Available: {list(problem_splits.keys())}")

    available_problems = problem_splits[split]

    if not available_problems:
        print(f"No problems available for split '{split}'")
        return

    # Calculate target counts for each type
    t1_target = int(target_pairs * 0.10)  # 10%
    t2_target = int(target_pairs * 0.20)  # 20%
    t3_target = int(target_pairs * 0.10)  # 10%
    t4_target = int(target_pairs * 0.10)  # 10%
    neg_easy_target = int(target_pairs * 0.25)  # 25%
    neg_hard_target = int(target_pairs * 0.25)  # 25%

    print(f"Generating {target_pairs} pairs for {split} split:")
    print(f"  T1: {t1_target}, T2: {t2_target}, T3: {t3_target}, T4: {t4_target}")
    print(f"  Neg Easy: {neg_easy_target}, Neg Hard: {neg_hard_target}")
    print(f"  Available problems: {len(available_problems)}")

    used_problems = set()
    pair_count = 0

    # Generate Type-1 pairs (exact copies with whitespace/comment changes)
    print("Generating Type-1 pairs...")
    t1_count = 0
    t1_attempts = 0
    max_t1_attempts = t1_target * 20  # Allow more attempts for failures
    
    for problem in available_problems[:]:
        if t1_count >= t1_target or t1_attempts >= max_t1_attempts:
            break

        languages = list(master_index[problem].keys())
        if not languages:
            continue

        lang = random.choice(languages)
        submissions = master_index[problem][lang]

        if len(submissions) < 1:  # Only need 1 submission to create Type-1
            continue

        # Take up to 5 pairs per problem to avoid clustering
        problem_pairs = 0
        max_pairs_per_problem = min(5, len(submissions))

        for _ in range(max_pairs_per_problem):
            if t1_count >= t1_target or problem_pairs >= max_pairs_per_problem:
                break

            t1_attempts += 1
            
            # Select one submission as the base
            sub1 = random.choice(submissions)
            code1 = _load_code_from_submission(codenet_root, problem, sub1, lang)

            if len(code1.strip()) < 50:  # Require minimum code size
                continue

            # Generate Type-1 clone by normalizing the same code
            try:
                t1_code2 = generate_type1(code1, lang, parser)

                # Type-1 should normalize but not be empty
                if t1_code2 and len(t1_code2.strip()) >= 10:
                    yield {
                        'id': f"t1_{t1_count}_{split}",
                        'code1': code1,
                        'code2': t1_code2,
                        'label': 1,
                        'type': 'type1',
                        'lang': lang
                    }
                    t1_count += 1
                    problem_pairs += 1
                    pair_count += 1
            except Exception as e:
                # Log parsing errors but continue
                continue

        if problem_pairs > 0:
            used_problems.add(problem)
    
    print(f"  Type-1: Generated {t1_count} pairs from {t1_attempts} attempts")

    # Generate Type-2 pairs (renamed identifiers)
    print("Generating Type-2 pairs...")
    t2_count = 0
    t2_attempts = 0
    max_t2_attempts = t2_target * 20
    
    for problem in available_problems[:]:
        if t2_count >= t2_target or problem in used_problems or t2_attempts >= max_t2_attempts:
            continue

        languages = list(master_index[problem].keys())
        if not languages:
            continue

        lang = random.choice(languages)
        submissions = master_index[problem][lang]

        if len(submissions) == 0:
            continue

        # Take up to 5 pairs per problem
        problem_pairs = 0
        max_pairs_per_problem = min(5, len(submissions))

        for _ in range(max_pairs_per_problem):
            if t2_count >= t2_target or problem_pairs >= max_pairs_per_problem:
                break

            t2_attempts += 1
            
            sub1 = random.choice(submissions)
            code1 = _load_code_from_submission(codenet_root, problem, sub1, lang)

            if len(code1.strip()) < 50:  # Require minimum code size
                continue

            # Generate Type-2 clone by renaming identifiers
            try:
                t2_code2 = generate_type2(code1, lang, parser)

                # Ensure transformation occurred and result is valid
                if t2_code2 and len(t2_code2.strip()) >= 10 and t2_code2 != code1:
                    yield {
                        'id': f"t2_{t2_count}_{split}",
                        'code1': code1,
                        'code2': t2_code2,
                        'label': 1,
                        'type': 'type2',
                        'lang': lang
                    }
                    t2_count += 1
                    problem_pairs += 1
                    pair_count += 1
            except Exception as e:
                # Log but continue on parsing errors
                continue

        if problem_pairs > 0:
            used_problems.add(problem)
    
    print(f"  Type-2: Generated {t2_count} pairs from {t2_attempts} attempts")

    # Generate Type-3 pairs (structural modifications)
    print("Generating Type-3 pairs...")
    t3_count = 0
    t3_attempts = 0
    max_t3_attempts = t3_target * 20
    
    for problem in available_problems[:]:
        if t3_count >= t3_target or problem in used_problems or t3_attempts >= max_t3_attempts:
            continue

        languages = list(master_index[problem].keys())
        if not languages:
            continue

        lang = random.choice(languages)
        submissions = master_index[problem][lang]

        if len(submissions) == 0:
            continue

        # Take up to 5 pairs per problem
        problem_pairs = 0
        max_pairs_per_problem = min(5, len(submissions))

        for _ in range(max_pairs_per_problem):
            if t3_count >= t3_target or problem_pairs >= max_pairs_per_problem:
                break

            t3_attempts += 1
            
            sub1 = random.choice(submissions)
            code1 = _load_code_from_submission(codenet_root, problem, sub1, lang)

            if len(code1.strip()) < 50:  # Require minimum code size
                continue

            # Generate Type-3 clone with structural modifications
            try:
                t3_code2 = generate_type3(code1, lang, use_llm=False, parser=parser)

                # Ensure transformation occurred and result is valid
                if t3_code2 and len(t3_code2.strip()) >= 10 and t3_code2 != code1:
                    yield {
                        'id': f"t3_{t3_count}_{split}",
                        'code1': code1,
                        'code2': t3_code2,
                        'label': 1,
                        'type': 'type3',
                        'lang': lang
                    }
                    t3_count += 1
                    problem_pairs += 1
                    pair_count += 1
            except Exception as e:
                continue

        if problem_pairs > 0:
            used_problems.add(problem)
    
    print(f"  Type-3: Generated {t3_count} pairs from {t3_attempts} attempts")

    # Generate Type-4 pairs (semantically similar, syntactically different)
    print("Generating Type-4 pairs...")
    t4_count = 0
    t4_attempts = 0
    max_t4_attempts = t4_target * 20
    
    for problem in available_problems[:]:
        if t4_count >= t4_target or problem in used_problems or t4_attempts >= max_t4_attempts:
            continue

        languages = list(master_index[problem].keys())
        if not languages:
            continue

        lang = random.choice(languages)
        submissions = master_index[problem][lang]

        if len(submissions) < 2:  # Need at least 2 submissions for Type-4
            continue

        t4_attempts += 1

        # Load up to 20 submissions from this problem to find Type-4 pairs
        try:
            codes_and_ids = []
            for sub_id in submissions[:20]:  # Limit to avoid too many comparisons
                code = _load_code_from_submission(codenet_root, problem, sub_id, lang)
                if len(code.strip()) >= 50:  # Minimum code size
                    codes_and_ids.append((sub_id, code))

            if len(codes_and_ids) < 2:
                continue

            # Tokenize all submissions
            tokenized_submissions = []
            for sub_id, code in codes_and_ids:
                try:
                    tokens = _tokenize_code(code, lang, parser)
                    if tokens:  # Only add if tokenization succeeded
                        tokenized_submissions.append({
                            'id': sub_id,
                            'code': code,
                            'tokens': tokens
                        })
                except Exception:
                    continue

            if len(tokenized_submissions) < 2:
                continue

            # Find pairs with low Jaccard similarity (< TYPE4_THRESHOLD)
            problem_pairs = 0
            max_pairs_per_problem = 5

            for i in range(len(tokenized_submissions)):
                if problem_pairs >= max_pairs_per_problem or t4_count >= t4_target:
                    break
                    
                for j in range(i + 1, len(tokenized_submissions)):
                    if problem_pairs >= max_pairs_per_problem or t4_count >= t4_target:
                        break
                    
                    sub_a = tokenized_submissions[i]
                    sub_b = tokenized_submissions[j]

                    # Calculate Jaccard similarity between token sets
                    similarity = _jaccard_similarity(sub_a['tokens'], sub_b['tokens'])

                    # If similarity is below threshold, it's a Type-4 pair
                    # (semantically similar - same problem, but syntactically different)
                    if similarity < TYPE4_THRESHOLD:
                        yield {
                            'id': f"t4_{t4_count}_{split}",
                            'code1': sub_a['code'],
                            'code2': sub_b['code'],
                            'label': 1,
                            'type': 'type4',
                            'lang': lang
                        }
                        t4_count += 1
                        problem_pairs += 1
                        pair_count += 1

            if problem_pairs > 0:
                used_problems.add(problem)

        except Exception as e:
            continue
    
    print(f"  Type-4: Generated {t4_count} pairs from {t4_attempts} attempts")

    # Generate negative pairs
    print("Generating negative pairs...")
    negative_count_before = pair_count
    
    negatives = _generate_negative_pairs(
        master_index, parser, codenet_root,
        neg_easy_target, neg_hard_target, used_problems
    )

    for negative in negatives:
        yield negative
        pair_count += 1
    
    negative_count = pair_count - negative_count_before
    print(f"  Negatives: Generated {negative_count} pairs (Easy: {neg_easy_target}, Hard: {neg_hard_target})")

    print(f"\n{'='*60}")
    print(f"Total pairs generated for {split} split: {pair_count}")
    print(f"  T1: {t1_count}/{t1_target} ({t1_count/t1_target*100:.1f}%)")
    print(f"  T2: {t2_count}/{t2_target} ({t2_count/t2_target*100:.1f}%)")
    print(f"  T3: {t3_count}/{t3_target} ({t3_count/t3_target*100:.1f}%)")
    print(f"  T4: {t4_count}/{t4_target} ({t4_count/t4_target*100:.1f}%)")
    print(f"  Negatives: {negative_count}/{neg_easy_target + neg_hard_target} ({negative_count/(neg_easy_target + neg_hard_target)*100:.1f}%)")
    print(f"{'='*60}")



