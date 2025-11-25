# model-orchestrator/cipas/code_clone_detection/parsers/tree_sitter_wrapper.py
import asyncio
from typing import Optional

try:
    from tree_sitter import Language, Parser, Tree
    TREE_SITTER_AVAILABLE = True
except ImportError:
    TREE_SITTER_AVAILABLE = False
    Language, Parser, Tree = None, None, None

# Mapping of languages to their tree-sitter grammar library names
# This assumes they are installed via pip, e.g., pip install tree-sitter-python
LANGUAGE_GRAMMARS = {
    "python": "tree_sitter_python",
    "javascript": "tree_sitter_javascript",
    "java": "tree_sitter_java",
    "cpp": "tree_sitter_cpp",
    "go": "tree_sitter_go",
    "c": "tree_sitter_c", # Often included with cpp, but can be separate
}

# A cache for loaded Language objects
LOADED_LANGUAGES = {}

def get_language(lang: str) -> Optional["Language"]:
    """
    Loads and returns a tree-sitter Language object for the given language.

    This function dynamically loads the required language grammar.
    It assumes that the necessary grammar library (e.g., 'tree-sitter-python')
    is installed in the environment.

    Installation Instructions for tree-sitter:
    1. Install the base library:
       `pip install tree-sitter`
    
    2. Install grammars for each language you need to parse:
       `pip install tree-sitter-python tree-sitter-javascript tree-sitter-java ...`

    Args:
        lang: The programming language (e.g., "python", "java").

    Returns:
        The tree-sitter Language object if available, otherwise None.
    """
    if not TREE_SITTER_AVAILABLE:
        return None

    if lang in LOADED_LANGUAGES:
        return LOADED_LANGUAGES[lang]

    grammar_module_name = LANGUAGE_GRAMMARS.get(lang)
    if not grammar_module_name:
        # Potentially log a warning here
        return None

    try:
        # Dynamically import the grammar module and get the language object
        # e.g., from tree_sitter_python import language as get_lang_func
        grammar_module = __import__(grammar_module_name)
        language_func = getattr(grammar_module, "language")
        
        language_object = language_func()
        LOADED_LANGUAGES[lang] = language_object
        return language_object

    except (ImportError, AttributeError):
        # Log an error: Grammar not found or module is malformed
        print(f"Warning: tree-sitter grammar for '{lang}' not found. Please install '{grammar_module_name}'.")
        return None


async def parse_code(code: str, lang: str) -> Optional["Tree"]:
    """
    Asynchronously parses source code using tree-sitter.

    Tree-sitter's parsing is CPU-bound and synchronous. This function
    wraps the synchronous call in `asyncio.to_thread` to avoid blocking
    the event loop in an async application.

    Args:
        code: The source code text to parse.
        lang: The programming language.

    Returns:
        A tree-sitter Tree object representing the parsed AST, or None
        if the language is unsupported or tree-sitter is unavailable.
    """
    if not TREE_SITTER_AVAILABLE:
        return None

    language = get_language(lang)
    if not language:
        return None

    def _parse_sync():
        parser = Parser()
        parser.set_language(language)
        return parser.parse(bytes(code, "utf8"))

    # Run the synchronous, CPU-bound parsing in a separate thread
    tree = await asyncio.to_thread(_parse_sync)
    return tree

# --- Example Usage ---
async def main():
    """Example of how to use the parse_code function."""
    python_code = "def hello(name):\n    print(f'Hello, {name}!')"
    java_code = 'public class HelloWorld {\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n    }\n}'

    print("--- Parsing Python ---")
    python_tree = await parse_code(python_code, "python")
    if python_tree:
        print("Root node:", python_tree.root_node.sexp())
    else:
        print("Could not parse Python (is tree-sitter-python installed?).")

    print("\n--- Parsing Java ---")
    java_tree = await parse_code(java_code, "java")
    if java_tree:
        print("Root node:", java_tree.root_node.sexp())
    else:
        print("Could not parse Java (is tree-sitter-java installed?).")

if __name__ == "__main__":
    # Ensure you have run: pip install tree-sitter tree-sitter-python tree-sitter-java
    asyncio.run(main())
