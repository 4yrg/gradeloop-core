# Type-2 Code Clone Specification

## Overview

**Type-2 Code Clones** (also known as **Renamed Clones** or **Syntactic Clones**) are code fragments that have the same structure and logic but allow specific differences in identifiers and literal values.

## ✅ Allowed Changes (Still Type-2)

### 1. Renaming Identifiers

Type-2 clones can rename any user-defined identifiers while preserving language keywords and built-in constructs.

#### Variables

```python
# Original
count = 0
for item in items:
    count += 1

# Type-2 Clone (variables renamed)
var_0 = 0
for var_1 in var_2:
    var_0 += 1
```

#### Functions

```python
# Original
def calculate_sum(numbers):
    return sum(numbers)

# Type-2 Clone (function renamed)
def func_0(var_0):
    return sum(var_0)
```

#### Classes

```python
# Original
class DataProcessor:
    def process(self, data):
        return data

# Type-2 Clone (class renamed)
class Class_0:
    def func_0(self, var_0):
        return var_0
```

#### Parameters

```python
# Original
def add(x, y):
    return x + y

# Type-2 Clone (parameters renamed)
def func_0(var_0, var_1):
    return var_0 + var_1
```

### 2. Changing Literals

Type-2 clones allow changing literal values while maintaining the same types and structure.

#### Numbers

```python
# Original
MAX_SIZE = 100
result = value * 2 + 10

# Type-2 Clone (numbers changed)
CONST_0 = 110
var_0 = var_1 * 3 + 15
```

Supported numeric formats:

- Integers: `42` → `52`
- Floats: `3.14` → `4.28`
- Hexadecimal: `0x1A` → `0x24`
- Binary: `0b1010` → `0b1111`
- Octal: `0o755` → `0o644`
- Scientific: `1.5e10` → `2.3e10`

#### Strings

```python
# Original
message = "Processing data"
filename = 'output.txt'

# Type-2 Clone (strings changed)
var_0 = "Processing info"
var_1 = 'result.txt'
```

#### Booleans

```python
# Original
is_valid = True
is_complete = False

# Type-2 Clone (booleans changed)
var_0 = False
var_1 = True
```

#### Null Values

```python
# Original (Python)
result = None

# Type-2 Clone
var_0 = None  # Typically kept as-is

# Original (Java)
Object result = null;

# Type-2 Clone
Object var_0 = null;  # Typically kept as-is
```

### 3. Changing Data Types

Type-2 clones can change data types as long as the control structure and operations remain the same.

```java
// Original
int count = 0;
float average = 3.14f;

// Type-2 Clone
long var_0 = 0;
double var_1 = 4.28;
```

**Important**: The control flow must remain identical. Type changes should be compatible (e.g., `int` → `long`, `float` → `double`).

### 4. Any Type-1 Changes

All Type-1 changes are also allowed in Type-2 clones:

#### Whitespace

```python
# Original
def foo(x):
    return x*2

# Type-2 Clone (with whitespace changes)
def func_0(var_0):
    return    var_0    *    2
```

#### Formatting

```python
# Original
result = calculate(x, y, z)

# Type-2 Clone (formatted differently)
var_0 = func_0(
    var_1,
    var_2,
    var_3
)
```

#### Comments

```python
# Original
# Calculate the sum
total = a + b

# Type-2 Clone
# Compute the total
var_0 = var_1 + var_2
```

## ❗ What Must Stay the Same

Type-2 clones must preserve the following:

### 1. Control Flow

The sequence of control structures must remain identical:

```python
# ✅ Valid Type-2 (same control flow)
# Original
if x > 0:
    result = x * 2
else:
    result = 0

# Type-2 Clone
if var_0 > 5:
    var_1 = var_0 * 3
else:
    var_1 = 10

# ❌ NOT Type-2 (different control flow)
if var_0 > 5:
    var_1 = var_0 * 3
# Missing else clause - this is Type-3!
```

### 2. Sequence of Operations

The order of statements must be preserved:

```python
# ✅ Valid Type-2 (same sequence)
# Original
x = 10
y = x * 2
z = y + 5

# Type-2 Clone
var_0 = 15
var_1 = var_0 * 3
var_2 = var_1 + 10

# ❌ NOT Type-2 (different sequence)
var_1 = var_0 * 3  # Reordered
var_0 = 15
var_2 = var_1 + 10
```

### 3. Overall Code Structure

The high-level structure (functions, classes, loops) must remain the same:

```python
# ✅ Valid Type-2 (same structure)
# Original
for i in range(10):
    print(i)

# Type-2 Clone
for var_0 in range(15):
    print(var_0)

# ❌ NOT Type-2 (different structure)
var_0 = 0
while var_0 < 15:  # Changed loop type
    print(var_0)
    var_0 += 1
```

## Implementation

### Using the Type-2 Generator

```python
from generation.type2 import generate_type2_clone

# Original code
code = """
def calculate_sum(numbers):
    total = 0
    for num in numbers:
        total += num
    return total
"""

# Generate Type-2 clone
clone = generate_type2_clone(
    code=code,
    lang="python",
    seed=42,
    rename_identifiers=True,      # Enable identifier renaming
    change_literal_values=True,    # Enable literal changes
    literal_change_prob=0.5        # Change 50% of literals
)

print(clone)
```

### Individual Transformations

```python
from generation.type2 import alpha_rename, change_literals

# Just rename identifiers
renamed = alpha_rename(code, "python", seed=42)

# Just change literals
literals_changed = change_literals(code, "python", seed=42, change_probability=0.8)
```

### With Statistics

```python
from generation.type2 import generate_type2_clone_with_stats

stats = generate_type2_clone_with_stats(code, "python", seed=42)

print(f"Type-2 Code: {stats['type2_code']}")
print(f"Identifiers Renamed: {stats['identifiers_renamed']}")
print(f"Literals Changed: {stats['literals_changed']}")
print(f"Categories: {stats['categories']}")
# Categories: {'classes': 1, 'constants': 2, 'functions': 3, 'variables': 10}
```

## Examples

### Example 1: Python Calculator

```python
# Original
class Calculator:
    MAX_SIZE = 100

    def calculate(self, value):
        result = value * 2 + 10
        message = "Result is"
        return result

# Type-2 Clone
class Class_0:
    CONST_0 = 110

    def func_0(self, var_0):
        var_1 = var_0 * 3 + 15
        var_2 = "Output is"
        return var_1
```

### Example 2: Java Factorial

```java
// Original
public int factorial(int n) {
    if (n <= 1) return 1;
    return n * factorial(n - 1);
}

// Type-2 Clone
public int func_0(int var_0) {
    if (var_0 <= 2) return 5;
    return var_0 * func_0(var_0 - 1);
}
```

## Verification Checklist

Use this checklist to verify if a code clone is a valid Type-2:

- [ ] ✅ Are identifiers renamed?
- [ ] ✅ Are literals changed?
- [ ] ✅ Are data types modified (if applicable)?
- [ ] ✅ Is control flow preserved?
- [ ] ✅ Is sequence of operations maintained?
- [ ] ✅ Is overall structure unchanged?
- [ ] ✅ Are keywords and built-ins preserved?

If all checks pass, it's a valid Type-2 clone!

## Related Documentation

- [TYPE1_CLONE_RULES.md](TYPE1_CLONE_RULES.md) - Type-1 clone specification
- [CHANGES_OVERVIEW.md](CHANGES_OVERVIEW.md) - Overview of all clone types
- [TYPE1_IMPLEMENTATION_SUMMARY.md](TYPE1_IMPLEMENTATION_SUMMARY.md) - Implementation details

## References

- Roy, C. K., & Cordy, J. R. (2007). A survey on software clone detection research.
- Bellon, S., et al. (2007). Comparison and evaluation of clone detection tools.
