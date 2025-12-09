# Type-4 Clone Specification

## Overview

Type-4 clones are **semantically equivalent but syntactically very different** code fragments. They implement the same functionality or compute the same result using completely different approaches, algorithms, data structures, or control flow patterns. The key characteristic is that **behavior is equivalent, but implementation can be entirely different**.

## Definition

**Type-4 Clone**: Two code fragments that perform the same task or compute the same result, but use completely different implementations. There are no constraints on how different the code can be—only the semantic equivalence matters.

## Core Principle

> **"Same behavior, any implementation"**

Both pieces of code must:

- Compute the same result OR
- Perform the same task OR
- Achieve the same functional goal

But they can differ in **every other aspect**.

---

## Allowed Changes (Type-4)

Type-4 clones allow **ANY** differences in implementation, including:

### 1. **Different Algorithms**

The most fundamental difference—using completely different algorithmic approaches to solve the same problem.

#### Example: Sorting Algorithms

```python
# Original: Bubble Sort
def sort_numbers(arr):
    n = len(arr)
    for i in range(n):
        for j in range(0, n-i-1):
            if arr[j] > arr[j+1]:
                arr[j], arr[j+1] = arr[j+1], arr[j]
    return arr

# Type-4 Clone: Merge Sort (completely different algorithm)
def sort_numbers(arr):
    if len(arr) <= 1:
        return arr
    mid = len(arr) // 2
    left = sort_numbers(arr[:mid])
    right = sort_numbers(arr[mid:])
    return merge(left, right)

def merge(left, right):
    result = []
    i = j = 0
    while i < len(left) and j < len(right):
        if left[i] < right[j]:
            result.append(left[i])
            i += 1
        else:
            result.append(right[j])
            j += 1
    result.extend(left[i:])
    result.extend(right[j:])
    return result
```

#### Example: Search Algorithms

```python
# Original: Linear Search
def find_element(arr, target):
    for i in range(len(arr)):
        if arr[i] == target:
            return i
    return -1

# Type-4 Clone: Binary Search (different algorithm)
def find_element(arr, target):
    arr.sort()  # Assumes sorted array
    left, right = 0, len(arr) - 1
    while left <= right:
        mid = (left + right) // 2
        if arr[mid] == target:
            return mid
        elif arr[mid] < target:
            left = mid + 1
        else:
            right = mid - 1
    return -1
```

### 2. **Different Control Flow**

Completely different branching strategies, loop structures, or execution paths.

#### Example: Loop vs. Recursion

```python
# Original: Iterative Approach
def factorial(n):
    result = 1
    for i in range(1, n + 1):
        result *= i
    return result

# Type-4 Clone: Recursive Approach
def factorial(n):
    if n <= 1:
        return 1
    return n * factorial(n - 1)
```

#### Example: Different Branching Logic

```python
# Original: Multiple if-else statements
def classify_grade(score):
    if score >= 90:
        return 'A'
    elif score >= 80:
        return 'B'
    elif score >= 70:
        return 'C'
    elif score >= 60:
        return 'D'
    else:
        return 'F'

# Type-4 Clone: Dictionary lookup
def classify_grade(score):
    grades = [(90, 'A'), (80, 'B'), (70, 'C'), (60, 'D'), (0, 'F')]
    for threshold, grade in grades:
        if score >= threshold:
            return grade
    return 'F'
```

### 3. **Different Data Structures**

Using completely different data structures to achieve the same goal.

#### Example: Array vs. Hash Map

```python
# Original: Using array/list
def count_occurrences(items):
    result = []
    for item in items:
        found = False
        for entry in result:
            if entry[0] == item:
                entry[1] += 1
                found = True
                break
        if not found:
            result.append([item, 1])
    return result

# Type-4 Clone: Using dictionary
def count_occurrences(items):
    result = {}
    for item in items:
        result[item] = result.get(item, 0) + 1
    return result
```

#### Example: Stack vs. Recursion

```python
# Original: Using explicit stack
def reverse_string(s):
    stack = []
    for char in s:
        stack.append(char)
    result = ""
    while stack:
        result += stack.pop()
    return result

# Type-4 Clone: Using slicing
def reverse_string(s):
    return s[::-1]
```

### 4. **Different Order of Operations**

Operations performed in completely different sequences while maintaining semantic equivalence.

#### Example: Forward vs. Backward Processing

```python
# Original: Process from start to end
def sum_positive_numbers(numbers):
    total = 0
    for num in numbers:
        if num > 0:
            total += num
    return total

# Type-4 Clone: Filter then sum
def sum_positive_numbers(numbers):
    positive_nums = [n for n in numbers if n > 0]
    return sum(positive_nums)
```

#### Example: Eager vs. Lazy Evaluation

```python
# Original: Eager evaluation
def process_data(data):
    cleaned = clean_data(data)
    validated = validate_data(cleaned)
    transformed = transform_data(validated)
    return transformed

# Type-4 Clone: Lazy pipeline
def process_data(data):
    pipeline = [clean_data, validate_data, transform_data]
    result = data
    for operation in pipeline:
        result = operation(result)
    return result
```

### 5. **Completely Different Code Structure**

Different number of functions, classes, modules, or architectural patterns.

#### Example: Procedural vs. Object-Oriented

```python
# Original: Procedural approach
def calculate_area(shape, dimensions):
    if shape == "circle":
        return 3.14 * dimensions["radius"] ** 2
    elif shape == "rectangle":
        return dimensions["width"] * dimensions["height"]
    elif shape == "triangle":
        return 0.5 * dimensions["base"] * dimensions["height"]

# Type-4 Clone: Object-oriented approach
class Shape:
    def area(self):
        raise NotImplementedError

class Circle(Shape):
    def __init__(self, radius):
        self.radius = radius

    def area(self):
        return 3.14 * self.radius ** 2

class Rectangle(Shape):
    def __init__(self, width, height):
        self.width = width
        self.height = height

    def area(self):
        return self.width * self.height

class Triangle(Shape):
    def __init__(self, base, height):
        self.base = base
        self.height = height

    def area(self):
        return 0.5 * self.base * self.height
```

### 6. **Different Identifiers, Data Types, and Literals**

Complete freedom in naming, types, and literal values.

#### Example: Different Types and Names

```python
# Original: Using integers and arrays
def calculate_stats(numbers):
    total = 0
    count = 0
    for num in numbers:
        total += num
        count += 1
    average = total / count if count > 0 else 0
    return average

# Type-4 Clone: Using floating point and different approach
def calculate_stats(data_points):
    if not data_points:
        return 0.0
    mean_value = sum(data_points) / len(data_points)
    return mean_value
```

### 7. **Different Number of Statements or Functions**

No restrictions on the amount of code—one solution might be a single line, another might be dozens of lines.

#### Example: Concise vs. Verbose

```python
# Original: One-liner using built-in
def get_even_numbers(numbers):
    return [n for n in numbers if n % 2 == 0]

# Type-4 Clone: Explicit multi-step approach
def get_even_numbers(numbers):
    result = []
    for i in range(len(numbers)):
        current_number = numbers[i]
        remainder = current_number % 2
        is_even = (remainder == 0)
        if is_even:
            result.append(current_number)
    return result
```

### 8. **Different Programming Paradigms**

Imperative vs. functional, synchronous vs. asynchronous, etc.

#### Example: Imperative vs. Functional

```python
# Original: Imperative style
def sum_squares(numbers):
    result = 0
    for num in numbers:
        square = num * num
        result = result + square
    return result

# Type-4 Clone: Functional style
def sum_squares(numbers):
    return sum(map(lambda x: x ** 2, numbers))
```

#### Example: Synchronous vs. Asynchronous

```python
# Original: Synchronous processing
def fetch_data(urls):
    results = []
    for url in urls:
        response = http_get(url)
        results.append(response)
    return results

# Type-4 Clone: Asynchronous processing
async def fetch_data(urls):
    tasks = [async_http_get(url) for url in urls]
    results = await asyncio.gather(*tasks)
    return results
```

### 9. **Different Built-in Functions or Libraries**

Using different standard library functions or third-party libraries.

#### Example: Manual vs. Library Functions

```python
# Original: Manual string manipulation
def to_uppercase(text):
    result = ""
    for char in text:
        ascii_val = ord(char)
        if 97 <= ascii_val <= 122:  # lowercase a-z
            result += chr(ascii_val - 32)
        else:
            result += char
    return result

# Type-4 Clone: Using built-in method
def to_uppercase(text):
    return text.upper()
```

### 10. **Different Mathematical or Logical Approaches**

Different formulas, equations, or logical reasoning paths.

#### Example: Different Mathematical Formulas

```python
# Original: Sum using iteration
def sum_1_to_n(n):
    total = 0
    for i in range(1, n + 1):
        total += i
    return total

# Type-4 Clone: Using mathematical formula
def sum_1_to_n(n):
    return n * (n + 1) // 2
```

---

## Summary of Allowed Changes

| Category                  | Allowed in Type-4                                  |
| ------------------------- | -------------------------------------------------- |
| **Algorithms**            | ✅ Completely different (bubble sort → merge sort) |
| **Control Flow**          | ✅ Completely different (loop → recursion)         |
| **Data Structures**       | ✅ Completely different (array → hash map)         |
| **Order of Operations**   | ✅ Any order (forward → backward)                  |
| **Code Structure**        | ✅ Any structure (procedural → OOP)                |
| **Identifiers**           | ✅ Any names                                       |
| **Data Types**            | ✅ Any types (int → float)                         |
| **Literals**              | ✅ Any values                                      |
| **Number of Statements**  | ✅ Any amount (1 line → 100 lines)                 |
| **Number of Functions**   | ✅ Any amount (1 function → multiple)              |
| **Programming Paradigm**  | ✅ Any paradigm (imperative → functional)          |
| **Libraries/Built-ins**   | ✅ Any functions or libraries                      |
| **Mathematical Approach** | ✅ Any formula or method                           |

---

## Requirements

### ✅ Must Have: Semantic Equivalence

Both code fragments **MUST**:

- Compute the same result for the same inputs OR
- Perform the same task/operation OR
- Achieve the same functional goal

### ❌ No Other Constraints

There are **NO** constraints on:

- How the code is written
- What algorithms are used
- What data structures are employed
- How long or short the code is
- What programming style is used

---

## Type-4 vs. Other Clone Types

| Feature                 | Type-1       | Type-2            | Type-3           | Type-4 |
| ----------------------- | ------------ | ----------------- | ---------------- | ------ |
| **Whitespace/Comments** | ❌ Different | ✅ Same/Different | ✅ Any           | ✅ Any |
| **Identifiers**         | ✅ Same      | ❌ Different      | ❌ Different     | ❌ Any |
| **Literals**            | ✅ Same      | ❌ Different      | ❌ Different     | ❌ Any |
| **Statements**          | ✅ Same      | ✅ Same           | ❌ Added/Removed | ❌ Any |
| **Control Flow**        | ✅ Same      | ✅ Same           | ⚠️ Minor Changes | ❌ Any |
| **Algorithm**           | ✅ Same      | ✅ Same           | ✅ Same          | ❌ Any |
| **Data Structures**     | ✅ Same      | ✅ Same           | ✅ Same          | ❌ Any |
| **Code Structure**      | ✅ Same      | ✅ Same           | ⚠️ Similar       | ❌ Any |

---

## Validation Checklist

To verify a Type-4 clone pair:

- [x] **Semantic Equivalence**: Both code fragments produce the same result or perform the same task
- [x] **Syntactic Difference**: Code is structurally or algorithmically different (not just renamed)
- [x] **Functional Testing**: Both implementations pass the same test cases
- [ ] **(Optional) Performance**: Implementations may have different performance characteristics

---

## Common Type-4 Clone Scenarios

### 1. **Algorithm Variations**

- Bubble sort vs. Quick sort vs. Merge sort
- Linear search vs. Binary search
- Iterative vs. Recursive solutions

### 2. **Design Pattern Differences**

- Procedural vs. Object-Oriented
- Singleton vs. Factory pattern
- Strategy pattern vs. if-else statements

### 3. **Optimization Levels**

- Naive implementation vs. Optimized implementation
- Manual loops vs. Built-in functions
- Brute force vs. Dynamic programming

### 4. **Library/Framework Choices**

- Native implementation vs. Library function
- Different libraries for same task (e.g., requests vs. urllib)
- Manual vs. Automated approaches

---

## Detection Strategy

Type-4 clones are typically detected through:

1. **Mining Approach**: Extract multiple solutions to the same problem from:

   - Problem-solving datasets (CodeNet, LeetCode, etc.)
   - Competitive programming submissions
   - Open-source repositories solving similar tasks

2. **Validation**: Verify semantic equivalence through:
   - Unit testing (same inputs → same outputs)
   - Dynamic analysis (execution tracing)
   - LLM-based semantic comparison
   - Formal verification (for critical code)

---

## Notes

- Type-4 clones represent the **most liberal** definition of code clones
- Detection is **challenging** because syntactic similarity is minimal or non-existent
- **Semantic equivalence** is the only constraint
- Useful for:
  - Understanding algorithmic diversity
  - Code recommendation systems
  - API alternative detection
  - Refactoring opportunities

---

## References

- **Mining Strategy**: See `type4_mining.py` for implementation
- **Configuration**: See `clones_config.yaml` for generation parameters
- **Validation**: See `validation/dynamic_validation.py` for semantic verification
