# Type-2 Clone Implementation Summary

## Overview

This document summarizes the implementation of Type-2 code clone generation, which produces syntactically identical code with renamed identifiers and changed literal values.

## Implementation Date

December 9, 2025

## Features Implemented

### 1. Identifier Renaming (`alpha_rename`)

**What it does:**

- Extracts all user-defined identifiers from code
- Categorizes identifiers into: Classes, Constants, Functions, Variables
- Generates deterministic rename mappings
- Applies renaming while preserving keywords and strings

**Categories:**

- `Class_N` - Classes (start with uppercase)
- `CONST_N` - Constants (ALL_CAPS with underscores)
- `func_N` - Functions (contain common verbs like get, set, calculate, etc.)
- `var_N` - Variables (default category)

**Key Functions:**

- `alpha_rename(code, lang, seed)` - Main renaming function
- `_extract_identifiers(code, lang)` - Find all renameable identifiers
- `_create_rename_mapping(identifiers, seed)` - Create categorized mappings
- `_apply_renaming(code, rename_map, lang)` - Apply changes safely

### 2. Literal Value Changing (`change_literals`)

**What it does:**

- Detects all literals in code (numbers, strings, booleans, null)
- Generates alternative values deterministically
- Preserves quote styles and formatting
- Handles multiple numeric formats (hex, binary, octal, scientific)

**Supported Literal Types:**

- **Numbers**: integers, floats, hex (0x), binary (0b), octal (0o), scientific (1e10)
- **Strings**: single/double/triple quotes, f-strings
- **Booleans**: True/False (Python), true/false (Java)
- **Null**: None (Python), null (Java)

**Key Functions:**

- `change_literals(code, lang, seed, change_probability)` - Main literal changing function
- `_extract_literals(code, lang)` - Find all literals with positions
- `_change_literal_value(literal, lang, seed)` - Generate alternative value

### 3. Complete Type-2 Generation (`generate_type2_clone`)

**What it does:**

- Combines identifier renaming and literal changing
- Provides configurable transformations
- Returns fully transformed Type-2 clone

**Parameters:**

- `code` - Original source code
- `lang` - Language ("python" or "java")
- `seed` - Random seed for deterministic output
- `rename_identifiers` - Enable/disable identifier renaming (default: True)
- `change_literal_values` - Enable/disable literal changes (default: True)
- `literal_change_prob` - Probability of changing each literal (default: 0.5)

### 4. Statistics and Batch Operations

**Statistics Functions:**

- `alpha_rename_with_stats()` - Returns rename mapping and categories
- `generate_type2_clone_with_stats()` - Full transformation with detailed stats

**Batch Functions:**

- `batch_alpha_rename()` - Process multiple code snippets for renaming
- `batch_generate_type2()` - Generate Type-2 clones for multiple snippets

## Key Technical Details

### String Protection

The implementation protects string literals from identifier renaming to prevent breaking code:

```python
# ❌ Without protection
code = 'print("hello world")'
# Could incorrectly rename "print" inside the string

# ✅ With protection
_extract_string_ranges(code, lang)  # Finds all string positions
_is_within_string(pos, string_ranges)  # Checks before renaming
```

### Deterministic Generation

All transformations use seeded random number generators:

```python
seed = _generate_seed_from_code(code)  # Hash-based seed
rng = random.Random(seed)  # Seeded RNG
```

This ensures:

- Same input + same seed = same output
- Reproducible for testing and debugging
- Different seeds create variety

### Language Support

Currently supports:

- **Python**: Full support for Python 3 syntax
- **Java**: Full support for Java syntax

Extensible to other languages by adding:

1. Language-specific keywords in keyword sets
2. String literal patterns in `_extract_string_ranges()`
3. Literal format patterns in `_extract_literals()`

## Files Modified/Created

### Modified Files

1. **`src/generation/type2.py`** - Main implementation

   - Added `change_literals()` function
   - Added `generate_type2_clone()` function
   - Enhanced `_create_rename_mapping()` with categorization
   - Added `_extract_literals()` and `_change_literal_value()`
   - Updated statistics functions
   - Added comprehensive tests

2. **`configs/clones_config.yaml`** - Configuration
   - Updated Type-2 transformation list
   - Added detailed comments about allowed changes
   - Documented what must stay the same

### Created Files

1. **`docs/TYPE2_CLONE_SPECIFICATION.md`** - Complete specification

   - Detailed explanation of Type-2 clones
   - Examples for all transformation types
   - Verification checklist
   - Implementation guide

2. **`docs/TYPE2_QUICK_REFERENCE.md`** - Quick reference

   - One-page summary
   - Quick examples
   - Usage snippets

3. **`docs/TYPE2_IMPLEMENTATION_SUMMARY.md`** - This file
   - Implementation overview
   - Technical details
   - File structure

## Testing

### Test Coverage

All features have comprehensive tests:

✅ `test_alpha_rename_python()` - Python identifier renaming
✅ `test_alpha_rename_java()` - Java identifier renaming
✅ `test_alpha_rename_deterministic()` - Deterministic output
✅ `test_extract_identifiers_python()` - Python identifier extraction
✅ `test_extract_identifiers_java()` - Java identifier extraction
✅ `test_create_rename_mapping()` - Categorized rename mapping
✅ `test_apply_renaming()` - Safe renaming application
✅ `test_extract_literals()` - Literal detection
✅ `test_change_literals()` - Literal transformation
✅ `test_generate_type2_clone()` - Complete Type-2 generation
✅ `test_alpha_rename_with_stats()` - Statistics generation
✅ `test_batch_alpha_rename()` - Batch processing
✅ `test_batch_generate_type2()` - Batch Type-2 generation
✅ `test_empty_code()` - Edge case handling

### Running Tests

```bash
cd apps/cipas-helper-services/code-clone-detection
python src/generation/type2.py
```

All tests pass with detailed examples showing the transformations.

## Usage Examples

### Basic Usage

```python
from generation.type2 import generate_type2_clone

code = """
def calculate_sum(numbers):
    total = 0
    for num in numbers:
        total += num
    return total
"""

clone = generate_type2_clone(code, "python", seed=42)
```

### With Statistics

```python
from generation.type2 import generate_type2_clone_with_stats

stats = generate_type2_clone_with_stats(code, "python", seed=42)

print(f"Identifiers renamed: {stats['identifiers_renamed']}")
print(f"Literals changed: {stats['literals_changed']}")
print(f"Categories: {stats['categories']}")
```

### Selective Transformations

```python
# Only rename identifiers
clone = generate_type2_clone(
    code, "python", seed=42,
    rename_identifiers=True,
    change_literal_values=False
)

# Only change literals
clone = generate_type2_clone(
    code, "python", seed=42,
    rename_identifiers=False,
    change_literal_values=True
)
```

### Batch Processing

```python
from generation.type2 import batch_generate_type2

codes = [
    "def foo(x): return x * 2",
    "def bar(y): return y + 1",
    "def baz(z): return z / 2"
]

clones = batch_generate_type2(codes, "python", seed=42)
```

## Integration with Pipeline

The Type-2 generator integrates with the clone detection pipeline through:

1. **Configuration** - `configs/clones_config.yaml` defines Type-2 transformations
2. **Generation** - Pipeline calls Type-2 functions to create clone pairs
3. **Validation** - Generated clones are validated for correctness
4. **Export** - Type-2 clone pairs are exported to datasets

## Performance Considerations

### Time Complexity

- Identifier extraction: O(n) where n = code length
- Literal extraction: O(n)
- Renaming application: O(m × n) where m = number of identifiers
- Overall: O(n) for typical code

### Optimization Techniques

1. **String range caching** - Extract once, reuse for all checks
2. **Sorted replacement** - Longest identifiers first to avoid partial matches
3. **Reverse order literal changes** - Change from end to start to preserve positions

### Memory Usage

- Minimal memory footprint
- Stores only identifier sets and rename mappings
- No AST parsing required (regex-based)

## Future Enhancements

Potential improvements:

1. **AST-based renaming** - More accurate than regex
2. **Context-aware categorization** - Use AST to better identify functions vs variables
3. **Type system awareness** - Better data type substitution
4. **Language support** - Add C++, JavaScript, Go, etc.
5. **Semantic preservation** - Verify that changes don't affect semantics
6. **Template support** - Custom identifier naming schemes

## References

- Type-2 clone definition: Roy & Cordy (2007)
- Implementation approach: Regex-based transformation
- Testing methodology: Property-based testing with examples

## Contributors

- Implementation: AI Assistant
- Date: December 9, 2025
- Version: 1.0.0

## License

Same as project license (see root LICENSE file)
