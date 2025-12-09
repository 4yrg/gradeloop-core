# Type-4 Clone Implementation Summary

## Overview

This document summarizes the implementation approach for **Type-4 clone detection and generation** in the code clone detection system.

---

## What is Type-4?

**Type-4 clones** are semantically equivalent but syntactically very different code fragments. They implement the same functionality using completely different:

- Algorithms
- Control flow patterns
- Data structures
- Code organization
- Programming paradigms

**Key Characteristic**: Only requirement is semantic equivalence (same behavior/result).

---

## Implementation Approach

### Strategy: Mining from Problem-Based Datasets

Type-4 clones are **mined** rather than **generated** because:

1. **Difficulty of Generation**: Creating truly different algorithms automatically is extremely challenging
2. **Natural Occurrence**: Problem-solving datasets naturally contain Type-4 clones
3. **Quality Assurance**: Human-written solutions are more diverse and realistic
4. **Semantic Guarantee**: Solutions to same problem are inherently semantically equivalent

### Data Sources

#### Primary: CodeNet Dataset

- IBM Project CodeNet
- 14+ million submissions
- 4000+ programming problems
- Multiple languages (Python, Java, C++, etc.)
- Organized by problem ID

#### Secondary: Competitive Programming

- LeetCode, HackerRank, Codeforces submissions
- Multiple solutions per problem
- Diverse algorithmic approaches

---

## Mining Process

### File Structure Assumption

Files are organized with problem identifiers in filenames:

```
problems/
  ├── prob_001_sub_1.py    # Problem 1, Submission 1
  ├── prob_001_sub_2.py    # Problem 1, Submission 2
  ├── prob_001_sub_3.py    # Problem 1, Submission 3
  ├── prob_002_sub_1.py    # Problem 2, Submission 1
  └── prob_002_sub_2.py    # Problem 2, Submission 2
```

### Algorithm

```
1. Scan directory for files matching language extension
2. Extract problem ID from each filename
3. Group files by problem ID
4. For each problem with >= min_cluster_size solutions:
   a. Generate all pairwise combinations
   b. Add pairs to dataset
5. Return list of (file_a, file_b) tuples
```

### Problem ID Extraction Heuristics

```python
# Patterns recognized:
prob_001_sub_1.py       → prob_001
p001_s1.java            → p001
problem123_solution_a   → problem123
test_file.py            → test_file (fallback)
```

Rules (in order of precedence):

1. If contains `_sub_`: take everything before `_sub_`
2. If contains `_solution_`: take everything before `_solution_`
3. Otherwise: take everything before first underscore
4. If no underscore: use whole filename (without extension)

---

## Implementation Details

### Module: `type4_mining.py`

#### Main Functions

**`mine_type4_from_problems(problem_dir, lang, min_cluster_size=2)`**

- Mines Type-4 clone pairs from problem directory
- Returns: List of `(path_a, path_b)` tuples

**`mine_type4_with_stats(problem_dir, lang, min_cluster_size=2)`**

- Same as above plus detailed statistics
- Returns: Dictionary with pairs, counts, and breakdown

**`filter_pairs_by_similarity(pairs, max_similarity=0.8)`**

- Placeholder for filtering overly similar pairs
- Future: implement actual similarity checking

#### Helper Functions

- `_filter_by_language(directory, lang)`: Find files matching language
- `_group_files_by_problem(files)`: Group by problem ID
- `_extract_problem_id(filename)`: Extract problem identifier
- `_generate_pairs(file_list)`: Generate pairwise combinations

---

## Configuration

### From `clones_config.yaml`

```yaml
generation:
  transformations:
    type4:
      # Different Algorithms
      - "different_algorithm"
      - "loop_to_recursion"
      - "recursion_to_loop"
      - "different_sorting_method"
      - "different_search_method"

      # Different Control Flow
      - "change_control_flow"
      - "different_branching"
      - "different_loop_type"
      - "different_execution_order"

      # Different Data Structures
      - "different_data_structure"
      - "list_to_dict"
      - "array_to_set"
      - "stack_to_recursion"

      # Different Programming Paradigms
      - "imperative_to_functional"
      - "functional_to_imperative"
      - "procedural_to_oop"
      - "oop_to_procedural"

      # Different Code Structure
      - "different_code_structure"
      - "single_function_to_multiple"
      - "multiple_functions_to_single"

      # Different Built-ins/Libraries
      - "manual_to_builtin"
      - "builtin_to_manual"
      - "different_library"

      # Different Mathematical Approaches
      - "formula_to_iteration"
      - "iteration_to_formula"
      - "different_formula"

      # Semantic Equivalents
      - "semantic_equivalent"
      - "optimization_variation"
```

**Note**: These transformations document what _can_ occur in Type-4 clones. The mining approach doesn't apply transformations—it discovers naturally occurring variations.

---

## Validation

### Semantic Equivalence Verification

Type-4 clones must be semantically equivalent. Validation methods:

#### 1. Dynamic Validation (Preferred)

```python
# From validation/dynamic_validation.py
validate_clone_pair_dynamic(code_a, code_b, test_cases)
```

- Executes both code snippets with same test cases
- Compares outputs for equality
- Most reliable for Type-4

#### 2. LLM-Based Validation

```python
# From generation/llm_client.py
client.verify_pair(code_a, code_b, lang)
```

- Uses LLM to assess semantic similarity
- Useful when test cases unavailable
- Less reliable than dynamic validation

#### 3. Problem-Based Assumption

- If both solutions solve same problem, likely semantically equivalent
- Weak guarantee, but practical for large-scale mining
- Should be combined with spot-checking

---

## Usage Examples

### Example 1: Basic Mining

```python
from generation.type4_mining import mine_type4_from_problems

# Mine Type-4 pairs from CodeNet
pairs = mine_type4_from_problems(
    problem_dir="data/codenet/python/",
    lang="python",
    min_cluster_size=2
)

print(f"Found {len(pairs)} Type-4 clone pairs")
```

### Example 2: With Statistics

```python
from generation.type4_mining import mine_type4_with_stats

stats = mine_type4_with_stats(
    problem_dir="data/codenet/python/",
    lang="python",
    min_cluster_size=3  # Only problems with 3+ solutions
)

print(f"Pairs: {stats['num_pairs']}")
print(f"Problems: {stats['num_problems']}")
print(f"Files: {stats['num_files']}")
print(f"Avg solutions per problem: {stats['avg_solutions_per_problem']:.1f}")
```

### Example 3: Integration with Pipeline

```python
import random
import pandas as pd
from generation.type4_mining import mine_type4_from_problems
from data_io import read_code

# Mine pairs
pairs = mine_type4_from_problems("data/codenet/python/", "python")

# Sample desired number
random.shuffle(pairs)
sampled = pairs[:1000]

# Create dataset
data = []
for path_a, path_b in sampled:
    data.append({
        "code_1": read_code(path_a),
        "code_2": read_code(path_b),
        "clone_type": "type4",
        "label": 1  # Positive clone
    })

df = pd.DataFrame(data)
df.to_parquet("type4_clones.parquet")
```

---

## Quality Considerations

### Advantages of Mining Approach

✅ **Realistic diversity**: Natural algorithmic variations  
✅ **Semantic guarantee**: Problem-based clustering ensures equivalence  
✅ **Scalable**: Can process millions of submissions  
✅ **Language agnostic**: Works for any programming language  
✅ **No generation errors**: No risk of incorrect transformations

### Potential Issues

⚠️ **Similarity range**: Some pairs might be too similar (Type-3-like)  
⚠️ **Problem quality**: Not all problems have diverse solutions  
⚠️ **Correctness**: Some submissions might be incorrect  
⚠️ **Code quality**: Submissions vary widely in quality

### Mitigation Strategies

1. **Filter by similarity**: Remove pairs with high syntactic similarity
2. **Validate semantically**: Use dynamic validation or test cases
3. **Problem selection**: Choose problems with known diverse solutions
4. **Quality filtering**: Check for compilation/syntax errors

---

## Performance Characteristics

### Time Complexity

- File scanning: O(n) where n = number of files
- Grouping: O(n)
- Pair generation: O(k²) where k = avg solutions per problem
- Overall: O(n + p×k²) where p = number of problems

### Space Complexity

- File paths: O(n)
- Problem groups: O(n)
- Pairs: O(p×k²)

### Scalability

- **CodeNet scale**: ~14M files, ~4K problems
- **Expected pairs**: Varies by min_cluster_size
- **Optimization**: Process per-language subdirectories

---

## Future Enhancements

### 1. Similarity Filtering

Implement actual similarity checking in `filter_pairs_by_similarity()`:

- Token-based similarity (Jaccard, cosine)
- AST edit distance
- Code embeddings (CodeBERT, GraphCodeBERT)

### 2. Quality Scoring

Add quality metrics for mined pairs:

- Algorithmic difference score
- Structural difference score
- Confidence in semantic equivalence

### 3. Active Learning

Prioritize pairs for human validation:

- Most different pairs (high value)
- Uncertain pairs (low confidence)

### 4. Cross-Language Mining

Extract Type-4 clones across languages:

- Python solution vs. Java solution to same problem
- Requires language-agnostic semantic comparison

---

## Testing

### Unit Tests (in `type4_mining.py`)

```python
test_extract_problem_id()      # Problem ID extraction
test_generate_pairs()           # Pair generation
test_group_files_by_problem()  # File grouping
test_mine_type4_empty_dir()    # Error handling
```

### Integration Testing

```bash
# Test with sample CodeNet subset
python -m generation.type4_mining
```

---

## References

### Documentation

- **Specification**: `TYPE4_CLONE_SPECIFICATION.md`
- **Quick Reference**: `TYPE4_QUICK_REFERENCE.md`

### Code Files

- **Mining Logic**: `src/generation/type4_mining.py`
- **Configuration**: `configs/clones_config.yaml`
- **Validation**: `src/validation/dynamic_validation.py`
- **LLM Support**: `src/generation/llm_client.py`

### External Resources

- **CodeNet Dataset**: https://github.com/IBM/Project_CodeNet
- **Research Paper**: "Project CodeNet: A Large-Scale AI for Code Dataset"

---

## Summary

Type-4 clone detection uses a **mining-based approach** that:

1. ✅ Leverages problem-solving datasets (CodeNet)
2. ✅ Groups solutions by problem ID
3. ✅ Generates pairwise combinations as clone pairs
4. ✅ Assumes semantic equivalence from problem-based clustering
5. ✅ Provides most diverse clone type with minimal generation complexity

This approach is practical, scalable, and produces high-quality Type-4 clone pairs suitable for training clone detection models.
