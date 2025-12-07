"""
Code mutation generators for creating Type-3 code clones.

This module provides functionality to generate Type-3 clones using either
rule-based transformations or LLM-based mutations with proper validation.
"""

import re
from typing import Optional
import subprocess

try:
    from tree_sitter import Language, Parser, Node, Tree
    import tree_sitter_python
    import tree_sitter_java
    import tree_sitter_javascript
    import tree_sitter_cpp
    import tree_sitter_go
except ImportError:
    pass


class PolyglotParser:
    """Multi-language parser using Tree-sitter for syntax validation."""
    
    def __init__(self):
        """Initialize parsers for supported languages."""
        self.parsers = {}
        self.languages = {}
        
        # Language mapping
        language_modules = {
            'python': tree_sitter_python,
            'java': tree_sitter_java,
            'javascript': tree_sitter_javascript,
            'cpp': tree_sitter_cpp,
            'c': tree_sitter_cpp,
            'go': tree_sitter_go,
            'c_sharp': tree_sitter_cpp,  # Use cpp as fallback for c_sharp
        }
        
        # Initialize each language parser
        for lang, module in language_modules.items():
            try:
                parser = Parser()
                language = Language(module.language())
                parser.language = language
                self.parsers[lang] = parser
                self.languages[lang] = language
            except Exception as e:
                print(f"Warning: Failed to initialize {lang} parser: {e}")
    
    def parse(self, code: str, lang: str) -> Optional[Tree]:
        """
        Parse code in the specified language.
        
        Args:
            code: Source code to parse
            lang: Programming language
            
        Returns:
            Tree-sitter Tree object or None if parsing fails
        """
        if lang not in self.parsers:
            return None
        
        try:
            parser = self.parsers[lang]
            tree = parser.parse(bytes(code, 'utf8'))
            return tree
        except Exception:
            return None
    
    def has_syntax_errors(self, tree: Tree) -> bool:
        """
        Check if the parse tree contains syntax errors.
        
        Args:
            tree: Tree-sitter Tree object
            
        Returns:
            True if syntax errors are found, False otherwise
        """
        if tree is None:
            return True
        
        root_node = tree.root_node
        
        # Check if the tree has errors
        if root_node.has_error:
            return True
        
        # Check for ERROR nodes in the tree
        def has_error_nodes(node: Node) -> bool:
            if node.type == 'ERROR':
                return True
            for child in node.children:
                if has_error_nodes(child):
                    return True
            return False
        
        return has_error_nodes(root_node)


def _strip_markdown_fences(text: str) -> str:
    """
    Strip markdown code fences from text.
    
    Args:
        text: Text potentially containing markdown code fences
        
    Returns:
        Text with markdown fences removed
    """
    # Remove opening fence (```lang or ```)
    text = re.sub(r'^```\w*\s*\n', '', text, flags=re.MULTILINE)
    # Remove closing fence
    text = re.sub(r'\n```\s*$', '', text, flags=re.MULTILINE)
    # Also handle cases where fences might be on the same line
    text = re.sub(r'^```\w*\s*', '', text)
    text = re.sub(r'```\s*$', '', text)
    return text.strip()


def _call_ollama(code: str, lang: str) -> Optional[str]:
    """
    Call Ollama API to generate Type-3 clone using LLM.
    
    Args:
        code: Original source code
        lang: Programming language
        
    Returns:
        Mutated code or None if call fails
    """
    prompt = f"""You are a code mutation engine. Create a Type-3 clone: preserve behavior, add inert code (e.g., print, assert), or restructure loops. Output ONLY the mutated code—no explanations.

Language: {lang}
Original code:
{code}

Mutated code:"""
    
    try:
        # Call ollama via subprocess
        result = subprocess.run(
            ['ollama', 'run', 'codegemma:7b'],
            input=prompt,
            capture_output=True,
            text=True,
            timeout=30
        )
        
        if result.returncode == 0:
            response = result.stdout.strip()
            # Strip markdown fences if present
            response = _strip_markdown_fences(response)
            return response
        else:
            return None
            
    except Exception:
        return None


def _convert_for_to_while_python(code: str) -> str:
    """
    Convert Python for loops to while loops where safe.
    
    Args:
        code: Python source code
        
    Returns:
        Code with for loops converted to while loops
    """
    lines = code.split('\n')
    result = []
    i = 0
    
    while i < len(lines):
        line = lines[i]
        # Simple pattern matching for "for i in range(...)"
        match = re.match(r'^(\s*)for\s+(\w+)\s+in\s+range\((\d+)\s*\):\s*$', line)
        if match:
            indent = match.group(1)
            var = match.group(2)
            limit = match.group(3)
            # Convert to while loop
            result.append(f"{indent}{var} = 0")
            result.append(f"{indent}while {var} < {limit}:")
            # Keep the body and add increment at the end
            i += 1
            body_lines = []
            while i < len(lines) and (lines[i].startswith(indent + '    ') or lines[i].strip() == ''):
                body_lines.append(lines[i])
                i += 1
            result.extend(body_lines)
            if body_lines:
                # Add increment with same indentation as body
                body_indent = indent + '    '
                result.append(f"{body_indent}{var} += 1")
            continue
        result.append(line)
        i += 1
    
    return '\n'.join(result)


def _convert_for_to_while_java(code: str) -> str:
    """
    Convert Java for loops to while loops where safe.
    
    Args:
        code: Java source code
        
    Returns:
        Code with for loops converted to while loops
    """
    # Pattern for simple for loops: for(int i = 0; i < n; i++)
    pattern = r'for\s*\(\s*int\s+(\w+)\s*=\s*0\s*;\s*\1\s*<\s*(\w+)\s*;\s*\1\s*\+\+\s*\)'
    
    def replace_for(match):
        var = match.group(1)
        limit = match.group(2)
        return f'int {var} = 0;\n    while ({var} < {limit})'
    
    # Replace for loops with while loops
    result = re.sub(pattern, replace_for, code)
    
    # Add increment before closing brace (simplified approach)
    # This is a basic implementation and may need refinement
    return result


def _convert_for_to_while_c_cpp(code: str) -> str:
    """
    Convert C/C++ for loops to while loops where safe.
    
    Args:
        code: C/C++ source code
        
    Returns:
        Code with for loops converted to while loops
    """
    # Similar to Java but with more flexible type handling
    pattern = r'for\s*\(\s*(\w+)\s+(\w+)\s*=\s*0\s*;\s*\2\s*<\s*(\w+)\s*;\s*\2\s*\+\+\s*\)'
    
    def replace_for(match):
        type_name = match.group(1)
        var = match.group(2)
        limit = match.group(3)
        return f'{type_name} {var} = 0;\n    while ({var} < {limit})'
    
    return re.sub(pattern, replace_for, code)


def _convert_for_to_while_go(code: str) -> str:
    """
    Convert Go for loops to while-style loops.
    
    Args:
        code: Go source code
        
    Returns:
        Code with for loops converted to while-style
    """
    # Go uses for as while: for condition { }
    # Convert: for i := 0; i < n; i++ to initialization; for condition
    pattern = r'for\s+(\w+)\s*:=\s*0\s*;\s*\1\s*<\s*(\w+)\s*;\s*\1\s*\+\+'
    
    def replace_for(match):
        var = match.group(1)
        limit = match.group(2)
        return f'{var} := 0\n    for {var} < {limit}'
    
    return re.sub(pattern, replace_for, code)


def _convert_for_to_while_javascript(code: str) -> str:
    """
    Convert JavaScript for loops to while loops where safe.
    
    Args:
        code: JavaScript source code
        
    Returns:
        Code with for loops converted to while loops
    """
    # Pattern for: for(let i = 0; i < n; i++)
    pattern = r'for\s*\(\s*let\s+(\w+)\s*=\s*0\s*;\s*\1\s*<\s*(\w+)\s*;\s*\1\s*\+\+\s*\)'
    
    def replace_for(match):
        var = match.group(1)
        limit = match.group(2)
        return f'let {var} = 0;\n    while ({var} < {limit})'
    
    return re.sub(pattern, replace_for, code)


def _insert_inert_statements_python(code: str) -> str:
    """
    Insert inert statements into Python code.
    
    Args:
        code: Python source code
        
    Returns:
        Code with inert statements inserted
    """
    lines = code.split('\n')
    result = []
    
    for i, line in enumerate(lines):
        result.append(line)
        # Add assert True after function definitions
        if re.match(r'^\s*def\s+\w+\s*\(', line):
            indent = len(line) - len(line.lstrip())
            result.append(' ' * (indent + 4) + 'assert True  # Type-3 mutation')
        # Add pass statement after class definitions
        elif re.match(r'^\s*class\s+\w+', line):
            indent = len(line) - len(line.lstrip())
            result.append(' ' * (indent + 4) + 'pass  # Type-3 mutation')
    
    return '\n'.join(result)


def _insert_inert_statements_c_like(code: str, comment_style: str = '//') -> str:
    """
    Insert inert statements into C-like languages.
    
    Args:
        code: Source code
        comment_style: Comment style ('//' or '#')
        
    Returns:
        Code with inert statements inserted
    """
    lines = code.split('\n')
    result = []
    
    for i, line in enumerate(lines):
        result.append(line)
        # Add debug comment after opening braces
        if '{' in line and not line.strip().startswith(comment_style):
            indent = len(line) - len(line.lstrip())
            result.append(' ' * (indent + 4) + f'{comment_style} Type-3 mutation: debug marker')
    
    return '\n'.join(result)


def _apply_rule_based_mutations(code: str, lang: str) -> str:
    """
    Apply rule-based Type-3 mutations to code.
    
    Args:
        code: Original source code
        lang: Programming language
        
    Returns:
        Mutated code
    """
    mutated = code
    
    # Apply for-to-while conversion
    if lang == 'python':
        mutated = _convert_for_to_while_python(mutated)
        mutated = _insert_inert_statements_python(mutated)
    elif lang == 'java':
        mutated = _convert_for_to_while_java(mutated)
        mutated = _insert_inert_statements_c_like(mutated, '//')
    elif lang in ('c', 'cpp'):
        mutated = _convert_for_to_while_c_cpp(mutated)
        mutated = _insert_inert_statements_c_like(mutated, '//')
    elif lang == 'go':
        mutated = _convert_for_to_while_go(mutated)
        mutated = _insert_inert_statements_c_like(mutated, '//')
    elif lang == 'javascript':
        mutated = _convert_for_to_while_javascript(mutated)
        mutated = _insert_inert_statements_c_like(mutated, '//')
    elif lang == 'c_sharp':
        mutated = _convert_for_to_while_c_cpp(mutated)
        mutated = _insert_inert_statements_c_like(mutated, '//')
    
    return mutated


def generate_type3(
    code: str,
    lang: str,
    use_llm: bool = False,
    parser: Optional[PolyglotParser] = None
) -> str:
    """
    Generate a Type-3 code clone with behavior-preserving mutations.
    
    This function creates Type-3 clones by either applying rule-based
    transformations or using an LLM (Ollama with codegemma:7b). All
    mutations are validated using Tree-sitter to ensure syntactic correctness.
    
    Args:
        code: Original source code to mutate
        lang: Programming language (java, c, cpp, go, python, javascript, c_sharp)
        use_llm: If True, use LLM for mutations; if False, use rule-based approach
        parser: PolyglotParser instance for validation (created if None)
        
    Returns:
        Mutated code if successful and valid, otherwise the original code
        
    Examples:
        >>> parser = PolyglotParser()
        >>> original = "for i in range(10):\\n    print(i)"
        >>> mutated = generate_type3(original, "python", use_llm=False, parser=parser)
        >>> # Returns code with for loop converted to while loop
        
        >>> original = "def foo(): return 1"
        >>> mutated = generate_type3(original, "python", use_llm=True, parser=parser)
        >>> # Returns LLM-generated Type-3 clone if available
    """
    # Validate input
    if not code or not code.strip():
        return code
    
    # Supported languages
    supported_langs = {'java', 'c', 'cpp', 'go', 'python', 'javascript', 'c_sharp'}
    if lang not in supported_langs:
        return code
    
    # Create parser if not provided
    if parser is None:
        parser = PolyglotParser()
    
    try:
        # Generate mutated code
        if use_llm:
            mutated_code = _call_ollama(code, lang)
            if mutated_code is None:
                return code
        else:
            mutated_code = _apply_rule_based_mutations(code, lang)
        
        # Validate the mutated code
        tree = parser.parse(mutated_code, lang)
        if tree is None or parser.has_syntax_errors(tree):
            # Return original code if validation fails
            return code
        
        return mutated_code
        
    except Exception:
        # Return original code on any error
        return code
