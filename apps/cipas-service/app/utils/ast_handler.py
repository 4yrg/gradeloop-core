from typing import List, Dict, Any

try:
    import tree_sitter_languages
    from tree_sitter import Parser, Node
    HAS_TREE_SITTER = True
except ImportError:
    HAS_TREE_SITTER = False
    Node = Any
    Parser = Any
    print("Warning: tree-sitter-languages not found. AST features will be disabled.")

class ASTHandler:
    def __init__(self, language: str = 'java'):
        self.language_name = language
        if HAS_TREE_SITTER:
            try:
                self.language = tree_sitter_languages.get_language(language)
                self.parser = tree_sitter_languages.get_parser(language)
            except Exception as e:
                print(f"Error loading language {language}: {e}")
                self.language = None
                self.parser = None
        else:
            self.language = None
            self.parser = None

    def parse(self, source_code: str) -> Any:
        if not self.parser:
            return None
        return self.parser.parse(bytes(source_code, "utf8"))

    def extract_fragments(self, source_code: str) -> List[Dict[str, str]]:
        """
        Extracts methods, loops, and conditionals as code fragments.
        """
        fragments = []
        source_lines = source_code.splitlines()

        if not self.parser or not self.language:
            # Fallback to whole code as single fragment
            fragments.append({
                "type": "raw_fragment",
                "code": source_code,
                "start_line": 0,
                "end_line": len(source_lines)
            })
            return fragments

        tree = self.parse(source_code)
        root_node = tree.root_node
        
        # Define query to catch methods, loops, conditionals
        # This is a simplified query; real-world queries might be more complex
        # Java specific node types
        query_str = """
        (method_declaration) @method
        (constructor_declaration) @method
        (for_statement) @loop
        (enhanced_for_statement) @loop
        (while_statement) @loop
        (do_statement) @loop
        (if_statement) @conditional
        (switch_expression) @conditional
        """
        
        try:
            query = self.language.query(query_str)
            captures = query.captures(root_node)
            
            for node, tag in captures:
                start_byte = node.start_byte
                end_byte = node.end_byte
                
                # Using byte offsets on the original utf8 string is safer
                fragment_code = bytes(source_code, "utf8")[start_byte:end_byte].decode("utf8")

                fragments.append({
                    "type": tag,
                    "code": fragment_code,
                    "start_line": node.start_point[0],
                    "end_line": node.end_point[0]
                })
        except Exception as e:
            print(f"Error querying AST: {e}")
            
        # If no specific fragments found (e.g. it's already a fragment), return the whole thing
        if not fragments:
            fragments.append({
                "type": "raw_fragment",
                "code": source_code,
                "start_line": 0,
                "end_line": len(source_lines)
            })

        return fragments

    def get_node_text(self, node: Node, source_code: str) -> str:
        if not node: return ""
        return bytes(source_code, "utf8")[node.start_byte:node.end_byte].decode("utf8")
