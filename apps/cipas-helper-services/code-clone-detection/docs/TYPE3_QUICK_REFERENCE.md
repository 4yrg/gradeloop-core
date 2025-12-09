# Type-3 Clone Quick Reference

## Definition

**Type-3 Clone**: Code fragments that are **mostly similar** with **recognizable core logic**, but include statement-level modifications beyond identifier renaming.

## Key Principle

✅ **Mostly Similar + Recognizable Core Logic**  
❌ **NOT Complete Rewrites** (that's Type-4)

## 8 Allowed Transformations

### 1. Identifier Renaming ✏️

```python
# Original
max_value = numbers[0]

# Type-3
largest = values[0]
```

### 2. Literal Changes 🔢

```python
# Original
greeting = "Hello"

# Type-3
greeting = "Hi"
```

### 3. Formatting & Comments 📝

```python
# Original
def add(a,b):return a+b

# Type-3
def add_numbers(x, y):
    # Add two numbers
    return x + y
```

### 4. Data Type Modifications 🔄

```python
# Original
def process(items: list) -> int:

# Type-3
def process(items: tuple) -> float:
```

### 5. Adding/Removing Statements ➕➖

**Extra Lines:**

```python
# Original
return a / b

# Type-3
if b == 0:
    raise ValueError("Division by zero")
result = a / b
print(f"Result: {result}")
return result
```

**Missing Lines:**

```python
# Original
total = sum(numbers)
count = len(numbers)
average = total / count
return average

# Type-3
return sum(numbers) / len(numbers)
```

**Added Checks:**

```python
# Original
return items[0]

# Type-3
if not items:
    raise ValueError("Empty list")
return items[0]
```

### 6. Small Helper Operations 🛠️

```python
# Original
return price * (1 - percent / 100)

# Type-3
decimal_rate = percent / 100.0
discount = price * decimal_rate
final_price = price - discount
return final_price
```

### 7. Reordering Statements 🔀

```python
# Original
user['name'] = name
user['age'] = age
user['email'] = email

# Type-3
user['email'] = email
user['name'] = name
user['age'] = age
```

### 8. Small Control Flow Changes 🌊

**Extra If Guards:**

```python
# Original
return value * 2

# Type-3
if value is None:
    return 0
if value < 0:
    return 0
return value * 2
```

**Additional Logging:**

```python
# Original
for item in items:
    process(item)

# Type-3
print(f"Processing {len(items)} items")
for item in items:
    process(item)
print("Processing complete")
```

## Quick Checklist

### ✅ Valid Type-3

- [ ] Core logic recognizable
- [ ] Overall structure preserved
- [ ] At least one Type-3 transformation applied
- [ ] Mostly similar to original
- [ ] Functionally equivalent

### ❌ NOT Type-3 (Too Different = Type-4)

- [ ] Complete algorithm rewrite
- [ ] Unrecognizable core logic
- [ ] Completely different approach
- [ ] Major structural changes

## Comparison Chart

| Feature                   | Type-2 | Type-3    | Type-4    |
| ------------------------- | ------ | --------- | --------- |
| **Identifier Renaming**   | ✓      | ✓         | ✓         |
| **Literal Changes**       | ✓      | ✓         | ✓         |
| **Add/Remove Statements** | ✗      | ✓         | ✓         |
| **Control Flow Changes**  | ✗      | ✓ (small) | ✓ (major) |
| **Core Logic Preserved**  | ✓      | ✓         | ✗         |
| **Recognizable**          | ✓      | ✓         | ✗         |

## Example Transformation

```python
# ORIGINAL
def find_max(numbers):
    max_val = numbers[0]
    for num in numbers:
        if num > max_val:
            max_val = num
    return max_val

# TYPE-3 CLONE
def get_largest_value(values):
    """Find the largest value."""
    # Validate input
    if not values:
        raise ValueError("Empty collection")

    # Initialize
    largest = values[0]
    comparisons = 0

    # Search
    for current_value in values[1:]:
        comparisons += 1
        if current_value > largest:
            largest = current_value

    print(f"Found after {comparisons} comparisons")
    return largest

# ✓ Recognizable: Still a linear search for max
# ✓ Modified: Added validation, logging, counter
# ✓ Similar: Core algorithm preserved
```

## Common Patterns

### Pattern 1: Add Validation

```python
# Before
def process(data):
    return data * 2

# After (Type-3)
def process(data):
    if data is None:
        raise ValueError("Data required")
    if data < 0:
        raise ValueError("Must be positive")
    return data * 2
```

### Pattern 2: Add Logging

```python
# Before
result = calculate(x)
return result

# After (Type-3)
print("Starting calculation")
result = calculate(x)
print(f"Result: {result}")
return result
```

### Pattern 3: Break Into Steps

```python
# Before
return (a + b) * c / d

# After (Type-3)
sum_val = a + b
product = sum_val * c
result = product / d
return result
```

### Pattern 4: Add Intermediate Variables

```python
# Before
for item in items:
    results.append(process(item))

# After (Type-3)
for item in items:
    processed = process(item)
    results.append(processed)
```

## Usage with Ollama

```python
from src.generation.ollama_client import OllamaLLMClient

# Configure
config = {
    'model_name': 'codegemma:2b',
    'api': {'base_url': 'http://localhost:11434'},
    'settings': {'temperature': 0.1, 'max_tokens': 1000}
}

# Create client
client = OllamaLLMClient(config)

# Generate Type-3 clone
original = """
def factorial(n):
    if n <= 1:
        return 1
    return n * factorial(n - 1)
"""

summary = client.summarize(original, "python")
type3_clone = client.generate_from_summary(summary, "python")

print(type3_clone)
# Result: Type-3 clone with transformations applied
```

## Configuration Tips

### For More Transformations

- Increase `max_tokens` (e.g., 1500)
- Slightly increase `temperature` (e.g., 0.2-0.3)
- Use models with better instruction following

### For More Conservative Clones

- Decrease `temperature` (e.g., 0.05-0.1)
- Reduce `max_tokens` (e.g., 500-800)
- Use smaller, focused models

## Common Pitfalls

### ❌ Pitfall 1: Too Different (Type-4)

```python
# Original: Iterative
def sum_list(nums):
    total = 0
    for n in nums:
        total += n
    return total

# ❌ Type-4 (too different - completely changed approach)
def sum_list(nums):
    return sum(nums)  # Built-in, fundamentally different
```

### ❌ Pitfall 2: Not Enough Change (Type-2)

```python
# Original
def add(a, b):
    return a + b

# ❌ Type-2 only (just renaming)
def sum_values(x, y):
    return x + y
```

### ✅ Correct Type-3

```python
# Original
def add(a, b):
    return a + b

# ✅ Type-3 (renaming + validation + logging)
def sum_values(x, y):
    if x is None or y is None:
        raise ValueError("Inputs required")
    result = x + y
    print(f"Added {x} + {y} = {result}")
    return result
```

## Files Reference

- **Specification**: `TYPE3_CLONE_SPECIFICATION.md`
- **Implementation Summary**: `TYPE3_IMPLEMENTATION_SUMMARY.md`
- **Code**: `src/generation/type3_backtranslate.py`
- **LLM Client**: `src/generation/ollama_client.py`

## Quick Commands

```bash
# Test Type-3 generation
python src/generation/type3_backtranslate.py

# Run with Ollama
python examples/demonstrate_improvements.py
```

---

**Remember**: Type-3 = **Mostly Similar** + **Recognizable Core** + **Statement-Level Changes**
