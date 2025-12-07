"""
Example usage of the generate_type3 function.

This script demonstrates how to use the code mutation generator to create
Type-3 clones using both rule-based and LLM-based approaches.
"""

from generators import PolyglotParser, generate_type3


def demo_python():
    """Demonstrate Python code mutation."""
    print("=" * 60)
    print("Python Example - Rule-Based Mutation")
    print("=" * 60)
    
    original_code = """for i in range(10):
    print(i)"""
    
    print("Original code:")
    print(original_code)
    print("\n")
    
    parser = PolyglotParser()
    mutated = generate_type3(original_code, 'python', use_llm=False, parser=parser)
    
    print("Mutated code:")
    print(mutated)
    print("\n")


def demo_python_function():
    """Demonstrate Python function mutation."""
    print("=" * 60)
    print("Python Function Example - Rule-Based Mutation")
    print("=" * 60)
    
    original_code = """def calculate_sum(n):
    for i in range(n):
        print(i)
    return n"""
    
    print("Original code:")
    print(original_code)
    print("\n")
    
    parser = PolyglotParser()
    mutated = generate_type3(original_code, 'python', use_llm=False, parser=parser)
    
    print("Mutated code:")
    print(mutated)
    print("\n")


def demo_java():
    """Demonstrate Java code mutation."""
    print("=" * 60)
    print("Java Example - Rule-Based Mutation")
    print("=" * 60)
    
    original_code = """public class Example {
    public void method() {
        for(int i = 0; i < 10; i++) {
            System.out.println(i);
        }
    }
}"""
    
    print("Original code:")
    print(original_code)
    print("\n")
    
    parser = PolyglotParser()
    mutated = generate_type3(original_code, 'java', use_llm=False, parser=parser)
    
    print("Mutated code:")
    print(mutated)
    print("\n")


def demo_javascript():
    """Demonstrate JavaScript code mutation."""
    print("=" * 60)
    print("JavaScript Example - Rule-Based Mutation")
    print("=" * 60)
    
    original_code = """function example() {
    for(let i = 0; i < 10; i++) {
        console.log(i);
    }
}"""
    
    print("Original code:")
    print(original_code)
    print("\n")
    
    parser = PolyglotParser()
    mutated = generate_type3(original_code, 'javascript', use_llm=False, parser=parser)
    
    print("Mutated code:")
    print(mutated)
    print("\n")


def demo_validation():
    """Demonstrate validation behavior."""
    print("=" * 60)
    print("Validation Example - Invalid Code Returns Original")
    print("=" * 60)
    
    # This code has syntax errors
    invalid_code = """def broken(
    print("This won't parse correctly")"""
    
    print("Invalid code:")
    print(invalid_code)
    print("\n")
    
    parser = PolyglotParser()
    result = generate_type3(invalid_code, 'python', use_llm=False, parser=parser)
    
    print("Result (should return original):")
    print(result)
    print("\nValidation prevented invalid mutation!")
    print("\n")


if __name__ == '__main__':
    demo_python()
    demo_python_function()
    demo_java()
    demo_javascript()
    demo_validation()
    
    print("=" * 60)
    print("Note: LLM-based mutations require Ollama with codegemma:7b")
    print("To use LLM: generate_type3(code, lang, use_llm=True)")
    print("=" * 60)
