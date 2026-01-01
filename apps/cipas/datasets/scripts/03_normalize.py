
import json
import tree_sitter_java
from tree_sitter import Language, Parser
from pathlib import Path

# Paths
BASE_DIR = Path(__file__).resolve().parent.parent
INPUT_JSONL = BASE_DIR / "processing" / "fragments.jsonl"
OUTPUT_JSONL = BASE_DIR / "processing" / "fragments_normalized.jsonl"

def get_parser(lang_module):
    language = Language(lang_module.language())
    parser = Parser(language)
    return parser

def normalize_code(code: str, parser) -> tuple[list[str], str]:
    """
    Apply blind renaming:
    - Identifiers -> "ID"
    - Literals -> "LIT"
    - Remove comments
    - Preserve keywords/operators
    """
    # Parse
    tree = parser.parse(bytes(code, "utf8"))
    
    # Traverse leaves to get tokens
    tokens = []
    
    # helper for recursion
    # We use a cursor? Or just recursion. 
    # Tree traversal order: usually depth first.
    # We want token stream. Leaves in order.
    
    cursor = tree.walk()
    
    visited_children = False
    
    # Iterative traversal that yields leaves
    # But wait, some leaves are just "identifier".
    # We need to know if it is a leave.
    
    # Simpler approach using node children if efficient.
    # Recursion is fine for snippets.
    
    def traverse(node):
        # Filter comments
        if node.type == 'comment' or node.type == 'block_comment' or node.type == 'line_comment':
            return
            
        if node.child_count == 0:
            # Leaf node
            # Check type
            text = code[node.start_byte:node.end_byte] # wait, indices might be off if unicode? 
            # bytes slicing!
            text = bytes(code, "utf8")[node.start_byte:node.end_byte].decode("utf8")
            
            # Logic
            if node.type == 'identifier':
                tokens.append("ID")
            elif "literal" in node.type and node.type != "null_literal": # Treat null as keyword/LIT? Prompt says "string, numeric, boolean". allow null as is?
                # null_literal is usually semantic. Let's make it LIT or leave as null. 
                # "All string, numeric, boolean literals" -> LIT.
                # decimal_integer_literal, hex_integer_literal, string_literal, character_literal, boolean_literal (true/false)
                tokens.append("LIT")
            else:
                 # Check if it is a generic token like "class" or "+"
                 # Usually if it has no children, it's a token.
                 # Just append the text.
                 tokens.append(text)
        else:
            for child in node.children:
                traverse(child)

    traverse(tree.root_node)
    
    # Join
    normalized_str = " ".join(tokens)
    return tokens, normalized_str

def main():
    print("Initializing parser...")
    parser = get_parser(tree_sitter_java)
    
    # Validation Case
    case1 = "int sum = a + b;"
    case2 = "int total = x + y;"
    print("Running validation case...")
    _, n1 = normalize_code(case1, parser)
    _, n2 = normalize_code(case2, parser)
    print(f"Original: {case1} -> Normalized: {n1}")
    print(f"Original: {case2} -> Normalized: {n2}")
    
    if n1 == n2:
         print("VALIDATION SUCCESS: Normalized outputs are identical.")
    else:
         print("VALIDATION FAILED: Outputs differ.")
         return

    print(f"Processing {INPUT_JSONL}...")
    count = 0
    with open(INPUT_JSONL, "r") as f_in, open(OUTPUT_JSONL, "w") as f_out:
        for line in f_in:
            data = json.loads(line)
            code = data['code']
            
            tokens, norm_str = normalize_code(code, parser)
            
            data['normalized_tokens'] = tokens
            data['normalized_code'] = norm_str
            
            f_out.write(json.dumps(data) + "\n")
            count += 1
            if count % 1000 == 0:
                print(f"Processed {count} fragments...")
                
    print(f"Done. Processed {count} fragments. Output: {OUTPUT_JSONL}")

if __name__ == "__main__":
    main()
