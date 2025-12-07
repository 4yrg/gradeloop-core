# Code Clone Detection - Dataset Preparation

This module provides utilities for generating Type-3 code clones for dataset preparation in code clone detection research.

## Overview

The `generators.py` module implements the `generate_type3` function that creates Type-3 code clones using two approaches:

1. **Rule-Based Mutations**: Language-aware transformations including:
   - Converting for loops to while loops
   - Inserting inert statements (assert True, debug comments, etc.)

2. **LLM-Based Mutations**: Using Ollama with the codegemma:7b model for more sophisticated mutations

All mutations are validated using Tree-sitter to ensure syntactic correctness.

## Supported Languages

- Python
- Java
- C
- C++
- Go
- JavaScript
- C# (using C++ parser as fallback)

## Installation

Install the required dependencies:

```bash
pip install tree-sitter tree-sitter-python tree-sitter-java tree-sitter-javascript tree-sitter-cpp tree-sitter-go
```

For LLM-based mutations, also install Ollama:
```bash
# Install Ollama (see https://ollama.ai)
ollama pull codegemma:7b
```

## Usage

### Basic Example

```python
from generators import PolyglotParser, generate_type3

# Create parser instance
parser = PolyglotParser()

# Original code
code = """for i in range(10):
    print(i)"""

# Generate Type-3 clone using rule-based approach
mutated = generate_type3(code, 'python', use_llm=False, parser=parser)
print(mutated)
# Output:
# i = 0
# while i < 10:
#     print(i)
#     i += 1
```

### Using LLM

```python
# Generate Type-3 clone using LLM
mutated_llm = generate_type3(code, 'python', use_llm=True, parser=parser)
```

### Error Handling

The function automatically handles errors and returns the original code if:
- The mutation creates invalid syntax
- The LLM call fails
- Any parsing error occurs

```python
# Invalid code returns original
invalid = "def broken(\n    pass"
result = generate_type3(invalid, 'python', parser=parser)
assert result == invalid  # Original returned
```

## API Reference

### `generate_type3(code: str, lang: str, use_llm: bool = False, parser: PolyglotParser = None) -> str`

Generate a Type-3 code clone with behavior-preserving mutations.

**Parameters:**
- `code` (str): Original source code to mutate
- `lang` (str): Programming language (java, c, cpp, go, python, javascript, c_sharp)
- `use_llm` (bool): If True, use LLM for mutations; if False, use rule-based approach (default: False)
- `parser` (PolyglotParser): Parser instance for validation; created if None (default: None)

**Returns:**
- str: Mutated code if successful and valid, otherwise the original code

### `PolyglotParser`

Multi-language parser using Tree-sitter for syntax validation.

**Methods:**
- `parse(code: str, lang: str) -> Optional[Tree]`: Parse code in the specified language
- `has_syntax_errors(tree: Tree) -> bool`: Check if the parse tree contains syntax errors

## Testing

Run the test suite:

```bash
cd /app/code-clone-detection/dataset-prep/notebooks
python -m pytest test_generators.py -v
```

Run the example script:

```bash
python example_usage.py
```

## Implementation Details

### Rule-Based Mutations

#### For-to-While Loop Conversion

The function converts simple for loops to while loops in a language-aware manner:

- **Python**: `for i in range(n)` → `i = 0; while i < n: ...; i += 1`
- **Java/C/C++**: `for(int i = 0; i < n; i++)` → `int i = 0; while(i < n) ...`
- **Go**: `for i := 0; i < n; i++` → `i := 0; for i < n ...`
- **JavaScript**: `for(let i = 0; i < n; i++)` → `let i = 0; while(i < n) ...`

#### Inert Statement Insertion

Language-specific inert statements are inserted:

- **Python**: `assert True` after function definitions, `pass` after class definitions
- **C-like languages**: `// Type-3 mutation: debug marker` after opening braces

### LLM-Based Mutations

When `use_llm=True`, the function calls Ollama with the prompt:

```
You are a code mutation engine. Create a Type-3 clone: preserve behavior, 
add inert code (e.g., print, assert), or restructure loops. Output ONLY 
the mutated code—no explanations.
```

The response is automatically stripped of markdown code fences and validated.

### Validation

All mutations are validated using Tree-sitter:

1. Parse the mutated code
2. Check for `has_error` flag on root node
3. Recursively check for ERROR nodes in the parse tree
4. Return original code if any errors are detected

## License

This module is part of the GradeLoop Core project.
