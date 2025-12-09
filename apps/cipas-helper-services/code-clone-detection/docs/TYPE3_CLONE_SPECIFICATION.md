# Type-3 Clone Specification

## Overview

Type-3 clones are **copied fragments with further modifications**. They represent code segments that implement similar functionality but with statement-level changes, added or removed statements, and small variations in control flow. The key characteristic is that **core logic remains recognizable and aligned**, distinguishing them from Type-4 clones (which are completely rewritten).

## Definition

**Type-3 Clone**: Two code fragments that are mostly similar with the same core logic, but include modifications beyond identifier renaming (Type-2) such as:

- Adding or removing statements
- Small control flow modifications
- Data type changes
- Statement reordering
- Extra helper operations

## Allowed Transformations (Type-3)

### 1. **Identifier Renaming** (inherited from Type-2)

- Variable name changes
- Function/method name changes
- Parameter name changes
- Class name changes

**Example:**

```python
# Original
def calculate_sum(numbers):
    total = 0
    return total

# Type-3 Clone (with renaming)
def compute_total(values):
    result = 0
    return result
```

### 2. **Literal Changes**

- Changing constant values where semantically equivalent
- Modifying string literals
- Altering numeric values (with same effect)
- Different default values

**Example:**

```python
# Original
def greet(name, greeting="Hello"):
    return f"{greeting}, {name}!"

# Type-3 Clone
def greet_user(username, message="Hi"):
    return f"{message}, {username}!"
```

### 3. **Formatting and Comments**

- Different indentation styles
- Adding or removing comments
- Different line breaks
- Whitespace variations

**Example:**

```python
# Original
def add(a,b):return a+b

# Type-3 Clone
def add_numbers(x, y):
    # Add two numbers together
    return x + y
```

### 4. **Data Type Modifications**

- Changing between compatible types (int ↔ float)
- List ↔ Tuple conversions
- Different collection types with same semantics
- Type annotation changes

**Example:**

```python
# Original
def process_items(items: list) -> int:
    return len(items)

# Type-3 Clone
def count_elements(elements: tuple) -> float:
    return float(len(elements))
```

### 5. **Adding or Removing Statements**

#### Extra Lines

- Additional validation checks
- Logging statements
- Debugging code
- Intermediate variable assignments

**Example:**

```python
# Original
def divide(a, b):
    return a / b

# Type-3 Clone (with extra lines)
def perform_division(numerator, denominator):
    # Validate inputs
    if numerator is None or denominator is None:
        raise ValueError("Inputs cannot be None")

    # Perform division
    result = numerator / denominator

    # Log result
    print(f"Division result: {result}")

    return result
```

#### Missing Lines

- Removing non-essential operations
- Simplifying validation
- Removing redundant assignments

**Example:**

```python
# Original
def calculate_average(numbers):
    if not numbers:
        return 0
    total = sum(numbers)
    count = len(numbers)
    average = total / count
    return average

# Type-3 Clone (with missing lines)
def compute_mean(values):
    if not values:
        return 0
    return sum(values) / len(values)
```

#### Added Checks

- Input validation
- Boundary checks
- Error handling
- Defensive programming

**Example:**

```python
# Original
def get_first_element(items):
    return items[0]

# Type-3 Clone (with added checks)
def retrieve_first_item(collection):
    if not collection:
        raise ValueError("Collection is empty")
    if not isinstance(collection, (list, tuple)):
        raise TypeError("Expected list or tuple")
    return collection[0]
```

### 6. **Small Helper Operations**

- Additional computational steps
- Intermediate processing
- Data transformation helpers
- Format conversions

**Example:**

```python
# Original
def calculate_discount(price, percent):
    return price * (1 - percent / 100)

# Type-3 Clone (with helper operation)
def apply_discount(amount, discount_rate):
    # Convert percentage to decimal
    decimal_rate = discount_rate / 100.0
    # Calculate discount amount
    discount_amount = amount * decimal_rate
    # Return final price
    final_price = amount - discount_amount
    return final_price
```

### 7. **Reordering Closely Related Statements**

- Swapping independent operations
- Reordering variable declarations
- Changing sequence of similar operations (where safe)

**Example:**

```python
# Original
def initialize_user(name, age, email):
    user = {}
    user['name'] = name
    user['age'] = age
    user['email'] = email
    return user

# Type-3 Clone (with reordering)
def create_user_object(username, years, email_address):
    person = {}
    person['email'] = email_address
    person['name'] = username
    person['age'] = years
    return person
```

### 8. **Small Changes in Control Flow**

#### Extra If Guards

- Additional conditional checks
- Guard clauses
- Early returns

**Example:**

```python
# Original
def process_value(value):
    return value * 2

# Type-3 Clone (with if guard)
def double_value(num):
    if num is None:
        return 0
    if num < 0:
        return 0
    return num * 2
```

#### Additional Logging

- Debug statements
- Progress tracking
- Status messages

**Example:**

```python
# Original
def process_batch(items):
    results = []
    for item in items:
        results.append(item * 2)
    return results

# Type-3 Clone (with logging)
def transform_batch(elements):
    print(f"Processing {len(elements)} elements")
    transformed = []
    for element in elements:
        transformed.append(element * 2)
    print("Batch processing complete")
    return transformed
```

#### Added Computation Step

- Breaking complex expressions into steps
- Intermediate calculations
- Multi-step processing

**Example:**

```python
# Original
def calculate_total(prices, tax_rate):
    return sum(prices) * (1 + tax_rate)

# Type-3 Clone (with computation steps)
def compute_final_amount(item_prices, tax_percentage):
    # Step 1: Calculate subtotal
    subtotal = sum(item_prices)

    # Step 2: Calculate tax amount
    tax_amount = subtotal * tax_percentage

    # Step 3: Calculate final total
    final_total = subtotal + tax_amount

    return final_total
```

## Critical Requirements

### ✅ Must Hold for Type-3

1. **Mostly Similar**: The two code fragments must be mostly similar

   - Core algorithm recognizable
   - Overall structure preserved
   - Primary logic flow intact

2. **Core Logic Remains Recognizable**:

   - Main operations still identifiable
   - Key transformations preserved
   - Functional intent clear

3. **Aligned Implementation**:
   - Same general approach
   - Similar computational steps
   - Comparable complexity

### ❌ Must NOT Occur (Otherwise Type-4)

1. **Complete Rewrite**: Using entirely different algorithms
2. **Different Paradigms**: Changing from iterative to recursive fundamentally
3. **Major Restructuring**: Complete reorganization of logic
4. **Different Approaches**: Solving problem in completely different way

## Examples by Language

### Python Example

```python
# Original Function
def find_maximum(numbers):
    max_val = numbers[0]
    for num in numbers:
        if num > max_val:
            max_val = num
    return max_val

# Type-3 Clone
def get_largest_value(values):
    """Find the largest value in a collection."""
    # Initialize with first element
    largest = values[0]

    # Track comparison count for debugging
    comparisons = 0

    # Iterate through remaining elements
    for current_value in values[1:]:
        comparisons += 1
        # Update if current value is larger
        if current_value > largest:
            largest = current_value

    # Log statistics
    print(f"Found largest value after {comparisons} comparisons")

    return largest
```

**Type-3 Transformations Applied:**

- ✅ Identifier renaming (`numbers` → `values`, `max_val` → `largest`)
- ✅ Added docstring comment
- ✅ Extra lines (comparisons counter, logging)
- ✅ Added computation step (tracking comparisons)
- ✅ Different loop start (skipping first element)
- ✅ Additional comments
- ✅ Core logic recognizable and aligned ✓

### Java Example

```java
// Original
public int calculateSum(int[] numbers) {
    int sum = 0;
    for (int i = 0; i < numbers.length; i++) {
        sum += numbers[i];
    }
    return sum;
}

// Type-3 Clone
public long computeTotal(int[] values) {
    // Validate input
    if (values == null) {
        throw new IllegalArgumentException("Array cannot be null");
    }

    // Initialize result as long to prevent overflow
    long total = 0L;

    // Accumulate values
    for (int index = 0; index < values.length; index++) {
        int currentValue = values[index];
        total += currentValue;
    }

    // Log result
    System.out.println("Total calculated: " + total);

    return total;
}
```

**Type-3 Transformations Applied:**

- ✅ Identifier renaming
- ✅ Data type modification (int → long return type)
- ✅ Added validation check
- ✅ Extra lines (intermediate variable, logging)
- ✅ Additional comments
- ✅ Core logic recognizable and aligned ✓

## Comparison with Other Clone Types

| Feature                  | Type-1 | Type-2 | Type-3    | Type-4    |
| ------------------------ | ------ | ------ | --------- | --------- |
| **Exact Copy**           | ✓      | ✗      | ✗         | ✗         |
| **Identifier Renaming**  | ✗      | ✓      | ✓         | ✓         |
| **Literal Changes**      | ✗      | ✓      | ✓         | ✓         |
| **Statement Add/Remove** | ✗      | ✗      | ✓         | ✓         |
| **Control Flow Changes** | ✗      | ✗      | ✓ (small) | ✓ (major) |
| **Core Logic Preserved** | ✓      | ✓      | ✓         | ✗         |
| **Recognizable**         | ✓      | ✓      | ✓         | ✗         |
| **Mostly Similar**       | ✓      | ✓      | ✓         | ✗         |

## Detection Challenges

Type-3 clones are more difficult to detect than Type-1 and Type-2 because:

1. **Structural Variations**: Added/removed statements break simple token matching
2. **Line Count Differences**: Fragments may have different lengths
3. **Reordering**: Statement reordering requires semantic understanding
4. **Control Flow**: Small changes in conditions require deeper analysis

## Best Practices for Generation

When generating Type-3 clones:

1. **Start with Type-2**: Apply identifier renaming first
2. **Add Gradually**: Add statements incrementally (validation, logging)
3. **Keep Core Intact**: Never modify the fundamental algorithm
4. **Stay Recognizable**: Changes should be obvious when comparing side-by-side
5. **Test Functionally**: Ensure both versions produce same results
6. **Document Changes**: Track what transformations were applied

## Validation Criteria

A valid Type-3 clone must satisfy:

- [ ] Core logic is recognizable when comparing both fragments
- [ ] Overall structure and flow are preserved
- [ ] At least one Type-3 transformation applied (beyond Type-2)
- [ ] Not completely rewritten (not Type-4)
- [ ] Functional equivalence maintained (same inputs → same outputs)
- [ ] Mostly similar in structure and approach

## References

- **Type-1 Specification**: See `TYPE1_CLONE_RULES.md`
- **Type-2 Specification**: See `TYPE2_CLONE_SPECIFICATION.md`
- **Implementation**: See `src/generation/type3_backtranslate.py`
- **Ollama Client**: See `src/generation/ollama_client.py`

## Version History

- **v1.0** (2025-01-09): Initial comprehensive Type-3 specification
  - Defined all allowed transformations
  - Added examples for Python and Java
  - Clarified boundaries with Type-4 clones
  - Included validation criteria
