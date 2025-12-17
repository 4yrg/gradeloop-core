import random
import re
from typing import List
from .ast_handler import ASTHandler

class DataAugmentor:
    def __init__(self, language: str = 'java'):
        self.ast_handler = ASTHandler(language)
    
    def augment(self, code: str, num_variations: int = 2) -> List[str]:
        variations = set()
        attempts = 0
        while len(variations) < num_variations and attempts < num_variations * 2:
            attempts += 1
            method = random.choice(['rename', 'swap'])
            if method == 'rename':
                new_code = self.rename_identifiers(code)
            else:
                new_code = self.swap_statements(code)
            
            if new_code != code:
                variations.add(new_code)
        
        return list(variations)

    def rename_identifiers(self, code: str) -> str:
        # Simple AST-guided renaming
        # We need to query all identifiers
        tree = self.ast_handler.parse(code)
        if not tree or not self.ast_handler.language:
            return code
            
        try:
            query = self.ast_handler.language.query("(identifier) @id")
            captures = query.captures(tree.root_node)
            
            # Get unique identifiers
            identifiers = set()
            for node, _ in captures:
                identifiers.add(self.ast_handler.get_node_text(node, code))
                
            # Create mapping
            mapping = {}
            for idx, ident in enumerate(identifiers):
                # Skip language keywords or common types if possible, 
                # but for now we rename everything that parses as identifier
                mapping[ident] = f"var_{idx}_{random.randint(100,999)}"
                
            # Apply replacements
            # We must replace tokens. 
            # CAUTION: Simple replace might break substrings. 
            # Better: reconstruct string or replacements by range.
            # But tree-sitter ranges are read-only. We need to apply edits from bottom up.
            
            # Let's collect all identifier nodes, sort by start_byte desc
            id_nodes = [n for n, t in captures]
            id_nodes.sort(key=lambda x: x.start_byte, reverse=True)
            
            code_bytes = bytes(code, "utf8")
            
            for node in id_nodes:
                text = code_bytes[node.start_byte:node.end_byte].decode("utf8")
                if text in mapping:
                    new_text = mapping[text]
                    # Replace in byte array
                    code_bytes = code_bytes[:node.start_byte] + bytes(new_text, "utf8") + code_bytes[node.end_byte:]
                    
            return code_bytes.decode("utf8")
        except Exception as e:
            print(f"Error renaming identifiers: {e}")
            return code

    def swap_statements(self, code: str) -> str:
        # Find block which has multiple statements
        # For simplicity in POC, we just split by semicolons and swap lines if it looks like a block
        # Real AST swapping is safer but complex to implement "re-stitch"
        
        lines = code.splitlines()
        if len(lines) < 3:
            return code
            
        # Random swap of two non-empty lines
        idx1 = random.randint(0, len(lines)-2)
        idx2 = idx1 + 1
        
        lines[idx1], lines[idx2] = lines[idx2], lines[idx1]
        return "\n".join(lines)
