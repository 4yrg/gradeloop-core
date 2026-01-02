import tree_sitter_java as tsjava
from tree_sitter import Parser, Language
from collections import Counter
from typing import Dict

parser = Parser()
parser.language = Language(tsjava.language())

# Relevant node types for syntactic similarity
INTERESTING_NODES = {
    'if_statement', 'for_statement', 'while_statement', 'do_statement',
    'switch_statement', 'try_statement', 'catch_clause', 'throw_statement',
    'return_statement', 'method_declaration', 'field_declaration',
    'local_variable_declaration', 'assignment_expression', 
    'binary_expression', 'method_invocation', 'object_creation_expression'
}

def extract_ast_features(code: str) -> Dict[str, int]:
    """
    Parses code and counts occurrences of interesting AST node types.
    """
    if not code.strip():
        return {}

    tree = parser.parse(bytes(code, "utf8"))
    cursor = tree.walk()
    
    counts = Counter()
    
    # Traverse tree
    visited_children = False
    while True:
        if not visited_children:
            if cursor.node.type in INTERESTING_NODES:
                counts[cursor.node.type] += 1
            if cursor.goto_first_child():
                continue
        
        if cursor.goto_next_sibling():
            visited_children = False
        elif cursor.goto_parent():
            visited_children = True
        else:
            break
            
    return dict(counts)
