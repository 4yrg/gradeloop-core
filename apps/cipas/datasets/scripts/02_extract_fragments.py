
import json
import glob
from pathlib import Path
from tree_sitter import Language, Parser
import tree_sitter_java

# Paths
BASE_DIR = Path(__file__).resolve().parent.parent
SOURCE_DIR = BASE_DIR / "processing" / "bcb_source"
OUTPUT_JSONL = BASE_DIR / "processing" / "fragments.jsonl"

def get_parser(lang_module):
    language = Language(lang_module.language())
    parser = Parser(language)
    return parser

def extract_methods(file_path, parser):
    """
    Parses a Java file and extracts method decorations.
    Since we wrapped code in a class, we look for method declarations inside classes.
    """
    with open(file_path, "rb") as f:
        content = f.read()
    
    tree = parser.parse(content)
    root = tree.root_node
    
    fragments = []
    
    # Query to find method declarations
    # (method_declaration) @method
    # We can iterate manually or use a query. 
    # Manual iteration on root -> class_declaration -> body -> method_declaration is safer given we control the wrapper.
    
    # Find the top-level class (our wrapper)
    wrapper_class = None
    for child in root.children:
        if child.type == "class_declaration":
            wrapper_class = child
            break
            
    if not wrapper_class:
        # Fallback: maybe the file is just a method or something else.
        # But we wrapped it, so it should be there.
        # If the parsing failed to find class, maybe syntax error in content.
        # We can search recursively for any method_declaration.
        pass

    cursor = tree.walk()
    
    # helper for recursive search
    def collect_methods(node):
        if node.type == "method_declaration":
            # Extract
            start_line = node.start_point[0] + 1
            end_line = node.end_point[0] + 1
            # Get code from content bytes
            code_bytes = content[node.start_byte : node.end_byte]
            code_str = code_bytes.decode('utf-8', errors='replace')
            
            fragments.append({
                "type": "method",
                "code": code_str,
                "ast": str(node), # symbolic expression
                "start_line": start_line,
                "end_line": end_line
            })
        
        for child in node.children:
            collect_methods(child)
            
    collect_methods(root)
    
    return fragments

def main():
    print("Initializing Tree-sitter Java parser...")
    parser = get_parser(tree_sitter_java)
    
    print(f"Scanning {SOURCE_DIR}...")
    files = list(SOURCE_DIR.glob("*.java"))
    print(f"Found {len(files)} files to process.")
    
    count = 0
    with open(OUTPUT_JSONL, "w", encoding="utf-8") as out_f:
        for file_path in files:
            file_id = file_path.stem # The MD5 we used as filename
            
            try:
                # We expect 1 method per file mostly, but extract whatever is found.
                fragments = extract_methods(file_path, parser)
                
                if not fragments:
                    # If parsing failed or no method found (maybe just a block?), 
                    # we might just take the whole content minus wrapper?
                    # But reliable parsing is better.
                    pass
                
                # We save one entry for the main method we care about.
                # Since we wrapped exactly one snippet, we expect 1 method.
                # If multiple, we might have an issue or nested methods.
                # Let's write all found.
                
                # Wait, the ID should be unique. If we find multiple methods, 
                # we should probably suffix them or just take the first/largest?
                # Our snippet might be "valid method". 
                # Let's take the one that roughly matches the file size.
                
                # For A2, "Assign a stable unique ID to each method".
                # If we have 1 snippet -> 1 method, ID is file_id.
                
                if len(fragments) >= 1:
                    # In case of multiple (rare in snippets), take the longest one?
                    # Or just the first one?
                    # Let's pick the largest by length to be safe.
                    best_frag = max(fragments, key=lambda x: len(x['code']))
                    
                    record = {
                        "id": file_id, # Reuse the ID from A1
                        "language": "java",
                        "code": best_frag['code'],
                        "ast": best_frag['ast'],
                        "start_line": best_frag['start_line'],
                        "end_line": best_frag['end_line']
                    }
                    
                    out_f.write(json.dumps(record) + "\n")
                    count += 1
                    
            except Exception as e:
                print(f"Error processing {file_path.name}: {e}")
                
    print(f"Extracted {count} fragments to {OUTPUT_JSONL}")

if __name__ == "__main__":
    main()
