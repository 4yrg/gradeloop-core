from tree_sitter import Language, Parser
import tree_sitter_java
import re

# Initialize Tree-sitter
JAVA_LANGUAGE = Language(tree_sitter_java.language())
parser = Parser()
parser.set_language(JAVA_LANGUAGE)

def remove_comments_and_whitespace(code: str) -> str:
    """
    Simpler preprocessing before tree-sitter if needed, 
    but Tree-sitter handles comments well. 
    This function specifically normalizes whitespace to single spaces.
    """
    # Remove single line comments
    code = re.sub(r'//.*', '', code)
    # Remove multi-line comments
    code = re.sub(r'/\*.*?\*/', '', code, flags=re.DOTALL)
    # Normalize whitespace
    code = re.sub(r'\s+', ' ', code)
    return code.strip()

def normalize_code_ast(code: str) -> str:
    """
    Uses Tree-sitter to perform blind renaming:
    - Identifiers -> VAR
    - String Literals -> "LIT"
    - Number Literals -> LIT
    """
    tree = parser.parse(bytes(code, "utf8"))
    
    # We will reconstruct the code from the tree, replacing specific nodes
    root_node = tree.root_node
    cursor = tree.walk()
    
    query_scm = """
    (identifier) @id
    (string_literal) @str
    (decimal_integer_literal) @num
    (decimal_floating_point_literal) @float
    """
    query = JAVA_LANGUAGE.query(query_scm)
    captures = query.captures(root_node)
    
    # Sort captures by byte range to handle them in order
    captures.sort(key=lambda x: x[0].start_byte)
    
    # Reconstruct code
    normalized_parts = []
    last_idx = 0
    code_bytes = bytes(code, "utf8")
    
    for node, name in captures:
        start = node.start_byte
        end = node.end_byte
        
        # Add non-captured text (keywords, punctuation, etc.)
        normalized_parts.append(code_bytes[last_idx:start].decode("utf8"))
        
        if name == 'id':
            normalized_parts.append("VAR") # Simplified placeholder
        elif name in ['str', 'num', 'float']:
            normalized_parts.append("LIT")
            
        last_idx = end
        
    normalized_parts.append(code_bytes[last_idx:].decode("utf8"))
    
    normalized_code = "".join(normalized_parts)
    # Clean up massive whitespaces introduced by replacement if any, though we constructed carefully
    return re.sub(r'\s+', ' ', normalized_code).strip()

def tokenize_source(code: str) -> list[str]:
    """
    Simple whitespace tokenizer on normalized code.
    """
    return code.split()
