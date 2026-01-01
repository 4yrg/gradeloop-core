# Converts tree-sitter ASTs to UniXcoder sequences [cite: 89, 142]


import tree_sitter_java as tsjava
from tree_sitter import Language, Parser

class ASTFlattener:
    def __init__(self):
        self.JAVA_LANGUAGE = Language(tsjava.language())
        self.parser = Parser(self.JAVA_LANGUAGE)

    def flatten(self, code: str) -> str:
        """
        Convert code to flattened AST sequence for UniXcoder.
        """
        if not code:
            return ""

        # Parse
        tree = self.parser.parse(bytes(code, "utf8"))
        root_node = tree.root_node

        # DFS Traversal
        tokens = []
        stack = [root_node]
        
        while stack:
            node = stack.pop()
            
            # Use node type as token
            tokens.append(node.type)
            
            # Push children (reverse order to process first child first)
            for i in range(len(node.children) - 1, -1, -1):
                stack.append(node.children[i])
                
        return " ".join(tokens)

