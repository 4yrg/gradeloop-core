# model-orchestrator/cipas/code_clone_detection/parsers/normalizers.py
import asyncio
import ast
import subprocess
from typing import Dict, Optional, Set

from .tree_sitter_wrapper import parse_code, TREE_SITTER_AVAILABLE, Tree

# --- 1. Whitespace and External Formatting ---

async def normalize_whitespace_and_format(code: str, lang: str) -> str:
    """
    Normalizes whitespace and formats the code using external tools like
    `clang-format`, `prettier`, or `black`.

    This function relies on these formatters being available in the system's PATH.
    If a formatter is not found, it returns the original code.

    Args:
        code: The source code to format.
        lang: The programming language.

    Returns:
        The formatted code, or the original code if a formatter is not found.
    """
    formatters = {
        "c": ["clang-format", "-style=file"],
        "cpp": ["clang-format", "-style=file"],
        "java": ["clang-format", "-style=file"],
        "javascript": ["prettier", "--parser", "babel"],
        "python": ["black", "-"],
    }

    command = formatters.get(lang)
    if not command:
        # No formatter for this language, return original code
        return code

    try:
        process = await asyncio.create_subprocess_exec(
            *command,
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
        )
        stdout, stderr = await process.communicate(input=code.encode("utf-8"))

        if process.returncode == 0:
            return stdout.decode("utf-8")
        else:
            # Formatter failed, return original code. Log the error.
            print(f"Warning: Formatter '{command[0]}' failed for lang '{lang}': {stderr.decode()}")
            return code
    except FileNotFoundError:
        # Formatter not installed/found in PATH.
        print(f"Warning: Formatter '{command[0]}' not found in PATH.")
        return code

# --- 2. Comment Stripping ---

def _strip_nodes_by_type(code_bytes: bytes, tree: Tree, types_to_strip: Set[str]) -> bytes:
    """Helper to remove nodes of specific types from a tree-sitter AST."""
    if not tree or not tree.root_node:
        return code_bytes

    # Traverse the tree in reverse to avoid index shifts when removing nodes
    cursor = tree.walk()
    nodes_to_remove = []
    
    # Pre-order traversal to find all nodes to remove
    visited_children = False
    while True:
        if not visited_children:
            if cursor.node.type in types_to_strip:
                nodes_to_remove.append(cursor.node)
            
            if not cursor.goto_first_child():
                visited_children = True
        else:
            if not cursor.goto_next_sibling():
                if not cursor.goto_parent():
                    break
                visited_children = True
            else:
                visited_children = False

    # Remove nodes from the source bytes in reverse order of position
    for node in sorted(nodes_to_remove, key=lambda n: n.start_byte, reverse=True):
        code_bytes = code_bytes[:node.start_byte] + code_bytes[node.end_byte:]

    return code_bytes


async def strip_comments(code: str, lang: str) -> str:
    """
    Strips comments from a given source code string using a parser.

    Uses tree-sitter if available for accuracy, as it understands the code
    structure and can differentiate comments from strings or other syntax.

    Args:
        code: The source code.
        lang: The programming language.

    Returns:
        The code with comments removed.
    """
    if TREE_SITTER_AVAILABLE:
        tree = await parse_code(code, lang)
        if tree:
            # Tree-sitter grammars typically label comments as 'comment' or 'line_comment', 'block_comment'
            # We get all nodes and filter for 'comment' in their type
            code_bytes = code.encode("utf8")
            
            # Find all comment node types from the grammar
            comment_types = {
                "comment", "line_comment", "block_comment", "doc_comment"
            }
            
            stripped_bytes = _strip_nodes_by_type(code_bytes, tree, comment_types)
            return stripped_bytes.decode("utf8")

    # Fallback for when tree-sitter is not available or fails
    # This regex is basic and can fail on complex cases (e.g., comments in strings)
    if lang in ["python", "go", "javascript"]:
        import re
        # Basic single-line comment stripping
        return re.sub(r"//.*|#.*", "", code, flags=re.MULTILINE)
    
    return code


# --- 3. Identifier Renaming ---

IDENTIFIER_NODE_TYPES = {
    "python": {"identifier"},
    "java": {"identifier"},
    "javascript": {"identifier"},
    "cpp": {"identifier"},
    "go": {"identifier", "type_identifier"},
}

# --- Fallback for Python using builtin 'ast' ---

class PythonIdentifierRenamer(ast.NodeTransformer):
    """
    Walks Python's AST and replaces identifiers with placeholders.
    """
    def __init__(self):
        self.scope_stack = [{}] # Stack of scopes, each is a dict of {name: placeholder}
        self.counter = 0

    def _get_placeholder(self, name):
        # Check current scope
        if name in self.scope_stack[-1]:
            return self.scope_stack[-1][name]
        # If not found, create a new placeholder
        self.counter += 1
        placeholder = f"VAR_{self.counter}"
        self.scope_stack[-1][name] = placeholder
        return placeholder

    def visit_Name(self, node: ast.Name) -> ast.Name:
        if isinstance(node.ctx, (ast.Store, ast.Param)):
            # It's a declaration, define it in the current scope
            node.id = self._get_placeholder(node.id)
        elif isinstance(node.ctx, ast.Load):
            # It's a usage, find its placeholder by searching scopes
            for scope in reversed(self.scope_stack):
                if node.id in scope:
                    node.id = scope[node.id]
                    break
        return node

    def visit_FunctionDef(self, node: ast.FunctionDef) -> ast.FunctionDef:
        # Functions introduce a new scope for their body and arguments
        # Rename the function itself in the current scope
        node.name = self._get_placeholder(node.name)
        # New scope for function internals
        self.scope_stack.append({})
        self.generic_visit(node)
        self.scope_stack.pop()
        return node
    
    visit_AsyncFunctionDef = visit_FunctionDef


async def ast_rename_identifiers(code: str, lang: str) -> str:
    """
    Renames identifiers and literals in code to a canonical form.
    e.g., `def func(a):` -> `def FUNC_1(VAR_1):`

    This is a complex task. This implementation is a simplified example.
    A full implementation would require managing scopes properly.
    For Python, it falls back to the builtin `ast` module if tree-sitter fails.

    Args:
        code: The source code.
        lang: The programming language.

    Returns:
        The normalized code.
    """
    # Python has a robust builtin AST parser, so we can use it as a fallback
    if lang == "python":
        try:
            tree = ast.parse(code)
            renamer = PythonIdentifierRenamer()
            new_tree = renamer.visit(tree)
            ast.fix_missing_locations(new_tree)
            return ast.unparse(new_tree)
        except (SyntaxError, TypeError) as e:
            print(f"Fallback Python AST parsing failed: {e}")
            # Could still proceed with tree-sitter if available
            pass

    if not TREE_SITTER_AVAILABLE:
        return code # Cannot normalize non-python code without tree-sitter

    # Simplified tree-sitter implementation (doesn't handle scope)
    tree = await parse_code(code, lang)
    if not tree:
        return code
    
    id_types = IDENTIFIER_NODE_TYPES.get(lang, set())
    if not id_types:
        return code

    # This simple version renames all identifiers globally (no scope awareness)
    id_map: Dict[bytes, bytes] = {}
    counter = 0
    
    code_bytes = code.encode("utf8")
    
    cursor = tree.walk()
    nodes_to_replace = []
    
    # Pre-order traversal
    visited_children = False
    while True:
        if not visited_children:
            node_bytes = code_bytes[cursor.node.start_byte:cursor.node.end_byte]
            
            if cursor.node.type in id_types:
                if node_bytes not in id_map:
                    counter += 1
                    id_map[node_bytes] = f"ID_{counter}".encode("utf8")
                
                nodes_to_replace.append((cursor.node, id_map[node_bytes]))

            if not cursor.goto_first_child():
                visited_children = True
        else:
            if not cursor.goto_next_sibling():
                if not cursor.goto_parent():
                    break
                visited_children = True
            else:
                visited_children = False

    # Replace in reverse to preserve indices
    for node, placeholder in sorted(nodes_to_replace, key=lambda n: n[0].start_byte, reverse=True):
        code_bytes = code_bytes[:node.start_byte] + placeholder + code_bytes[node.end_byte:]

    return code_bytes.decode("utf8")


# --- Example Usage ---
async def main():
    python_code = """
# A simple function
def add_numbers(x, y):
    # This is a comment
    result = x + y  # Add them up
    return result
"""

    print("--- Original Python Code ---")
    print(python_code)

    print("\n--- 1. Formatted (with black) ---")
    formatted = await normalize_whitespace_and_format(python_code, "python")
    print(formatted)
    
    print("\n--- 2. Comments Stripped ---")
    no_comments = await strip_comments(python_code, "python")
    print(no_comments)
    
    print("\n--- 3. Identifiers Renamed (Python AST) ---")
    renamed = await ast_rename_identifiers(python_code, "python")
    print(renamed)


if __name__ == "__main__":
    asyncio.run(main())
