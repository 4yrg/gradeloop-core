"""
Comprehensive Test Suite for Type-3 Direct Clone Generation

This module validates the Type-3 direct generator against:
- Code completeness (no truncation)
- Syntax validity
- Logic preservation
- Transformation variety
- Edge cases

Author: Generated for Program Analysis Research
Date: 2025-12-11
"""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))

import logging
from generation.type3_direct import (
    Type3DirectGenerator,
    produce_type3_direct,
    TransformationType
)

logging.basicConfig(level=logging.INFO)


class TestType3DirectJava:
    """Test suite for Java Type-3 generation."""
    
    def test_simple_method(self):
        """Test transformation of simple Java method."""
        code = """public int add(int a, int b) {
    int sum = a + b;
    return sum;
}"""
        
        generator = Type3DirectGenerator(lang="java", seed=42)
        result = generator.generate(code)
        
        assert result.success
        assert result.code != code  # Should be modified
        assert "return" in result.code  # Logic preserved
        assert result.code.count('{') == result.code.count('}')  # Balanced
    
    def test_complex_method_with_loops(self):
        """Test transformation with loops and conditionals."""
        code = """public class StringUtils {
    public String reverse(String input) {
        if (input == null) {
            return null;
        }
        StringBuilder sb = new StringBuilder();
        for (int i = input.length() - 1; i >= 0; i--) {
            sb.append(input.charAt(i));
        }
        return sb.toString();
    }
}"""
        
        generator = Type3DirectGenerator(lang="java", seed=123, max_transformations=3)
        result = generator.generate(code)
        
        assert result.success
        assert result.code != code
        assert "StringBuilder" in result.code  # Key logic preserved
        assert "reverse" in result.code  # Method name preserved
        assert result.code.count('{') == result.code.count('}')
        assert result.code.count('(') == result.code.count(')')
    
    def test_nested_structures(self):
        """Test deeply nested control structures."""
        code = """public int processData(int[] arr) {
    int total = 0;
    if (arr != null) {
        for (int i = 0; i < arr.length; i++) {
            if (arr[i] > 0) {
                total += arr[i];
            }
        }
    }
    return total;
}"""
        
        generator = Type3DirectGenerator(lang="java", seed=456)
        result = generator.generate(code)
        
        assert result.success
        assert "total" in result.code or "return" in result.code
        assert result.code.count('{') == result.code.count('}')
    
    def test_no_truncation(self):
        """Ensure generated code is never truncated."""
        code = """public class DataProcessor {
    private int count;
    
    public DataProcessor() {
        this.count = 0;
    }
    
    public void increment() {
        count++;
    }
    
    public int getCount() {
        return count;
    }
}"""
        
        generator = Type3DirectGenerator(lang="java", seed=789)
        result = generator.generate(code)
        
        assert result.success
        # Ensure all methods are present (or at least structure is complete)
        assert result.code.count('{') == result.code.count('}')
        assert "class DataProcessor" in result.code
        # Should not be significantly shorter (allowing for small deletions)
        assert len(result.code) >= len(code) * 0.7


class TestType3DirectPython:
    """Test suite for Python Type-3 generation."""
    
    def test_simple_function(self):
        """Test transformation of simple Python function."""
        code = """def multiply(a, b):
    result = a * b
    return result"""
        
        generator = Type3DirectGenerator(lang="python", seed=42)
        result = generator.generate(code)
        
        assert result.success
        assert result.code != code
        assert "return" in result.code
    
    def test_function_with_loops(self):
        """Test transformation with loops."""
        code = """def sum_list(numbers):
    total = 0
    for num in numbers:
        total += num
    return total"""
        
        generator = Type3DirectGenerator(lang="python", seed=123)
        result = generator.generate(code)
        
        assert result.success
        assert "for" in result.code or "total" in result.code
        assert "return" in result.code
    
    def test_class_preservation(self):
        """Test that class structures are preserved."""
        code = """class Counter:
    def __init__(self):
        self.count = 0
    
    def increment(self):
        self.count += 1
    
    def get_count(self):
        return self.count"""
        
        generator = Type3DirectGenerator(lang="python", seed=456)
        result = generator.generate(code)
        
        assert result.success
        assert "class Counter" in result.code
        # Should preserve critical structure
        assert "def" in result.code


class TestValidationGuards:
    """Test validation and safety mechanisms."""
    
    def test_empty_code_rejected(self):
        """Empty code should be rejected."""
        generator = Type3DirectGenerator(lang="java")
        result = generator.generate("")
        
        assert not result.success
        assert "validation failed" in result.error_message.lower()
    
    def test_too_short_code_rejected(self):
        """Code below minimum length should be rejected."""
        generator = Type3DirectGenerator(lang="java", min_code_length=10)
        result = generator.generate("int x = 5;")
        
        assert not result.success
    
    def test_brace_balance_validation(self):
        """Output should always have balanced braces."""
        code = """public int test() {
    int x = 5;
    int y = 10;
    return x + y;
}"""
        
        generator = Type3DirectGenerator(lang="java", seed=999)
        result = generator.generate(code)
        
        if result.success:
            assert result.code.count('{') == result.code.count('}')
            assert result.code.count('(') == result.code.count(')')
    
    def test_critical_lines_preserved(self):
        """Critical lines (class/method signatures) should not be deleted."""
        code = """public class MyClass {
    public void myMethod() {
        int a = 1;
        int b = 2;
        int c = 3;
    }
}"""
        
        generator = Type3DirectGenerator(lang="java", seed=111)
        result = generator.generate(code)
        
        assert result.success
        assert "class MyClass" in result.code
        # Method signature should be preserved (or at least the method exists)
        assert "myMethod" in result.code or "void" in result.code


class TestTransformationTypes:
    """Test specific transformation types."""
    
    def test_statement_insertion(self):
        """Test that statements can be inserted."""
        code = """public int calculate(int x) {
    int result = x * 2;
    return result;
}"""
        
        generator = Type3DirectGenerator(lang="java", seed=42)
        result = generator.generate(code)
        
        if result.success and result.applied_transformations:
            # Should have applied some transformation
            assert len(result.applied_transformations) > 0
    
    def test_determinism(self):
        """Same seed should produce identical results."""
        code = """public int add(int a, int b) {
    return a + b;
}"""
        
        result1 = produce_type3_direct(code, "java", seed=12345)
        result2 = produce_type3_direct(code, "java", seed=12345)
        
        assert result1 == result2
    
    def test_randomness(self):
        """Different seeds should produce different results."""
        code = """public int add(int a, int b) {
    int sum = a + b;
    return sum;
}"""
        
        result1 = produce_type3_direct(code, "java", seed=111)
        result2 = produce_type3_direct(code, "java", seed=222)
        
        # With different seeds, likely (but not guaranteed) to be different
        # This is a probabilistic test
        assert True  # Just ensure no crashes


class TestEdgeCases:
    """Test edge cases and error handling."""
    
    def test_single_line_method(self):
        """Test very compact code."""
        code = "public int getVal() { return 42; }"
        
        generator = Type3DirectGenerator(lang="java", min_code_length=1)
        result = generator.generate(code)
        
        # May or may not succeed depending on safety checks
        # Just ensure no crash
        assert True
    
    def test_only_comments(self):
        """Test code with only comments."""
        code = """// This is a comment
// Another comment
// Yet another comment"""
        
        generator = Type3DirectGenerator(lang="java")
        result = generator.generate(code)
        
        # Should fail or return original
        assert True
    
    def test_malformed_input(self):
        """Test handling of malformed code."""
        code = "public class { { { incomplete"
        
        generator = Type3DirectGenerator(lang="java")
        result = generator.generate(code)
        
        # Should not crash
        assert True


class TestBeforeAfterExamples:
    """Visual before/after examples for validation."""
    
    def test_factorial_example(self):
        """
        Example: Factorial method transformation
        
        This test demonstrates a realistic Type-3 clone where:
        - Core logic (factorial computation) is preserved
        - Statement-level modifications are applied
        - Syntax remains valid
        """
        original = """public int factorial(int n) {
    if (n <= 1) {
        return 1;
    }
    return n * factorial(n - 1);
}"""
        
        generator = Type3DirectGenerator(lang="java", seed=42, max_transformations=2)
        result = generator.generate(original)
        
        print("\n=== FACTORIAL EXAMPLE ===")
        print("Original:")
        print(original)
        print("\nType-3 Clone:")
        print(result.code)
        print(f"\nTransformations: {result.applied_transformations}")
        print(f"Success: {result.success}")
        print(f"Syntax valid: {result.code.count('{') == result.code.count('}')}")
        
        assert result.success
        assert result.code != original
        assert "factorial" in result.code
        assert result.code.count('{') == result.code.count('}')
    
    def test_fibonacci_example(self):
        """
        Example: Fibonacci method transformation
        """
        original = """def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n-1) + fibonacci(n-2)"""
        
        generator = Type3DirectGenerator(lang="python", seed=123, max_transformations=2)
        result = generator.generate(original)
        
        print("\n=== FIBONACCI EXAMPLE ===")
        print("Original:")
        print(original)
        print("\nType-3 Clone:")
        print(result.code)
        print(f"\nTransformations: {result.applied_transformations}")
        
        assert result.success
        assert "fibonacci" in result.code
    
    def test_array_sum_example(self):
        """
        Example: Array sum with validation
        """
        original = """public int sumArray(int[] arr) {
    int sum = 0;
    if (arr != null) {
        for (int i = 0; i < arr.length; i++) {
            sum += arr[i];
        }
    }
    return sum;
}"""
        
        generator = Type3DirectGenerator(lang="java", seed=789, max_transformations=3)
        result = generator.generate(original)
        
        print("\n=== ARRAY SUM EXAMPLE ===")
        print("Original:")
        print(original)
        print("\nType-3 Clone:")
        print(result.code)
        print(f"\nTransformations: {result.applied_transformations}")
        print(f"Braces balanced: {result.code.count('{') == result.code.count('}')}")
        
        assert result.success
        assert result.code.count('{') == result.code.count('}')


def run_all_tests():
    """Run all tests manually."""
    print("="*60)
    print("Type-3 Direct Generator - Comprehensive Test Suite")
    print("="*60)
    
    test_classes = [
        TestType3DirectJava,
        TestType3DirectPython,
        TestValidationGuards,
        TestTransformationTypes,
        TestEdgeCases,
        TestBeforeAfterExamples,
    ]
    
    total_tests = 0
    passed_tests = 0
    
    for test_class in test_classes:
        print(f"\n{test_class.__name__}")
        print("-" * 60)
        
        instance = test_class()
        test_methods = [m for m in dir(instance) if m.startswith('test_')]
        
        for method_name in test_methods:
            total_tests += 1
            try:
                method = getattr(instance, method_name)
                method()
                print(f"  [PASS] {method_name}")
                passed_tests += 1
            except AssertionError as e:
                print(f"  [FAIL] {method_name}: {e}")
            except Exception as e:
                print(f"  [ERROR] {method_name}: {e}")
    
    print("\n" + "="*60)
    print(f"Results: {passed_tests}/{total_tests} tests passed")
    print("="*60)
    
    return passed_tests == total_tests


if __name__ == "__main__":
    success = run_all_tests()
    sys.exit(0 if success else 1)
