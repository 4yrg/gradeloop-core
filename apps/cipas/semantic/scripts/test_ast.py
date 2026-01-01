
import sys
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent.parent
sys.path.append(str(BASE_DIR))

from apps.cipas.semantic.services.ast_flattener import ASTFlattener

def test_flatten():
    code = """
    public class HelloWorld {
        public static void main(String[] args) {
            System.out.println("Hello, World!");
        }
    }
    """
    flattener = ASTFlattener()
    flat = flattener.flatten(code)
    print("Code length:", len(code))
    print("Flattened AST length:", len(flat.split()))
    print("First 10 tokens:", flat.split()[:10])

if __name__ == "__main__":
    test_flatten()
