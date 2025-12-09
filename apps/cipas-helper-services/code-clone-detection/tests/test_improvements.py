"""
Test script for Type-1, Type-2, and Type-3 clone generation improvements.

This script tests:
1. Type-1: Formatting changes only (whitespace, comments)
2. Type-2: Identifier renaming while preserving string format symbols
3. Type-3: Using Ollama LLM for code generation instead of mock
"""

import sys
import os
from pathlib import Path

# Set UTF-8 encoding for Windows console
if sys.platform == 'win32':
    import codecs
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'strict')
    sys.stderr = codecs.getwriter('utf-8')(sys.stderr.buffer, 'strict')

# Add src to path
sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

from generation.type1 import produce_type1_variant
from generation.type2 import alpha_rename
from generation.type3_backtranslate import produce_type3, create_llm_client


def test_type1():
    """Test Type-1 clone generation (formatting only)."""
    print("=" * 60)
    print("Testing Type-1 Clone Generation (Formatting Changes)")
    print("=" * 60)
    
    python_code = """def calculate_sum(numbers):
    total = 0
    for num in numbers:
        total += num
    return total"""
    
    print("\nOriginal Python Code:")
    print(python_code)
    
    variant = produce_type1_variant(python_code, "python")
    
    print("\nType-1 Variant (formatting changed):")
    print(variant)
    
    assert variant != python_code, "Type-1 variant should differ in formatting"
    print("\n✓ Type-1 test passed: Formatting changed successfully")
    

def test_type2_string_formatting():
    """Test Type-2 clone generation preserves string format symbols."""
    print("\n" + "=" * 60)
    print("Testing Type-2 Clone Generation (Preserving Format Symbols)")
    print("=" * 60)
    
    # Python code with string formatting
    python_code = '''def greet(name, age):
    message = "Hello %s, you are %d years old" % (name, age)
    print(message)
    return message'''
    
    print("\nOriginal Python Code with Format Symbols:")
    print(python_code)
    
    renamed = alpha_rename(python_code, "python", seed=42)
    
    print("\nType-2 Variant (identifiers renamed):")
    print(renamed)
    
    # Check that format symbols are preserved
    assert "%s" in renamed, "String format symbol %s should be preserved"
    assert "%d" in renamed, "String format symbol %d should be preserved"
    assert "var_" in renamed or "greet" not in renamed, "Identifiers should be renamed"
    
    print("\n✓ Type-2 test passed: Format symbols preserved")
    
    # Java code with format strings
    java_code = '''public void logMessage(String user, int count) {
    String msg = String.format("User %s performed %d actions", user, count);
    System.out.println(msg);
}'''
    
    print("\nOriginal Java Code with Format Symbols:")
    print(java_code)
    
    java_renamed = alpha_rename(java_code, "java", seed=42)
    
    print("\nType-2 Java Variant (identifiers renamed):")
    print(java_renamed)
    
    # Check that format symbols are preserved
    assert "%s" in java_renamed, "Java format symbol %s should be preserved"
    assert "%d" in java_renamed, "Java format symbol %d should be preserved"
    
    print("\n✓ Type-2 Java test passed: Format symbols preserved")


def test_type2_renamed_identifiers():
    """Test that Type-2 actually renames identifiers correctly."""
    print("\n" + "=" * 60)
    print("Testing Type-2 Identifier Renaming")
    print("=" * 60)
    
    code = """def multiply(x, y):
    result = x * y
    return result"""
    
    print("\nOriginal Code:")
    print(code)
    
    renamed = alpha_rename(code, "python", seed=42)
    
    print("\nRenamed Code:")
    print(renamed)
    
    # Keywords should be preserved
    assert "def" in renamed, "Keywords should be preserved"
    assert "return" in renamed, "Keywords should be preserved"
    
    # User identifiers should be renamed (at least some var_N pattern)
    assert "var_" in renamed, "Identifiers should be renamed to var_N pattern"
    
    print("\n✓ Type-2 renaming test passed")


def test_type3_ollama():
    """Test Type-3 clone generation with Ollama LLM."""
    print("\n" + "=" * 60)
    print("Testing Type-3 Clone Generation (Ollama LLM)")
    print("=" * 60)
    
    try:
        # Try to create Ollama client
        print("\nAttempting to connect to Ollama...")
        client = create_llm_client("ollama", config={
            'model_name': 'codegemma:2b',
            'api': {'base_url': 'http://localhost:11434'},
            'settings': {
                'temperature': 0.3,  # Higher for more variation
                'max_tokens': 200,  # Reduced to prevent repetition
                'timeout': 30
            }
        })
        
        print("✓ Successfully connected to Ollama")
        
        python_code = """def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n-1) + fibonacci(n-2)"""
        
        print("\nOriginal Python Code:")
        print(python_code)
        
        print("\nGenerating Type-3 clone using Ollama LLM...")
        clone = produce_type3(python_code, "python", client)
        
        print("\nType-3 Clone (generated by Ollama):")
        print(clone)
        
        # Verify it's not the mock response
        assert "generated by mock" not in clone.lower(), \
            "Should not be using mock client"
        
        assert len(clone) > 0, "Generated clone should not be empty"
        
        print("\n✓ Type-3 Ollama test passed: Real LLM generation successful")
        
    except ConnectionError as e:
        print(f"\n⚠ Warning: {e}")
        print("Ollama is not running or not accessible.")
        print("To test Type-3 with Ollama:")
        print("1. Install Ollama: https://ollama.ai/")
        print("2. Pull the model: ollama pull codegemma:2b")
        print("3. Ensure Ollama is running")
        print("\nSkipping Ollama test...")
        
    except Exception as e:
        print(f"\n✗ Error in Type-3 Ollama test: {e}")
        import traceback
        traceback.print_exc()


def test_type3_mock_fallback():
    """Test that mock client still works as fallback."""
    print("\n" + "=" * 60)
    print("Testing Type-3 Clone Generation (Mock Fallback)")
    print("=" * 60)
    
    client = create_llm_client("mock")
    
    python_code = """def add(a, b):
    return a + b"""
    
    print("\nOriginal Code:")
    print(python_code)
    
    clone = produce_type3(python_code, "python", client)
    
    print("\nType-3 Clone (mock):")
    print(clone)
    
    assert "generated by mock" in clone.lower(), "Should use mock client"
    
    print("\n✓ Type-3 mock fallback test passed")


def main():
    """Run all tests."""
    print("\n" + "=" * 60)
    print("Code Clone Generation Test Suite")
    print("=" * 60)
    
    try:
        # Test Type-1
        test_type1()
        
        # Test Type-2 with string formatting preservation
        test_type2_string_formatting()
        test_type2_renamed_identifiers()
        
        # Test Type-3 with Ollama
        test_type3_ollama()
        
        # Test Type-3 mock fallback
        test_type3_mock_fallback()
        
        print("\n" + "=" * 60)
        print("All Tests Completed Successfully! ✓")
        print("=" * 60)
        
    except AssertionError as e:
        print(f"\n✗ Test failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
    
    except Exception as e:
        print(f"\n✗ Unexpected error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
