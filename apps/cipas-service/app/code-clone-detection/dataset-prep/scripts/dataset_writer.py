#!/usr/bin/env python3
"""
Dataset Writer for Code Clone Detection

This module provides functionality to generate and write balanced code clone
datasets to JSONL files. It supports train/validation/test splits with proper
data leakage prevention.
"""

import argparse
import jsonlines
from pathlib import Path
from typing import Dict, List
from tqdm import tqdm

from .parser import PolyglotParser
from .clone_generators import sample_clone_pairs
from .indexer import build_master_index
from .config import (
    CODENET_ROOT, OUTPUT_DIR, LANGUAGES, TARGET_PAIRS,
    SPLIT_RATIOS, validate_paths, get_output_path, print_config
)


def write_split_dataset(
    master_index: Dict[str, Dict[str, List[str]]],
    parser: PolyglotParser,
    codenet_root: str,
    split: str,
    target_pairs: int
) -> int:
    """
    Generate and write dataset for a specific split.

    Args:
        master_index: Master index of problems and submissions
        parser: PolyglotParser instance
        codenet_root: Path to CodeNet dataset root
        split: Split name ('train', 'val', or 'test')
        target_pairs: Number of pairs to generate for this split

    Returns:
        Number of pairs actually written

    Raises:
        Exception: If dataset generation fails
    """
    output_path = get_output_path(f"{split}.jsonl")

    print(f"\nGenerating {target_pairs:,} pairs for {split} split...")
    print(f"Output file: {output_path}")

    pairs_written = 0

    with jsonlines.open(output_path, mode='w') as writer:
        pbar = tqdm(
            total=target_pairs,
            desc=f"Writing {split} pairs",
            unit="pairs"
        )

        try:
            for pair in sample_clone_pairs(
                master_index=master_index,
                parser=parser,
                codenet_root=codenet_root,
                target_pairs=target_pairs,
                split=split
            ):
                writer.write(pair)
                pairs_written += 1
                pbar.update(1)

                if pairs_written >= target_pairs:
                    break

        except Exception as e:
            print(f"\nError generating pairs: {e}")
            raise
        finally:
            pbar.close()

    print(f"Successfully wrote {pairs_written:,} pairs to {output_path}")
    return pairs_written


def calculate_split_targets(total_target: int) -> Dict[str, int]:
    """
    Calculate target pairs for each split based on configured ratios.

    Args:
        total_target: Total number of pairs to generate across all splits

    Returns:
        Dictionary mapping split names to target pair counts
    """
    targets = {}
    for split, ratio in SPLIT_RATIOS.items():
        targets[split] = int(total_target * ratio)

    return targets


def generate_dataset(
    codenet_root: str = None,
    output_dir: str = None,
    languages: List[str] = None,
    target_pairs: int = None,
    splits: List[str] = None
) -> Dict[str, int]:
    """
    Main function to generate code clone detection datasets.

    Args:
        codenet_root: Path to CodeNet dataset (defaults to config)
        output_dir: Output directory (defaults to config)
        languages: List of languages to process (defaults to config)
        target_pairs: Total pairs to generate (defaults to config)
        splits: List of splits to generate (defaults to ['train', 'val', 'test'])

    Returns:
        Dictionary mapping split names to number of pairs written

    Raises:
        FileNotFoundError: If CodeNet dataset not found
        Exception: If dataset generation fails
    """
    # Use defaults from config
    codenet_root = codenet_root or CODENET_ROOT
    languages = languages or LANGUAGES
    target_pairs = target_pairs or TARGET_PAIRS
    splits = splits or ['train', 'val', 'test']

    # Validate paths
    validate_paths()

    print("\n" + "=" * 80)
    print("CODE CLONE DATASET GENERATION")
    print("=" * 80)

    # Load master index
    print("\nStep 1: Loading master index...")
    master_index = build_master_index(
        codenet_root=codenet_root,
        languages=languages
    )
    print(f"Loaded master index with {len(master_index)} problems")

    # Initialize parser
    print("\nStep 2: Initializing PolyglotParser...")
    parser = PolyglotParser()
    print("Parser initialized successfully")

    # Calculate split targets
    print("\nStep 3: Calculating split targets...")
    if len(splits) == 1:
        split_targets = {splits[0]: target_pairs}
        print(f"Single split '{splits[0]}' allocated {target_pairs:,} pairs")
    else:
        split_targets = calculate_split_targets(target_pairs)
        for split, target in split_targets.items():
            if split in splits:
                print(f"  {split:6s}: {target:,} pairs ({SPLIT_RATIOS[split]:.0%})")

    # Generate datasets
    print("\nStep 4: Generating datasets...")
    results = {}

    for split in splits:
        try:
            count = write_split_dataset(
                master_index=master_index,
                parser=parser,
                codenet_root=codenet_root,
                split=split,
                target_pairs=split_targets[split]
            )
            results[split] = count
        except Exception as e:
            print(f"Error processing {split} split: {e}")
            results[split] = 0

    # Print summary
    print("\n" + "=" * 80)
    print("GENERATION COMPLETED")
    print("=" * 80)
    print("\nResults:")
    for split in splits:
        count = results.get(split, 0)
        status = "✓" if count > 0 else "✗"
        print(f"  {status} {split:6s}: {count:,} pairs")

    return results


def parse_arguments():
    """Parse command line arguments."""
    parser = argparse.ArgumentParser(
        description="Generate code clone detection dataset from Project CodeNet",
        formatter_class=argparse.ArgumentDefaultsHelpFormatter
    )

    parser.add_argument(
        "--codenet-root",
        type=str,
        default=CODENET_ROOT,
        help="Path to CodeNet dataset root directory"
    )

    parser.add_argument(
        "--output-dir",
        type=str,
        default=OUTPUT_DIR,
        help="Output directory for processed data"
    )

    parser.add_argument(
        "--target-pairs",
        type=int,
        default=TARGET_PAIRS,
        help="Total number of pairs to generate across all splits"
    )

    parser.add_argument(
        "--split",
        type=str,
        choices=['train', 'val', 'test', 'all'],
        default='all',
        help="Which split to generate (default: all splits)"
    )

    parser.add_argument(
        "--languages",
        nargs='+',
        default=LANGUAGES,
        help="Programming languages to include"
    )

    return parser.parse_args()


def main():
    """CLI entry point for dataset generation."""
    args = parse_arguments()

    # Print configuration
    print_config()

    # Determine splits to generate
    if args.split == 'all':
        splits = ['train', 'val', 'test']
    else:
        splits = [args.split]

    # Generate datasets
    try:
        results = generate_dataset(
            codenet_root=args.codenet_root,
            languages=args.languages,
            target_pairs=args.target_pairs,
            splits=splits
        )

        # Exit with success if at least one split was generated
        if any(count > 0 for count in results.values()):
            return 0
        else:
            print("\nError: No datasets were generated successfully")
            return 1

    except Exception as e:
        print(f"\nFatal error: {e}")
        import traceback
        traceback.print_exc()
        return 1


if __name__ == "__main__":
    exit(main())

