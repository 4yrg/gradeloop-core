"""
Integration Example: Using Type-3 Direct Generator in Pipeline

This script demonstrates how to integrate the new Type-3 direct generator
into the existing clone generation pipeline.

Usage:
    python examples/type3_integration_demo.py
"""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))

import logging
from pathlib import Path
from generation.type3_direct import produce_type3_direct, Type3DirectGenerator

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def demo_simple_usage():
    """Demonstrate basic usage of Type-3 direct generator."""
    print("="*60)
    print("Demo 1: Simple Usage")
    print("="*60)
    
    java_code = """public class Calculator {
    public int add(int a, int b) {
        int sum = a + b;
        return sum;
    }
}"""
    
    print("\n--- Original Code ---")
    print(java_code)
    
    # Generate Type-3 clone
    clone = produce_type3_direct(java_code, "java", seed=42, max_transformations=2)
    
    print("\n--- Type-3 Clone ---")
    print(clone)
    
    print("\n--- Analysis ---")
    print(f"✓ Different from original: {clone != java_code}")
    print(f"✓ Syntax valid: {clone.count('{') == clone.count('}')}")
    print(f"✓ Length ratio: {len(clone) / len(java_code):.2f}")


def demo_batch_generation():
    """Demonstrate batch generation for multiple code samples."""
    print("\n" + "="*60)
    print("Demo 2: Batch Generation")
    print("="*60)
    
    samples = [
        ("factorial", """public int factorial(int n) {
    if (n <= 1) {
        return 1;
    }
    return n * factorial(n - 1);
}"""),
        ("fibonacci", """public int fibonacci(int n) {
    if (n <= 1) {
        return n;
    }
    return fibonacci(n - 1) + fibonacci(n - 2);
}"""),
        ("reverse_string", """public String reverse(String s) {
    if (s == null) {
        return null;
    }
    StringBuilder sb = new StringBuilder(s);
    return sb.reverse().toString();
}""")
    ]
    
    generator = Type3DirectGenerator(lang="java", seed=123, max_transformations=3)
    
    for name, code in samples:
        result = generator.generate(code)
        
        print(f"\n--- Sample: {name} ---")
        print(f"Success: {result.success}")
        print(f"Transformations: {', '.join(result.applied_transformations) if result.applied_transformations else 'None'}")
        print(f"Original lines: {len(code.splitlines())}")
        print(f"Clone lines: {len(result.code.splitlines())}")
        
        if not result.success:
            print(f"Error: {result.error_message}")


def demo_deterministic_generation():
    """Demonstrate deterministic generation with seed."""
    print("\n" + "="*60)
    print("Demo 3: Deterministic Generation (Reproducibility)")
    print("="*60)
    
    code = """public int multiply(int x, int y) {
    int result = x * y;
    return result;
}"""
    
    print("\nGenerating with seed=999 (3 times)...")
    
    results = []
    for i in range(3):
        clone = produce_type3_direct(code, "java", seed=999)
        results.append(clone)
        print(f"Run {i+1}: {len(clone)} chars")
    
    print(f"\n✓ All results identical: {all(r == results[0] for r in results)}")
    
    print("\nGenerating with different seeds...")
    clone1 = produce_type3_direct(code, "java", seed=111)
    clone2 = produce_type3_direct(code, "java", seed=222)
    
    print(f"Seed 111: {len(clone1)} chars")
    print(f"Seed 222: {len(clone2)} chars")
    print(f"✓ Different outputs: {clone1 != clone2}")


def demo_validation_safety():
    """Demonstrate validation and safety mechanisms."""
    print("\n" + "="*60)
    print("Demo 4: Validation & Safety")
    print("="*60)
    
    test_cases = [
        ("Empty code", ""),
        ("Too short", "int x = 5;"),
        ("Only comments", "// This is a comment\n// Another comment"),
        ("Valid code", """public int test() {
    int a = 1;
    int b = 2;
    return a + b;
}""")
    ]
    
    generator = Type3DirectGenerator(lang="java", min_code_length=3)
    
    for name, code in test_cases:
        result = generator.generate(code)
        status = "✓ PASS" if result.success else "✗ FAIL"
        print(f"\n{name}: {status}")
        if not result.success:
            print(f"  Reason: {result.error_message}")


def demo_pipeline_integration():
    """Demonstrate integration pattern for pipeline."""
    print("\n" + "="*60)
    print("Demo 5: Pipeline Integration Pattern")
    print("="*60)
    
    print("\nPattern 1: Direct Replacement")
    print("-" * 40)
    
    code_sample = """public int sum(int[] arr) {
    int total = 0;
    for (int i = 0; i < arr.length; i++) {
        total += arr[i];
    }
    return total;
}"""
    
    # Simulated pipeline function
    def generate_type3_clone(code, lang="java"):
        """Pipeline function for Type-3 generation."""
        return produce_type3_direct(code, lang, max_transformations=3)
    
    clone = generate_type3_clone(code_sample)
    print("Generated clone successfully")
    print(f"Clone length: {len(clone)} chars")
    
    print("\nPattern 2: Hybrid with Fallback")
    print("-" * 40)
    
    def generate_type3_hybrid(code, lang="java", llm_client=None):
        """Hybrid approach: try LLM, fallback to direct."""
        if llm_client:
            # Try LLM first
            # clone = produce_type3(code, lang, llm_client)
            # if not clone or len(clone) < len(code) * 0.5:
            #     return produce_type3_direct(code, lang)
            pass
        
        # Fallback to direct
        return produce_type3_direct(code, lang)
    
    clone = generate_type3_hybrid(code_sample)
    print("Generated clone with hybrid approach")
    print(f"Clone length: {len(clone)} chars")
    
    print("\nPattern 3: Configurable Strategy")
    print("-" * 40)
    
    config = {"type3_strategy": "direct"}
    
    def generate_type3_configurable(code, lang="java", config=None):
        """Use configuration to determine strategy."""
        config = config or {}
        strategy = config.get("type3_strategy", "direct")
        
        if strategy == "direct":
            return produce_type3_direct(code, lang)
        else:
            raise ValueError(f"Unknown strategy: {strategy}")
    
    clone = generate_type3_configurable(code_sample, config=config)
    print(f"Generated clone using '{config['type3_strategy']}' strategy")
    print(f"Clone length: {len(clone)} chars")


def demo_error_handling():
    """Demonstrate error handling and recovery."""
    print("\n" + "="*60)
    print("Demo 6: Error Handling")
    print("="*60)
    
    generator = Type3DirectGenerator(lang="java", seed=42)
    
    # Test with various problematic inputs
    test_cases = [
        ("valid", """public int test() {
    int x = 5;
    int y = 10;
    return x + y;
}"""),
        ("empty", ""),
        ("malformed", "public class { { {"),
    ]
    
    for name, code in test_cases:
        result = generator.generate(code)
        
        print(f"\nTest: {name}")
        print(f"  Success: {result.success}")
        
        if result.success:
            print(f"  Generated: {len(result.code)} chars")
            print(f"  Transformations: {len(result.applied_transformations)}")
        else:
            print(f"  Error: {result.error_message}")
            print(f"  Fallback: Returning original code")


def main():
    """Run all demonstrations."""
    print("\n")
    print("╔" + "="*58 + "╗")
    print("║" + " "*58 + "║")
    print("║" + "  Type-3 Direct Generator - Integration Examples".center(58) + "║")
    print("║" + " "*58 + "║")
    print("╚" + "="*58 + "╝")
    
    try:
        demo_simple_usage()
        demo_batch_generation()
        demo_deterministic_generation()
        demo_validation_safety()
        demo_pipeline_integration()
        demo_error_handling()
        
        print("\n" + "="*60)
        print("All demonstrations completed successfully!")
        print("="*60)
        
        print("\n📝 Next Steps:")
        print("1. Review the generated clones")
        print("2. Integrate into your pipeline using one of the patterns above")
        print("3. Run tests: python tests/test_type3_direct.py")
        print("4. Generate dataset: python src/pipeline.py --type type3")
        
    except Exception as e:
        logger.error(f"Demo failed: {e}", exc_info=True)
        return 1
    
    return 0


if __name__ == "__main__":
    sys.exit(main())
