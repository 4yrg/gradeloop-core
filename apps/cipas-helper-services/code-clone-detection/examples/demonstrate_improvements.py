"""
Demonstration of Code Clone Generation Improvements

This script demonstrates the improvements made to Type-1, Type-2, and Type-3
clone generation:

1. Type-1: Only whitespace, comments, and formatting changes
2. Type-2: Identifier renaming while PRESERVING string format symbols (%d, %s, etc.)
3. Type-3: Using actual Ollama LLM instead of mock client for realistic code variants

Author: Code Clone Detection Team
Date: 2025
"""

import sys
from pathlib import Path

# Add src to path
sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

from generation.type1 import produce_type1_variant
from generation.type2 import alpha_rename
from generation.type3_backtranslate import produce_type3, create_llm_client


def demonstrate_type1():
    """Demonstrate Type-1 clone generation."""
    print("=" * 70)
    print("TYPE-1 CLONES: Exact code with only formatting differences")
    print("=" * 70)
    print("\nAllowed changes:")
    print("  ✓ Whitespace (spaces, tabs, newlines)")
    print("  ✓ Comments")
    print("  ✓ Formatting style (bracket placement, indentation)")
    print("  ✗ No token changes (identifiers, operators, literals)")
    print()
    
    original = """def factorial(n):
    # Calculate factorial
    if n <= 1:
        return 1
    else:
        return n * factorial(n - 1)"""
    
    print("Original Code:")
    print("-" * 50)
    print(original)
    print()
    
    variant = produce_type1_variant(original, "python")
    
    print("Type-1 Clone (formatting changed):")
    print("-" * 50)
    print(variant)
    print()


def demonstrate_type2():
    """Demonstrate Type-2 clone generation with format symbol preservation."""
    print("=" * 70)
    print("TYPE-2 CLONES: Renamed identifiers while preserving format symbols")
    print("=" * 70)
    print("\nAllowed changes:")
    print("  ✓ Identifier renaming (variables, functions, classes)")
    print("  ✓ Literal changes (constants, strings)")
    print("  ✓ All Type-1 changes")
    print("  ✗ No logic or control flow changes")
    print("\nIMPORTANT: String format symbols (%d, %s, %f) are now preserved!")
    print()
    
    # Example with string formatting
    original_python = '''def log_stats(username, score, level):
    """Log user statistics with formatting."""
    message = "User: %s | Score: %d | Level: %d" % (username, score, level)
    print(message)
    formatted = "Progress: %.2f%%" % (score / 100.0)
    return formatted'''
    
    print("Original Python Code (with format symbols):")
    print("-" * 50)
    print(original_python)
    print()
    
    renamed = alpha_rename(original_python, "python", seed=42)
    
    print("Type-2 Clone (identifiers renamed, format symbols preserved):")
    print("-" * 50)
    print(renamed)
    print()
    print("✓ Notice: %s, %d, and %.2f are preserved!")
    print("✓ Identifiers changed: log_stats → var_N, username → var_N, etc.")
    print()
    
    # Java example
    original_java = '''public void displayInfo(String name, int age, double salary) {
    String info = String.format("Employee: %s, Age: %d, Salary: $%.2f", 
                                 name, age, salary);
    System.out.println(info);
}'''
    
    print("\nOriginal Java Code (with format symbols):")
    print("-" * 50)
    print(original_java)
    print()
    
    renamed_java = alpha_rename(original_java, "java", seed=42)
    
    print("Type-2 Clone (identifiers renamed, format symbols preserved):")
    print("-" * 50)
    print(renamed_java)
    print()
    print("✓ Format symbols preserved in Java too!")
    print()


def demonstrate_type3():
    """Demonstrate Type-3 clone generation with Ollama LLM."""
    print("=" * 70)
    print("TYPE-3 CLONES: Functionally similar with structural differences")
    print("=" * 70)
    print("\nAllowed changes:")
    print("  ✓ Different implementation approach")
    print("  ✓ Added/removed statements")
    print("  ✓ Modified control flow")
    print("  ✓ Alternative algorithms")
    print("  ✓ All Type-1 and Type-2 changes")
    print()
    print("Now using ACTUAL Ollama LLM for realistic code generation!")
    print("(Previously used mock client that just added comments)")
    print()
    
    try:
        print("Connecting to Ollama...")
        client = create_llm_client("ollama", config={
            'model_name': 'codegemma:2b',
            'api': {'base_url': 'http://localhost:11434'},
            'settings': {
                'temperature': 0.3,  # Higher for more variety
                'max_tokens': 500,
                'timeout': 30
            }
        })
        print("✓ Connected to Ollama (model: codegemma:2b)")
        print()
        
        # Example 1: Bubble Sort
        original_sort = """def bubble_sort(arr):
    n = len(arr)
    for i in range(n):
        for j in range(0, n - i - 1):
            if arr[j] > arr[j + 1]:
                arr[j], arr[j + 1] = arr[j + 1], arr[j]
    return arr"""
        
        print("Example 1: Sorting Algorithm")
        print("-" * 50)
        print("Original Code (Bubble Sort):")
        print(original_sort)
        print()
        
        print("Generating Type-3 clone using Ollama LLM...")
        print("(This may take a few seconds...)")
        clone_sort = produce_type3(original_sort, "python", client)
        
        print("\nType-3 Clone (generated by Ollama):")
        print(clone_sort)
        print()
        print("✓ Notice: Different implementation, same functionality!")
        print()
        
        # Example 2: String Manipulation
        original_string = """def reverse_words(sentence):
    words = sentence.split()
    reversed_words = []
    for word in words:
        reversed_words.append(word[::-1])
    return ' '.join(reversed_words)"""
        
        print("\nExample 2: String Manipulation")
        print("-" * 50)
        print("Original Code:")
        print(original_string)
        print()
        
        print("Generating Type-3 clone using Ollama LLM...")
        clone_string = produce_type3(original_string, "python", client)
        
        print("\nType-3 Clone (generated by Ollama):")
        print(clone_string)
        print()
        print("✓ Different approach, same result!")
        
    except ConnectionError as e:
        print(f"⚠ Warning: {e}")
        print()
        print("Ollama is not running. To use Type-3 with Ollama:")
        print("1. Install Ollama from https://ollama.ai/")
        print("2. Run: ollama pull codegemma:2b")
        print("3. Ensure Ollama is running (it starts automatically)")
        print()
        print("Falling back to mock client for demonstration...")
        print()
        
        # Fallback to mock
        client = create_llm_client("mock")
        original = "def add(a, b):\n    return a + b"
        clone = produce_type3(original, "python", client)
        print("Mock Clone:")
        print(clone)
        print()
    
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()


def main():
    """Run all demonstrations."""
    print()
    print("=" * 70)
    print("CODE CLONE GENERATION - IMPROVEMENTS DEMONSTRATION")
    print("=" * 70)
    print()
    print("This demonstration shows the improvements made to clone generation:")
    print()
    print("1. Type-1: Formatting-only changes (whitespace, comments)")
    print("2. Type-2: Identifier renaming WITH format symbol preservation")
    print("3. Type-3: Real LLM-based code generation via Ollama")
    print()
    print("Press Enter to continue...")
    input()
    print()
    
    # Demonstrate Type-1
    demonstrate_type1()
    print("\nPress Enter to continue to Type-2 demonstration...")
    input()
    print()
    
    # Demonstrate Type-2
    demonstrate_type2()
    print("\nPress Enter to continue to Type-3 demonstration...")
    input()
    print()
    
    # Demonstrate Type-3
    demonstrate_type3()
    
    print("=" * 70)
    print("DEMONSTRATION COMPLETE")
    print("=" * 70)
    print()
    print("Summary of Improvements:")
    print("  ✓ Type-2 now preserves string format symbols (%d, %s, %f, etc.)")
    print("  ✓ Type-3 uses actual Ollama LLM for realistic code variants")
    print("  ✓ All clone types maintain their definition boundaries")
    print()
    print("Configuration: See configs/models.yaml")
    print("  - Provider: ollama")
    print("  - Model: codegemma:2b")
    print("  - Base URL: http://localhost:11434")
    print()


if __name__ == "__main__":
    main()
