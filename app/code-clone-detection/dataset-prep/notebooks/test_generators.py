"""
Tests for code mutation generators.
"""

import pytest
from generators import (
    PolyglotParser,
    generate_type3,
    _strip_markdown_fences,
    _convert_for_to_while_python,
    _convert_for_to_while_java,
    _convert_for_to_while_c_cpp,
    _convert_for_to_while_go,
    _convert_for_to_while_javascript,
    _insert_inert_statements_python,
    _insert_inert_statements_c_like,
)


class TestPolyglotParser:
    """Tests for PolyglotParser class."""
    
    def test_parser_initialization(self):
        """Test that parser initializes correctly."""
        parser = PolyglotParser()
        assert parser is not None
        assert 'python' in parser.parsers
        
    def test_parse_valid_python(self):
        """Test parsing valid Python code."""
        parser = PolyglotParser()
        code = "def hello():\n    print('world')"
        tree = parser.parse(code, 'python')
        assert tree is not None
        assert not parser.has_syntax_errors(tree)
    
    def test_parse_invalid_python(self):
        """Test parsing invalid Python code."""
        parser = PolyglotParser()
        code = "def hello(\n    print('world')"  # Missing closing parenthesis
        tree = parser.parse(code, 'python')
        assert tree is not None
        assert parser.has_syntax_errors(tree)
    
    def test_parse_valid_java(self):
        """Test parsing valid Java code."""
        parser = PolyglotParser()
        code = "public class Test { public static void main(String[] args) {} }"
        tree = parser.parse(code, 'java')
        assert tree is not None
        assert not parser.has_syntax_errors(tree)
    
    def test_parse_unsupported_language(self):
        """Test parsing unsupported language."""
        parser = PolyglotParser()
        code = "some code"
        tree = parser.parse(code, 'unsupported')
        assert tree is None


class TestStripMarkdownFences:
    """Tests for markdown fence stripping."""
    
    def test_strip_python_fence(self):
        """Test stripping Python markdown fences."""
        text = "```python\nprint('hello')\n```"
        result = _strip_markdown_fences(text)
        assert result == "print('hello')"
    
    def test_strip_generic_fence(self):
        """Test stripping generic markdown fences."""
        text = "```\nsome code\n```"
        result = _strip_markdown_fences(text)
        assert result == "some code"
    
    def test_strip_no_fence(self):
        """Test text without fences."""
        text = "plain code"
        result = _strip_markdown_fences(text)
        assert result == "plain code"


class TestForToWhileConversion:
    """Tests for for-to-while loop conversion."""
    
    def test_python_for_to_while(self):
        """Test Python for loop conversion."""
        code = "for i in range(10):\n    print(i)"
        result = _convert_for_to_while_python(code)
        assert "i = 0" in result
        assert "while i < 10:" in result
        assert "i += 1" in result
    
    def test_python_no_conversion(self):
        """Test Python code without for loops."""
        code = "x = 5\nprint(x)"
        result = _convert_for_to_while_python(code)
        assert result == code
    
    def test_java_for_to_while(self):
        """Test Java for loop conversion."""
        code = "for(int i = 0; i < n; i++) { sum += i; }"
        result = _convert_for_to_while_java(code)
        assert "int i = 0;" in result
        assert "while (i < n)" in result
    
    def test_cpp_for_to_while(self):
        """Test C++ for loop conversion."""
        code = "for(int i = 0; i < n; i++) { sum += i; }"
        result = _convert_for_to_while_c_cpp(code)
        assert "int i = 0;" in result
        assert "while (i < n)" in result
    
    def test_go_for_to_while(self):
        """Test Go for loop conversion."""
        code = "for i := 0; i < n; i++ { sum += i }"
        result = _convert_for_to_while_go(code)
        assert "i := 0" in result
        assert "for i < n" in result
    
    def test_javascript_for_to_while(self):
        """Test JavaScript for loop conversion."""
        code = "for(let i = 0; i < n; i++) { sum += i; }"
        result = _convert_for_to_while_javascript(code)
        assert "let i = 0;" in result
        assert "while (i < n)" in result


class TestInertStatements:
    """Tests for inert statement insertion."""
    
    def test_python_inert_after_def(self):
        """Test inserting inert statements after Python function definitions."""
        code = "def hello():\n    return 1"
        result = _insert_inert_statements_python(code)
        assert "assert True" in result
    
    def test_python_inert_after_class(self):
        """Test inserting inert statements after Python class definitions."""
        code = "class Test:\n    x = 1"
        result = _insert_inert_statements_python(code)
        assert "pass" in result
    
    def test_c_like_inert_statements(self):
        """Test inserting inert statements in C-like languages."""
        code = "void main() {\n    int x = 5;\n}"
        result = _insert_inert_statements_c_like(code, '//')
        assert "// Type-3 mutation" in result


class TestGenerateType3:
    """Tests for generate_type3 function."""
    
    def test_rule_based_python(self):
        """Test rule-based mutation for Python."""
        parser = PolyglotParser()
        code = "for i in range(5):\n    print(i)"
        result = generate_type3(code, 'python', use_llm=False, parser=parser)
        assert result != code  # Should be mutated
        assert "while" in result or "assert" in result
    
    def test_rule_based_java(self):
        """Test rule-based mutation for Java."""
        parser = PolyglotParser()
        code = "public class Test { void method() { for(int i = 0; i < 10; i++) {} } }"
        result = generate_type3(code, 'java', use_llm=False, parser=parser)
        # Mutation should occur or return original if pattern doesn't match
        assert result is not None
    
    def test_unsupported_language(self):
        """Test with unsupported language returns original."""
        parser = PolyglotParser()
        code = "some code"
        result = generate_type3(code, 'rust', use_llm=False, parser=parser)
        assert result == code
    
    def test_empty_code(self):
        """Test with empty code returns empty."""
        parser = PolyglotParser()
        result = generate_type3('', 'python', use_llm=False, parser=parser)
        assert result == ''
    
    def test_parser_creation(self):
        """Test that parser is created if not provided."""
        code = "x = 5"
        result = generate_type3(code, 'python', use_llm=False, parser=None)
        assert result is not None
    
    def test_invalid_mutation_returns_original(self):
        """Test that invalid mutations return original code."""
        parser = PolyglotParser()
        code = "def valid():\n    return 1"
        # Even if mutation creates invalid syntax, should return original
        result = generate_type3(code, 'python', use_llm=False, parser=parser)
        # Should be valid Python
        tree = parser.parse(result, 'python')
        assert not parser.has_syntax_errors(tree)
    
    def test_all_supported_languages(self):
        """Test that all supported languages can be processed."""
        parser = PolyglotParser()
        languages = ['java', 'c', 'cpp', 'go', 'python', 'javascript', 'c_sharp']
        
        for lang in languages:
            code = "x = 1"  # Simple code
            result = generate_type3(code, lang, use_llm=False, parser=parser)
            assert result is not None


class TestValidation:
    """Tests for validation logic."""
    
    def test_validation_catches_syntax_errors(self):
        """Test that validation catches syntax errors."""
        parser = PolyglotParser()
        invalid_code = "def broken(\n    pass"
        
        # Direct parsing should detect error
        tree = parser.parse(invalid_code, 'python')
        assert parser.has_syntax_errors(tree)
    
    def test_validation_accepts_valid_code(self):
        """Test that validation accepts valid code."""
        parser = PolyglotParser()
        valid_code = "def hello():\n    pass"
        
        tree = parser.parse(valid_code, 'python')
        assert not parser.has_syntax_errors(tree)


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
