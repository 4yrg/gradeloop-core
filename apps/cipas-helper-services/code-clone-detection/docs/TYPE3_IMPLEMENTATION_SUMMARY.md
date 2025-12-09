# Type-3 Clone Implementation Summary

## Overview

This document summarizes the implementation of Type-3 clone generation in the code clone detection system. Type-3 clones represent code fragments that are **mostly similar** with **recognizable core logic**, but include statement-level modifications beyond simple identifier renaming.

## What Changed

### 1. Updated `ollama_client.py`

**File**: `src/generation/ollama_client.py`

**Changes**: Enhanced the `generate_from_summary()` method with comprehensive Type-3 transformation instructions.

**Key Additions**:

- Detailed Type-3 transformation requirements in system prompt
- Explicit constraints to keep implementations "mostly similar"
- Instructions to apply specific transformations:
  - Identifier renaming
  - Literal changes
  - Adding/removing statements
  - Small control flow modifications
  - Data type changes
  - Statement reordering
  - Helper operations
- Clear boundaries to prevent Type-4 generation (complete rewrites)

**Before**:

```python
system_prompt = (
    f"You are a code generation assistant. Generate clean, idiomatic {lang} "
    f"code based on functional descriptions. Generate ONLY ONE complete function. "
    f"Create a DIFFERENT implementation than the typical approach..."
)
```

**After**:

```python
system_prompt = (
    f"You are a code generation assistant specialized in creating Type-3 code clones. "
    f"Generate clean, idiomatic {lang} code based on functional descriptions. "
    f"Generate ONLY ONE complete function.\n\n"
    f"Type-3 Clone Requirements:\n"
    f"- KEEP the core logic recognizable and aligned with the description\n"
    f"- Apply these modifications (Type-3 transformations):\n"
    f"  * Use DIFFERENT identifier names (variables, functions)\n"
    f"  * Change literal values where appropriate\n"
    f"  * Add extra lines (validation checks, logging, intermediate steps)\n"
    # ... [complete detailed instructions]
)
```

### 2. Created `TYPE3_CLONE_SPECIFICATION.md`

**File**: `docs/TYPE3_CLONE_SPECIFICATION.md`

**Purpose**: Comprehensive specification document for Type-3 clones.

**Contents**:

- Complete definition of Type-3 clones
- All 8 allowed transformation categories with examples
- Critical requirements and constraints
- Comparison with other clone types
- Detection challenges
- Best practices for generation
- Validation criteria
- Python and Java examples

**Key Sections**:

1. Overview and Definition
2. Allowed Transformations (8 categories)
3. Critical Requirements (✅ Must Hold / ❌ Must NOT)
4. Language-specific Examples
5. Comparison Table (Type-1 through Type-4)
6. Validation Criteria

### 3. Updated `type3_backtranslate.py`

**File**: `src/generation/type3_backtranslate.py`

**Changes**: Enhanced module and function documentation.

**Additions**:

- Detailed Type-3 transformation list in module docstring
- Critical requirements emphasized
- Updated `produce_type3()` function documentation
- Added references to specification document
- Cross-references to ollama_client.py

## Type-3 Transformation Categories

The implementation now explicitly handles these 8 transformation types:

### 1. **Identifier Renaming** (Type-2 inherited)

- Variables, functions, parameters, classes

### 2. **Literal Changes**

- Constants, strings, numeric values, defaults

### 3. **Formatting and Comments**

- Indentation, comments, line breaks, whitespace

### 4. **Data Type Modifications**

- Compatible type changes (int ↔ float, list ↔ tuple)
- Type annotations

### 5. **Adding or Removing Statements**

- **Extra lines**: Validation, logging, debugging
- **Missing lines**: Removing non-essential operations
- **Added checks**: Input validation, boundary checks, error handling

### 6. **Small Helper Operations**

- Additional computation steps
- Intermediate processing
- Data transformations

### 7. **Reordering Closely Related Statements**

- Swapping independent operations
- Reordering variable declarations (where safe)

### 8. **Small Changes in Control Flow**

- **Extra if guards**: Additional conditionals, guard clauses
- **Additional logging**: Debug statements, progress tracking
- **Added computation steps**: Breaking expressions into steps

## Critical Constraints

The implementation enforces these boundaries:

### ✅ Must Be True

1. **Mostly Similar**: Code fragments must be mostly similar
2. **Core Logic Recognizable**: Main operations still identifiable
3. **Aligned Implementation**: Same general approach preserved

### ❌ Must NOT Occur (Type-4 Territory)

1. **Complete Rewrite**: Entirely different algorithms
2. **Different Paradigms**: Fundamental approach changes
3. **Major Restructuring**: Complete reorganization
4. **Unrecognizable**: Cannot identify original logic

## Example Transformation

### Original Code

```python
def find_maximum(numbers):
    max_val = numbers[0]
    for num in numbers:
        if num > max_val:
            max_val = num
    return max_val
```

### Type-3 Clone (Generated)

```python
def get_largest_value(values):
    """Find the largest value in a collection."""
    # Validate input
    if not values:
        raise ValueError("Empty collection")

    # Initialize with first element
    largest = values[0]

    # Track comparison count
    comparisons = 0

    # Iterate through remaining elements
    for current_value in values[1:]:
        comparisons += 1
        if current_value > largest:
            largest = current_value

    # Log statistics
    print(f"Found largest after {comparisons} comparisons")

    return largest
```

### Applied Transformations

- ✅ Identifier renaming (`max_val` → `largest`, `numbers` → `values`)
- ✅ Added validation check (empty collection)
- ✅ Added computation (comparison counter)
- ✅ Added logging (statistics output)
- ✅ Added comments (documentation)
- ✅ Modified loop (skip first element)
- ✅ **Core logic still recognizable**: Linear search for maximum value ✓

## LLM Prompt Strategy

The updated implementation uses a two-level prompt strategy:

### System Prompt

- Defines the assistant's role as Type-3 clone generator
- Lists all allowed transformations
- Emphasizes constraints (mostly similar, recognizable core)
- Specifies output format requirements

### User Prompt

- Provides the functional summary
- Reinforces Type-3 transformation requirements
- Reminds to keep core logic recognizable

## Files Modified

1. **`src/generation/ollama_client.py`**

   - Updated `generate_from_summary()` method
   - Enhanced system prompt with Type-3 specifications
   - Added explicit transformation instructions

2. **`src/generation/type3_backtranslate.py`**

   - Enhanced module docstring
   - Updated `produce_type3()` documentation
   - Added references to specification

3. **`docs/TYPE3_CLONE_SPECIFICATION.md`** (NEW)
   - Comprehensive Type-3 specification
   - All transformation categories with examples
   - Validation criteria and requirements

## Testing Recommendations

To validate the Type-3 generation:

1. **Test Transformation Coverage**

   - Generate clones for various code samples
   - Verify each transformation type appears
   - Check that multiple transformations are combined

2. **Test Similarity Constraint**

   - Compare generated clones with originals
   - Verify core logic is recognizable
   - Ensure not Type-4 (complete rewrites)

3. **Test Functional Equivalence**

   - Run both original and clone with same inputs
   - Verify outputs match (or are semantically equivalent)
   - Handle edge cases consistently

4. **Test Language Coverage**
   - Validate Python generation
   - Validate Java generation
   - Test other supported languages

## Integration Points

The Type-3 generation integrates with:

1. **Pipeline Configuration** (`configs/pipeline_config.yaml`)

   - Type-3 generation stage settings
   - LLM model selection

2. **Model Configuration** (`configs/models.yaml`)

   - Ollama configuration
   - Model parameters (temperature, tokens)

3. **Clone Detector** (`src/clone_detector.py`)

   - Uses Type-3 generation for dataset creation
   - Validates Type-3 characteristics

4. **Dataset Generation** (`notebooks/generate_dataset_codenet.ipynb`)
   - Creates Type-3 clone pairs
   - Exports to training datasets

## Best Practices

When using Type-3 generation:

1. **Start with Good Code**: Use clean, well-structured original code
2. **Monitor Output**: Check generated clones maintain functional equivalence
3. **Validate Type**: Ensure clones are Type-3 (not Type-2 or Type-4)
4. **Adjust Temperature**: Lower temperature (0.1-0.3) for more controlled generation
5. **Review Manually**: Sample check generated clones for quality

## Future Enhancements

Potential improvements:

1. **Configurable Transformations**: Allow selection of specific transformation types
2. **Transformation Intensity**: Control how many transformations to apply
3. **Validation Checks**: Automated Type-3 compliance checking
4. **Diversity Metrics**: Measure structural diversity of clones
5. **Multi-step Generation**: Iteratively apply transformations

## References

- **Specification**: `docs/TYPE3_CLONE_SPECIFICATION.md`
- **Implementation**: `src/generation/type3_backtranslate.py`
- **LLM Client**: `src/generation/ollama_client.py`
- **Type-2 Spec**: `docs/TYPE2_CLONE_SPECIFICATION.md`
- **Type-1 Rules**: `docs/TYPE1_CLONE_RULES.md`

## Version History

- **v1.0** (2025-01-09): Initial Type-3 implementation enhancement
  - Updated Ollama client with comprehensive Type-3 prompts
  - Created detailed specification document
  - Enhanced code documentation
  - Defined 8 transformation categories
  - Established clear Type-3/Type-4 boundaries

---

**Status**: ✅ Implementation Complete
**Last Updated**: December 9, 2025
**Next Steps**: Testing and validation with real code samples
