"""
Example: Hard Negative Generation for Code Clone Detection

This example demonstrates how to use the textual and structural hard
negative generators to create challenging negative pairs for training
code clone detection models.

Hard negatives are pairs that appear similar but are functionally different,
designed to challenge naive similarity models:
- Textual hard negatives: High lexical/token similarity
- Structural hard negatives: High AST/structural similarity
"""

import sys
from pathlib import Path

# Add src to path
sys.path.insert(0, str(Path(__file__).parent / "src"))

from negatives.textual_hard_neg import (
    generate_textual_hard_negatives_with_stats,
)
from negatives.structural_hard_neg import (
    generate_structural_hard_negatives_with_stats,
)


def main():
    """Run hard negative generation examples."""
    
    # Sample dataset: code files from different problems
    # In practice, these would come from a larger dataset
    sample_files = [
        # Problem 1: Sum of array
        ("prob_001_sub_1.py", """def calculate_sum(numbers):
    total = 0
    for num in numbers:
        total = total + num
    return total
""", "python"),
        
        # Problem 2: Product of array (similar structure, different operation)
        ("prob_002_sub_1.py", """def calculate_product(numbers):
    result = 1
    for num in numbers:
        result = result * num
    return result
""", "python"),
        
        # Problem 3: Find maximum (similar structure)
        ("prob_003_sub_1.py", """def find_maximum(values):
    max_val = values[0]
    for val in values:
        if val > max_val:
            max_val = val
    return max_val
""", "python"),
        
        # Problem 4: Find minimum (similar to problem 3)
        ("prob_004_sub_1.py", """def find_minimum(values):
    min_val = values[0]
    for val in values:
        if val < min_val:
            min_val = val
    return min_val
""", "python"),
        
        # Problem 5: Binary search
        ("prob_005_sub_1.py", """def binary_search(arr, target):
    left = 0
    right = len(arr) - 1
    while left <= right:
        mid = (left + right) // 2
        if arr[mid] == target:
            return mid
        elif arr[mid] < target:
            left = mid + 1
        else:
            right = mid - 1
    return -1
""", "python"),
        
        # Problem 6: Linear search (different algorithm)
        ("prob_006_sub_1.py", """def linear_search(arr, target):
    for i in range(len(arr)):
        if arr[i] == target:
            return i
    return -1
""", "python"),
    ]
    
    print("="*70)
    print("HARD NEGATIVE GENERATION DEMO")
    print("="*70)
    print()
    
    # ========================================================================
    # 1. Generate Textual Hard Negatives
    # ========================================================================
    print("1. TEXTUAL HARD NEGATIVES")
    print("-" * 70)
    print("Goal: Find pairs with high lexical/token similarity but different")
    print("      functionality (e.g., sum vs product, max vs min)")
    print()
    
    textual_pairs, textual_stats = generate_textual_hard_negatives_with_stats(
        sample_files,
        max_pairs=10,
        seed=42,
        min_jaccard=0.4  # Require at least 40% token overlap
    )
    
    print(f"Generated {len(textual_pairs)} textual hard negative pairs")
    print()
    print("Statistics:")
    for key, value in textual_stats.items():
        print(f"  {key}: {value}")
    print()
    
    if textual_pairs:
        print("Example textual hard negative pair:")
        pair = textual_pairs[0]
        print(f"  File A: {pair['file_a_id']}")
        print(f"  File B: {pair['file_b_id']}")
        print(f"  Similarity: {pair['generation_meta']['similarity_score']:.3f}")
        print(f"  Type: {pair['type']}")
        print()
        print("  Code A:")
        print("  " + "\n  ".join(pair['code_a'].strip().split('\n')))
        print()
        print("  Code B:")
        print("  " + "\n  ".join(pair['code_b'].strip().split('\n')))
        print()
    
    # ========================================================================
    # 2. Generate Structural Hard Negatives
    # ========================================================================
    print()
    print("="*70)
    print("2. STRUCTURAL HARD NEGATIVES")
    print("-" * 70)
    print("Goal: Find pairs with high AST/structural similarity but different")
    print("      semantics (e.g., similar control flow, different operators)")
    print()
    
    structural_pairs, structural_stats = generate_structural_hard_negatives_with_stats(
        sample_files,
        max_pairs=10,
        seed=42,
        min_structural_similarity=0.7  # Require at least 70% structural match
    )
    
    print(f"Generated {len(structural_pairs)} structural hard negative pairs")
    print()
    print("Statistics:")
    for key, value in structural_stats.items():
        print(f"  {key}: {value}")
    print()
    
    if structural_pairs:
        print("Example structural hard negative pair:")
        pair = structural_pairs[0]
        print(f"  File A: {pair['file_a_id']}")
        print(f"  File B: {pair['file_b_id']}")
        print(f"  Similarity: {pair['generation_meta']['similarity_score']:.3f}")
        print(f"  Type: {pair['type']}")
        print()
        print("  Code A:")
        print("  " + "\n  ".join(pair['code_a'].strip().split('\n')))
        print()
        print("  Code B:")
        print("  " + "\n  ".join(pair['code_b'].strip().split('\n')))
        print()
    
    # ========================================================================
    # 3. Combined Analysis
    # ========================================================================
    print()
    print("="*70)
    print("3. COMBINED ANALYSIS")
    print("-" * 70)
    
    total_pairs = len(textual_pairs) + len(structural_pairs)
    print(f"Total hard negatives generated: {total_pairs}")
    print(f"  - Textual hard negatives: {len(textual_pairs)}")
    print(f"  - Structural hard negatives: {len(structural_pairs)}")
    print()
    
    # Analyze coverage
    all_file_ids = set()
    for pair in textual_pairs + structural_pairs:
        all_file_ids.add(pair['file_a_id'])
        all_file_ids.add(pair['file_b_id'])
    
    print(f"Files covered in hard negatives: {len(all_file_ids)}/{len(sample_files)}")
    print()
    
    # ========================================================================
    # 4. Usage in Training Pipeline
    # ========================================================================
    print("="*70)
    print("4. INTEGRATION WITH TRAINING PIPELINE")
    print("-" * 70)
    print("""
The generated hard negatives can be integrated into your training pipeline:

1. Combine with easy negatives (from src/negatives/easy_negatives.py)
2. Balance with positive examples (Type-1 to Type-4 clones)
3. Export to Parquet (using src/export/to_parquet.py)
4. Use for contrastive learning or hard negative mining

Example:
    from negatives.easy_negatives import sample_easy_negatives
    from balancing.sampler import balance_and_sample
    from export.to_parquet import export_pairs
    
    # Combine different negative types
    all_negatives = textual_pairs + structural_pairs + easy_negatives
    
    # Balance with positives
    balanced_dataset = balance_and_sample(
        positives + all_negatives,
        config=config,
        seed=42
    )
    
    # Export
    export_pairs(balanced_dataset, "dataset.parquet")

Benefits of hard negatives:
- Improve model discrimination between similar-looking non-clones
- Reduce false positive rate on challenging cases
- Better generalization to real-world code variations
""")
    print()


if __name__ == "__main__":
    main()
