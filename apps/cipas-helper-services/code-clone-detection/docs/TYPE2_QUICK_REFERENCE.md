# Type-2 Clone Quick Reference

## What is a Type-2 Clone?

Code with **identical structure** but **different identifiers and literals**.

## ✅ Allowed Changes

### Identifiers

- ✅ Variables: `count` → `var_0`
- ✅ Functions: `calculate` → `func_0`
- ✅ Classes: `MyClass` → `Class_0`
- ✅ Parameters: `x, y` → `var_0, var_1`

### Literals

- ✅ Numbers: `42` → `52`, `3.14` → `4.28`
- ✅ Strings: `"hello"` → `"world"`
- ✅ Booleans: `True` → `False`
- ✅ Null: `None` → `None` (usually unchanged)

### Data Types

- ✅ Compatible types: `int` → `long`, `float` → `double`

### Type-1 Changes

- ✅ Whitespace
- ✅ Comments
- ✅ Formatting

## ❌ Must Stay the Same

- ❌ Control flow (loops, if-statements, calls)
- ❌ Sequence of operations
- ❌ Overall structure
- ❌ Keywords (`def`, `if`, `return`, etc.)

## Quick Examples

### Python

```python
# Original
def calculate(x):
    result = x * 2
    return result

# Type-2 Clone
def func_0(var_0):
    var_1 = var_0 * 3
    return var_1
```

### Java

```java
// Original
public int add(int x, int y) {
    return x + y;
}

// Type-2 Clone
public int func_0(int var_0, int var_1) {
    return var_0 + var_1;
}
```

## Usage

```python
from generation.type2 import generate_type2_clone

code = "def foo(x): return x * 2"
clone = generate_type2_clone(code, "python", seed=42)
```

## Verification Checklist

- [ ] Identifiers renamed? ✅
- [ ] Literals changed? ✅
- [ ] Control flow preserved? ✅
- [ ] Structure unchanged? ✅

## See Also

- [TYPE2_CLONE_SPECIFICATION.md](TYPE2_CLONE_SPECIFICATION.md) - Full specification
- [TYPE1_CLONE_RULES.md](TYPE1_CLONE_RULES.md) - Type-1 clones
