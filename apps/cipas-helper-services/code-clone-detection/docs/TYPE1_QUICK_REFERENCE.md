# Type-1 Clone Generation - Quick Reference

## What is a Type-1 Clone?

A Type-1 clone is an **exact copy** of code where **only** whitespace, comments, and formatting differ. All code tokens must be identical.

## Quick Rules

### ✅ Can Change (Type-1 Allowed)

| What             | Example                                     |
| ---------------- | ------------------------------------------- |
| Indentation      | `    x = 1` → `\tx = 1` (spaces to tabs)    |
| Blank lines      | Add or remove empty lines                   |
| Comments         | Add, remove, or modify comments             |
| Operator spacing | `x = 1 + 2` → `x=1+2` (preserve operators!) |
| Brace position   | `if (x) {` → `if (x)\n{`                    |
| Line breaks      | `foo(a, b)` → `foo(\n    a, b)`             |

### ❌ Cannot Change (Becomes Type-2+)

| What             | Example                            |
| ---------------- | ---------------------------------- |
| Variable names   | `x = 1` → `y = 1` ❌               |
| Function names   | `def foo()` → `def bar()` ❌       |
| Literals         | `x = 42` → `x = 43` ❌             |
| Types            | `x: int` → `x: float` ❌           |
| Statement order  | `x = 1; y = 2` → `y = 2; x = 1` ❌ |
| Add/remove code  | Adding `print(x)` ❌               |
| Change operators | `a + b` → `a - b` ❌               |

## Usage

### Generate a Type-1 Variant

```python
from src.generation.type1 import produce_type1_variant

original = """def calculate(a, b):
    result = a + b * 2
    return result"""

variant = produce_type1_variant(original, "python")
print(variant)
```

### Validate Type-1 Compliance

```python
from src.generation.type1 import validate_type1_clone

validation = validate_type1_clone(original, variant, "python")

if validation['is_valid']:
    print("✓ Valid Type-1 clone")
else:
    print(f"✗ Invalid: {validation['message']}")
    print(f"Differences: {validation['differences']}")
```

### Generate Multiple Variants

```python
from src.generation.type1 import generate_multiple_type1_variants

variants = generate_multiple_type1_variants(original, "python", count=5)

for i, variant in enumerate(variants, 1):
    print(f"Variant {i}:")
    print(variant)
    print()
```

## Transformations Applied

The `produce_type1_variant()` function applies these transformations in order:

1. **Indentation changes** - Spaces ↔ tabs, indent size (2 vs 4)
2. **Blank line modifications** - Add or remove empty lines
3. **Comment modifications** - Add, remove, or change comments
4. **Operator spacing** - Compact (`x=1+2`) vs spaced (`x = 1 + 2`)
5. **Brace positions** - Same line vs next line (Java/C-style)

All transformations preserve code tokens!

## Common Mistakes to Avoid

### ❌ Mistake 1: Removing Operators

```python
# BAD: This can remove operators
code = re.sub(r'\s*=\s*', '', code)  # Removes =

# GOOD: Only remove spaces, keep operator
code = re.sub(r'\s*=\s*', '=', code)  # Keeps =
```

### ❌ Mistake 2: Breaking Compound Operators

```python
# BAD: Breaks == into = =
code = re.sub(r'=', ' = ', code)  # == becomes = = =

# GOOD: Check for compound operators
code = re.sub(r'(?<![=!<>])=(?!=)', r' = ', code)  # Only single =
```

### ❌ Mistake 3: Not Validating

```python
# BAD: Generate without validation
variant = some_transform(code)

# GOOD: Always validate
variant = produce_type1_variant(code, "python")
validation = validate_type1_clone(code, variant, "python")
assert validation['is_valid']
```

## Examples

### Python Example

```python
# Original
def sum_numbers(nums):
    total = 0
    for n in nums:
        total = total + n
    return total

# Valid Type-1 Variant
def sum_numbers(nums):
	total=0  # Initialize
	for n in nums:
		total=total+n
	return total
```

**Why valid:** Only whitespace and comments changed, all tokens preserved.

### Java Example

```java
// Original
public int add(int a, int b) {
    return a + b;
}

// Valid Type-1 Variant
public int add(int a, int b)
{
    return a+b;  // Sum
}
```

**Why valid:** Brace position, spacing, and comment changed, all tokens preserved.

### Invalid Example (Type-2)

```python
# Original
def calculate(x):
    return x * 2

# NOT Type-1 (variable renamed)
def calculate(y):  # ❌ 'x' changed to 'y'
    return y * 2
```

**Why invalid:** Variable name changed (`x` → `y`), this is Type-2.

## Validation Output

```python
{
    'is_valid': True,
    'token_match': True,
    'differences': [],
    'message': 'Valid Type-1 clone',
    'original_token_count': 15,
    'variant_token_count': 15
}
```

## API Reference

### Main Functions

- `produce_type1_variant(code, lang)` - Generate a Type-1 variant
- `validate_type1_clone(original, variant, lang)` - Validate Type-1 compliance
- `generate_multiple_type1_variants(code, lang, count)` - Generate multiple variants

### Supported Languages

- `python` - Python
- `java` - Java
- `javascript` - JavaScript
- `cpp` - C++
- `c` - C

## Documentation

- **Detailed Rules:** [TYPE1_CLONE_RULES.md](TYPE1_CLONE_RULES.md)
- **Implementation:** [TYPE1_IMPLEMENTATION_SUMMARY.md](TYPE1_IMPLEMENTATION_SUMMARY.md)
- **Main README:** [../README.md](../README.md)

## Key Takeaway

**Type-1 Clone = Same Tokens + Different Whitespace/Comments/Formatting**

When in doubt, run validation:

```python
validation = validate_type1_clone(original, variant, "python")
assert validation['is_valid'], validation['message']
```
