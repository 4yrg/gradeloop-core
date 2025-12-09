# Type-1 Clone Generation Rules

## Overview

Type-1 clones are **exact copies** of code with modifications **ONLY** to:

- Whitespace (spaces, tabs, newlines, indentation)
- Comments (adding, removing, modifying)
- Formatting (line breaks, brace positions, text layout)

## Critical Principle

**Type-1 clones MUST preserve ALL code tokens exactly.**

No variable renaming, no literal changes, no type changes, no statement reordering, no code additions or deletions.

## ✅ Allowed Changes (Still Type-1)

### 1. Whitespace Changes

#### Indentation

```python
# Original
def foo():
    x = 1
    return x

# Type-1 Variant (spaces to tabs)
def foo():
	x = 1
	return x

# Type-1 Variant (2 spaces to 4 spaces)
def foo():
  x = 1
  return x
```

#### Blank Lines

```python
# Original
def foo():
    x = 1
    return x

# Type-1 Variant (added blank lines)
def foo():

    x = 1

    return x

# Type-1 Variant (removed blank lines - if original had multiple)
def foo():
    x = 1
    return x
```

#### Spacing Around Operators

```python
# Original
x = 1 + 2

# Type-1 Variant (compact spacing)
x=1+2

# Type-1 Variant (extra spacing)
x = 1  +  2
```

**CRITICAL:** All operators (=, +, -, \*, /, etc.) must be preserved!

### 2. Comment Changes

#### Adding Comments

```python
# Original
def foo():
    x = 1
    return x

# Type-1 Variant (comments added)
def foo():  # Modified function
    x = 1  # Changed
    return x  # TODO: Review
```

#### Removing Comments

```python
# Original
def foo():  # This is a function
    x = 1  # Initialize x
    return x

# Type-1 Variant (comments removed)
def foo():
    x = 1
    return x
```

#### Modifying Comments

```python
# Original
def foo():  # Calculate result
    return 42

# Type-1 Variant (comment text changed)
def foo():  # Return value
    return 42
```

### 3. Formatting Changes

#### Line Breaks

```python
# Original
result = some_function(arg1, arg2, arg3)

# Type-1 Variant (wrapped lines)
result = some_function(
    arg1, arg2, arg3)

# Type-1 Variant (different wrapping)
result = some_function(arg1,
                       arg2,
                       arg3)
```

#### Brace Positions (Java/C-style languages)

```java
// Original
if (x) {
    return y;
}

// Type-1 Variant (brace on next line)
if (x)
{
    return y;
}

// Type-1 Variant (compact)
if (x) { return y; }
```

#### Spacing Around Parentheses

```python
# Original
result = foo(x, y)

# Type-1 Variant (spacing added)
result = foo( x, y )

# Type-1 Variant (no spacing)
result=foo(x,y)
```

## ❌ Prohibited Changes (Become Type-2 or Higher)

### 1. Renaming Identifiers

```python
# Original
def foo():
    x = 1
    return x

# ❌ NOT Type-1 (variable renamed - This is Type-2)
def foo():
    y = 1  # Changed 'x' to 'y'
    return y
```

### 2. Changing Literals

```python
# Original
x = 42

# ❌ NOT Type-1 (literal value changed - Type-2 or Type-3)
x = 43

# Original
name = "Alice"

# ❌ NOT Type-1 (string changed - Type-2 or Type-3)
name = "Bob"
```

### 3. Changing Types

```python
# Original
x: int = 42

# ❌ NOT Type-1 (type annotation changed - Type-2)
x: float = 42
```

### 4. Reordering Statements

```python
# Original
x = 1
y = 2

# ❌ NOT Type-1 (statement order changed - Type-3 or Type-4)
y = 2
x = 1
```

### 5. Adding/Removing Code Statements

```python
# Original
def foo():
    x = 1
    return x

# ❌ NOT Type-1 (added new statement - Type-3 or Type-4)
def foo():
    x = 1
    print(x)  # Added line
    return x

# ❌ NOT Type-1 (removed statement - Type-3 or Type-4)
def foo():
    return x  # Removed 'x = 1'
```

### 6. Modifying Operators

```python
# Original
x = a + b

# ❌ NOT Type-1 (operator changed - Type-2 or Type-3)
x = a - b

# ❌ NOT Type-1 (operator removed - breaks code)
x = a b
```

## Implementation Guidelines

### 1. Token Preservation

All transformations must preserve the **exact sequence of code tokens**:

```python
def calculate(a, b):
    result = a + b * 2
    return result
```

**Tokens:** `def`, `calculate`, `(`, `a`, `,`, `b`, `)`, `:`, `result`, `=`, `a`, `+`, `b`, `*`, `2`, `return`, `result`

After any Type-1 transformation, extracting tokens should yield the **exact same list**.

### 2. Validation

Use the `validate_type1_clone()` function to ensure compliance:

```python
from src.generation.type1 import validate_type1_clone

original = "def foo():\n    x = 1\n    return x"
variant = "def foo():\n\tx=1\n\treturn x"

validation = validate_type1_clone(original, variant, "python")
print(validation['is_valid'])  # Should be True
print(validation['message'])    # "Valid Type-1 clone"
```

### 3. Safe Transformations

When implementing new transformations, always:

1. **Use regex carefully** - Don't accidentally remove/change tokens
2. **Test with validation** - Verify tokens are preserved
3. **Consider edge cases** - Compound operators (==, !=, <=, >=, &&, ||)
4. **Preserve semantics** - Code must behave identically

## Examples of Complete Transformations

### Python Example

```python
# Original
def calculate_sum(numbers):
    """Calculate the sum of numbers."""
    total = 0
    for num in numbers:
        total = total + num
    return total

# Type-1 Variant (valid - whitespace and comments only)
def calculate_sum(numbers):
	# Sum calculation
	total=0  # Initialize
	for num in numbers:
		total=total+num
	return total
```

**Validation:** All tokens preserved ✓

### Java Example

```java
// Original
public int add(int a, int b) {
    // Add two numbers
    int result = a + b;
    return result;
}

// Type-1 Variant (valid - formatting and comments)
public int add(int a, int b)
{
    int result=a+b;  // Modified
    return result;
}
```

**Validation:** All tokens preserved ✓

## Common Pitfalls

### ❌ Pitfall 1: Regex Too Aggressive

```python
# BAD: This removes operators!
code = re.sub(r'\s*([+\-*/%=<>!&|])\s*', r'\1', code)
# Problem: Could match and remove parts of compound operators

# GOOD: Preserve compound operators
code = re.sub(r'\s*(\+)\s*', r'\1', code)  # Only handle single +
```

### ❌ Pitfall 2: Removing Too Much

```python
# BAD: This could remove string contents!
code = re.sub(r'#.*', '', code)  # Removes everything after #

# GOOD: Only remove comments, not # in strings
code = re.sub(r'#.*$', '', code, flags=re.MULTILINE)
```

### ❌ Pitfall 3: Not Testing Edge Cases

```python
# Test with compound operators
code = "if (x == 5 && y != 3)"
variant = transform(code)
assert validate_type1_clone(code, variant, "java")['is_valid']
```

## Summary

**Type-1 Clone = Same Tokens, Different Whitespace/Comments/Formatting**

- ✅ Change: Indentation, blank lines, spacing, comments, brace positions
- ❌ Don't change: Variables, literals, types, statement order, operators, code structure

When in doubt, use `validate_type1_clone()` to verify your transformation preserves all tokens.
