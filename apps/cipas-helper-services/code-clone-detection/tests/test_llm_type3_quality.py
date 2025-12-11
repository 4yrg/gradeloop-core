"""
Test LLM-based Type-3 Generation Quality

This script tests the OllamaLLMClient to ensure it's producing valid Type-3 clones.
"""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))

import logging
from generation.type3_backtranslate import produce_type3, create_llm_client

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)


def validate_type3_clone(original: str, clone: str, lang: str) -> dict:
    """Validate that a clone meets Type-3 requirements."""
    issues = []
    
    # Check 1: Not empty or truncated
    if not clone or not clone.strip():
        issues.append("CRITICAL: Empty output")
        return {"valid": False, "issues": issues}
    
    if len(clone) < len(original) * 0.3:
        issues.append("CRITICAL: Severely truncated (< 30% of original)")
    
    # Check 2: Syntax validity
    if lang.lower() == "java":
        if clone.count('{') != clone.count('}'):
            issues.append(f"CRITICAL: Unbalanced braces - {{ {clone.count('{')} vs }} {clone.count('}')}")
        if clone.count('(') != clone.count(')'):
            issues.append(f"CRITICAL: Unbalanced parentheses - ( {clone.count('(')} vs ) {clone.count(')')}")
    
    # Check 3: Not identical to original
    if clone.strip() == original.strip():
        issues.append("WARNING: Clone is identical to original (should have modifications)")
    
    # Check 4: Core logic preserved (basic heuristic)
    original_lines = [l.strip() for l in original.split('\n') if l.strip()]
    clone_lines = [l.strip() for l in clone.split('\n') if l.strip()]
    
    # Check for critical keywords preservation
    critical_keywords = ['return', 'if', 'for', 'while', 'class', 'def', 'public', 'private']
    for keyword in critical_keywords:
        orig_count = sum(1 for line in original_lines if keyword in line)
        clone_count = sum(1 for line in clone_lines if keyword in line)
        
        if orig_count > 0 and clone_count == 0:
            issues.append(f"WARNING: Lost all '{keyword}' statements ({orig_count} → 0)")
    
    # Check 5: Not completely rewritten (Type-4)
    # Calculate rough similarity by checking if any original lines are preserved
    preserved_lines = sum(1 for orig_line in original_lines if any(orig_line in clone_line or clone_line in orig_line for clone_line in clone_lines))
    similarity = preserved_lines / len(original_lines) if original_lines else 0
    
    if similarity < 0.3:
        issues.append(f"WARNING: Very low similarity ({similarity:.1%}) - may be Type-4 (complete rewrite)")
    
    return {
        "valid": len([i for i in issues if i.startswith("CRITICAL")]) == 0,
        "issues": issues,
        "similarity": similarity,
        "length_ratio": len(clone) / len(original) if original else 0
    }


def test_java_samples():
    """Test with Java code samples."""
    print("="*70)
    print("Testing Java Type-3 Generation with Ollama LLM")
    print("="*70)
    
    samples = [
        ("Simple Add", """public int add(int a, int b) {
    int sum = a + b;
    return sum;
}"""),
        ("Factorial", """public int factorial(int n) {
    if (n <= 1) {
        return 1;
    }
    return n * factorial(n - 1);
}"""),
        ("Array Sum", """public int sumArray(int[] arr) {
    int total = 0;
    if (arr != null) {
        for (int i = 0; i < arr.length; i++) {
            total += arr[i];
        }
    }
    return total;
}"""),
    ]
    
    try:
        # Try to create Ollama client
        client = create_llm_client("ollama", {
            'model_name': 'codegemma:2b',
            'api': {'base_url': 'http://localhost:11434'},
            'settings': {'temperature': 0.1, 'max_tokens': 1000}
        })
        print("✓ Ollama client initialized\n")
    except Exception as e:
        print(f"✗ Failed to initialize Ollama client: {e}")
        print("Make sure Ollama is running: ollama serve")
        return False
    
    results = []
    
    for name, code in samples:
        print(f"\n{'-'*70}")
        print(f"Sample: {name}")
        print(f"{'-'*70}")
        print("Original:")
        print(code)
        print()
        
        try:
            clone = produce_type3(code, "java", client)
            
            print("Generated Clone:")
            print(clone)
            print()
            
            # Validate
            validation = validate_type3_clone(code, clone, "java")
            
            print("Validation:")
            print(f"  Valid: {'✓ YES' if validation['valid'] else '✗ NO'}")
            print(f"  Similarity: {validation['similarity']:.1%}")
            print(f"  Length Ratio: {validation['length_ratio']:.2f}")
            
            if validation['issues']:
                print("  Issues:")
                for issue in validation['issues']:
                    print(f"    - {issue}")
            else:
                print("  Issues: None (✓)")
            
            results.append({
                'name': name,
                'valid': validation['valid'],
                'issues': validation['issues']
            })
            
        except Exception as e:
            print(f"✗ ERROR: {e}")
            results.append({
                'name': name,
                'valid': False,
                'issues': [f"Exception: {str(e)}"]
            })
    
    # Summary
    print("\n" + "="*70)
    print("SUMMARY")
    print("="*70)
    
    valid_count = sum(1 for r in results if r['valid'])
    total_count = len(results)
    
    print(f"Valid clones: {valid_count}/{total_count} ({valid_count/total_count*100:.1f}%)")
    print()
    
    critical_issues = []
    for r in results:
        for issue in r['issues']:
            if issue.startswith("CRITICAL"):
                critical_issues.append(f"{r['name']}: {issue}")
    
    if critical_issues:
        print("Critical Issues Found:")
        for issue in critical_issues:
            print(f"  ✗ {issue}")
    else:
        print("✓ No critical issues found!")
    
    return valid_count == total_count


def test_python_samples():
    """Test with Python code samples."""
    print("\n" + "="*70)
    print("Testing Python Type-3 Generation with Ollama LLM")
    print("="*70)
    
    samples = [
        ("Multiply", """def multiply(a, b):
    result = a * b
    return result"""),
        ("Fibonacci", """def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n-1) + fibonacci(n-2)"""),
    ]
    
    try:
        client = create_llm_client("ollama", {
            'model_name': 'codegemma:2b',
            'api': {'base_url': 'http://localhost:11434'},
            'settings': {'temperature': 0.1, 'max_tokens': 1000}
        })
    except Exception as e:
        print(f"✗ Skipping Python tests - Ollama not available: {e}")
        return False
    
    results = []
    
    for name, code in samples:
        print(f"\n{'-'*70}")
        print(f"Sample: {name}")
        print(f"{'-'*70}")
        print("Original:")
        print(code)
        print()
        
        try:
            clone = produce_type3(code, "python", client)
            
            print("Generated Clone:")
            print(clone)
            print()
            
            validation = validate_type3_clone(code, clone, "python")
            
            print("Validation:")
            print(f"  Valid: {'✓ YES' if validation['valid'] else '✗ NO'}")
            print(f"  Similarity: {validation['similarity']:.1%}")
            
            if validation['issues']:
                print("  Issues:")
                for issue in validation['issues']:
                    print(f"    - {issue}")
            
            results.append({
                'name': name,
                'valid': validation['valid'],
                'issues': validation['issues']
            })
            
        except Exception as e:
            print(f"✗ ERROR: {e}")
            results.append({
                'name': name,
                'valid': False,
                'issues': [f"Exception: {str(e)}"]
            })
    
    valid_count = sum(1 for r in results if r['valid'])
    print(f"\nPython: {valid_count}/{len(results)} valid")
    
    return valid_count == len(results)


def main():
    """Run LLM quality tests."""
    print("\n" + "=" * 70)
    print("  LLM-Based Type-3 Generation - Quality Test")
    print("=" * 70)
    
    print("\nThis test validates that the Ollama LLM client generates valid Type-3 clones.")
    print("Requirements:")
    print("  1. Ollama must be running (ollama serve)")
    print("  2. Model codegemma:2b must be pulled (ollama pull codegemma:2b)")
    print()
    
    java_ok = test_java_samples()
    python_ok = test_python_samples()
    
    print("\n" + "="*70)
    print("FINAL RESULTS")
    print("="*70)
    
    if java_ok and python_ok:
        print("✓ All tests passed! LLM is generating valid Type-3 clones.")
        return 0
    elif java_ok or python_ok:
        print("⚠ Partial success - some tests passed but issues remain.")
        print("\nRecommendation: Use the direct transformation approach for production.")
        print("See: src/generation/type3_direct.py")
        return 1
    else:
        print("✗ Tests failed - LLM output has critical issues.")
        print("\nRecommendation: Use the direct transformation approach instead.")
        print("See: src/generation/type3_direct.py")
        return 1


if __name__ == "__main__":
    sys.exit(main())
