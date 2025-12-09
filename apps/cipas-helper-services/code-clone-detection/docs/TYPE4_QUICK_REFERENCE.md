# Type-4 Clone Quick Reference

## What is Type-4?

**Same behavior, ANY implementation**

Type-4 clones compute the same result or perform the same task using **completely different code**.

---

## ✅ Allowed Changes (Everything!)

| Category            | Examples                                         |
| ------------------- | ------------------------------------------------ |
| **Algorithm**       | Bubble sort → Merge sort, Linear → Binary search |
| **Control Flow**    | Loop → Recursion, If-else → Dictionary lookup    |
| **Data Structure**  | Array → Hash map, List → Set, Stack → Recursion  |
| **Execution Order** | Forward → Backward, Eager → Lazy evaluation      |
| **Code Structure**  | Procedural → OOP, Monolithic → Modular           |
| **Paradigm**        | Imperative → Functional, Sync → Async            |
| **Math Approach**   | Iteration → Formula, Different equations         |
| **Identifiers**     | Any variable/function names                      |
| **Data Types**      | Any compatible types                             |
| **Code Length**     | 1 line → 100 lines or vice versa                 |
| **Libraries**       | Manual → Built-in, Different libraries           |

---

## ❗ Only Requirement

**Semantic Equivalence**: Must compute same result or perform same task

---

## Quick Examples

### Example 1: Different Algorithms

```python
# Original: Bubble Sort
def sort(arr):
    n = len(arr)
    for i in range(n):
        for j in range(n-i-1):
            if arr[j] > arr[j+1]:
                arr[j], arr[j+1] = arr[j+1], arr[j]
    return arr

# Type-4: Quick Sort (completely different)
def sort(arr):
    if len(arr) <= 1:
        return arr
    pivot = arr[len(arr)//2]
    left = [x for x in arr if x < pivot]
    middle = [x for x in arr if x == pivot]
    right = [x for x in arr if x > pivot]
    return sort(left) + middle + sort(right)
```

### Example 2: Loop vs. Recursion

```python
# Original: Iterative
def factorial(n):
    result = 1
    for i in range(1, n+1):
        result *= i
    return result

# Type-4: Recursive
def factorial(n):
    return 1 if n <= 1 else n * factorial(n-1)
```

### Example 3: Different Data Structures

```python
# Original: Array-based
def count_words(text):
    result = []
    for word in text.split():
        found = False
        for item in result:
            if item[0] == word:
                item[1] += 1
                found = True
        if not found:
            result.append([word, 1])
    return result

# Type-4: Dictionary-based
def count_words(text):
    result = {}
    for word in text.split():
        result[word] = result.get(word, 0) + 1
    return result
```

### Example 4: Imperative vs. Functional

```python
# Original: Imperative
def sum_squares(nums):
    total = 0
    for n in nums:
        total += n * n
    return total

# Type-4: Functional
def sum_squares(nums):
    return sum(map(lambda x: x**2, nums))
```

### Example 5: Different Order

```python
# Original: Filter first, then transform
def process(data):
    valid = [x for x in data if x > 0]
    return [x * 2 for x in valid]

# Type-4: Transform with condition
def process(data):
    return [x * 2 for x in data if x > 0]
```

### Example 6: Manual vs. Built-in

```python
# Original: Manual implementation
def reverse(s):
    result = ""
    for i in range(len(s)-1, -1, -1):
        result += s[i]
    return result

# Type-4: Built-in
def reverse(s):
    return s[::-1]
```

### Example 7: Procedural vs. OOP

```python
# Original: Procedural
def area(shape, **dims):
    if shape == "circle":
        return 3.14 * dims["r"] ** 2
    elif shape == "rect":
        return dims["w"] * dims["h"]

# Type-4: Object-Oriented
class Circle:
    def __init__(self, r):
        self.r = r
    def area(self):
        return 3.14 * self.r ** 2

class Rectangle:
    def __init__(self, w, h):
        self.w, self.h = w, h
    def area(self):
        return self.w * self.h
```

### Example 8: Formula vs. Iteration

```python
# Original: Iteration
def sum_1_to_n(n):
    total = 0
    for i in range(1, n+1):
        total += i
    return total

# Type-4: Mathematical formula
def sum_1_to_n(n):
    return n * (n + 1) // 2
```

---

## Type Comparison

| Feature      | Type-1  | Type-2  | Type-3     | Type-4 |
| ------------ | ------- | ------- | ---------- | ------ |
| Whitespace   | ❌ Diff | ✅ Any  | ✅ Any     | ✅ Any |
| Comments     | ❌ Diff | ✅ Any  | ✅ Any     | ✅ Any |
| Identifiers  | ✅ Same | ❌ Diff | ❌ Diff    | ✅ Any |
| Literals     | ✅ Same | ❌ Diff | ❌ Diff    | ✅ Any |
| Statements   | ✅ Same | ✅ Same | ⚠️ Some    | ✅ Any |
| Control Flow | ✅ Same | ✅ Same | ⚠️ Minor   | ✅ Any |
| Algorithm    | ✅ Same | ✅ Same | ✅ Same    | ✅ Any |
| Structure    | ✅ Same | ✅ Same | ⚠️ Similar | ✅ Any |

**Legend:**

- ✅ Same = Must be identical
- ❌ Diff = Must be different
- ⚠️ Some/Minor = Limited changes allowed
- ✅ Any = No restrictions

---

## Detection Method

Type-4 clones are typically found through:

### Mining Approach

Extract multiple solutions to the same problem from:

- CodeNet, LeetCode, HackerRank datasets
- Competitive programming submissions
- GitHub repositories solving similar problems

### Validation

Verify semantic equivalence through:

- Unit testing (same inputs → same outputs)
- Dynamic execution comparison
- LLM-based semantic analysis

---

## Key Takeaways

1. **No syntactic constraints** - code can look completely different
2. **Only semantic constraint** - must produce same result
3. **Most liberal definition** of code clones
4. **Challenging to detect** - requires semantic analysis
5. **Common in practice** - different developers, different solutions

---

## Use Cases

- **Code recommendation**: "Here's another way to do this"
- **API alternatives**: Finding equivalent library functions
- **Algorithmic diversity**: Understanding different approaches
- **Refactoring opportunities**: Identifying better implementations
- **Learning**: Showing multiple solutions to same problem

---

## See Also

- **Full Specification**: `TYPE4_CLONE_SPECIFICATION.md`
- **Implementation**: `src/generation/type4_mining.py`
- **Configuration**: `configs/clones_config.yaml`
- **Validation**: `src/validation/dynamic_validation.py`
