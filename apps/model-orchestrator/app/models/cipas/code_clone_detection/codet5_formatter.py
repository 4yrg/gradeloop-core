#!/usr/bin/env python3
"""
CodeT5+ Dataset Formatter.

This module converts clone detection datasets into CodeT5+-compatible format
with proper train/validation/test splits.

CodeT5+ Format:
    {
        "input_ids": "<code_a>",
        "input_ids_2": "<code_b>",
        "labels": 0|1|2|3|4
    }

This format is directly compatible with:
- HuggingFace Datasets library
- HuggingFace Trainer API
- CodeT5+ fine-tuning scripts

Dataset Splits:
- Train: Used for model training (default: 70%)
- Validation: Used for hyperparameter tuning and early stopping (default: 15%)
- Test: Used for final evaluation (default: 15%)

Engineering Principles:
- Deterministic splitting (fixed seed)
- Stratified splitting (preserve label distribution across splits)
- Configurable split ratios
- Validation of data integrity
"""

import logging
import random
from pathlib import Path
from typing import Dict, List, Tuple
from collections import Counter, defaultdict

from utils import (
    PathManager,
    load_jsonl,
    save_jsonl,
    ensure_dir
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class StratifiedSplitter:
    """
    Performs stratified dataset splitting to preserve label distributions.
    
    Stratification ensures each split (train/val/test) has approximately
    the same distribution of labels as the original dataset. This is
    critical for:
    1. Preventing train/test distribution mismatch
    2. Ensuring all clone types are represented in each split
    3. Enabling fair evaluation across clone types
    """
    
    def __init__(self, seed: int = 42):
        """
        Initialize stratified splitter.
        
        Args:
            seed: Random seed for reproducibility
        """
        self.seed = seed
        random.seed(seed)
    
    def split(
        self,
        dataset: List[Dict],
        train_ratio: float = 0.7,
        val_ratio: float = 0.15,
        test_ratio: float = 0.15
    ) -> Tuple[List[Dict], List[Dict], List[Dict]]:
        """
        Perform stratified split of dataset.
        
        Args:
            dataset: List of dataset entries
            train_ratio: Proportion for training (default: 0.7)
            val_ratio: Proportion for validation (default: 0.15)
            test_ratio: Proportion for test (default: 0.15)
        
        Returns:
            Tuple of (train_data, val_data, test_data)
        """
        # Validate ratios
        assert abs(train_ratio + val_ratio + test_ratio - 1.0) < 1e-6, \
            "Split ratios must sum to 1.0"
        
        logger.info(f"Performing stratified split: train={train_ratio}, "
                   f"val={val_ratio}, test={test_ratio}")
        
        # Group by label
        by_label = defaultdict(list)
        for entry in dataset:
            by_label[entry['label']].append(entry)
        
        logger.info(f"Labels found: {sorted(by_label.keys())}")
        
        # Split each label group
        train_data = []
        val_data = []
        test_data = []
        
        for label, entries in by_label.items():
            # Shuffle entries for this label
            random.shuffle(entries)
            
            n = len(entries)
            n_train = int(n * train_ratio)
            n_val = int(n * val_ratio)
            
            # Split
            train_data.extend(entries[:n_train])
            val_data.extend(entries[n_train:n_train+n_val])
            test_data.extend(entries[n_train+n_val:])
            
            logger.info(f"  Label {label}: {n} total → "
                       f"{len(entries[:n_train])} train, "
                       f"{len(entries[n_train:n_train+n_val])} val, "
                       f"{len(entries[n_train+n_val:])} test")
        
        # Final shuffle of each split
        random.shuffle(train_data)
        random.shuffle(val_data)
        random.shuffle(test_data)
        
        logger.info(f"Split complete: {len(train_data)} train, "
                   f"{len(val_data)} val, {len(test_data)} test")
        
        return train_data, val_data, test_data


class CodeT5Formatter:
    """
    Main formatter for CodeT5+ datasets.
    
    Converts clone detection datasets to CodeT5+ format and creates
    train/val/test splits.
    """
    
    def __init__(
        self,
        base_dir: Path,
        language: str = "java",
        train_ratio: float = 0.7,
        val_ratio: float = 0.15,
        test_ratio: float = 0.15,
        seed: int = 42
    ):
        """
        Initialize CodeT5+ formatter.
        
        Args:
            base_dir: Root directory of clone detection project
            language: Programming language (default: 'java')
            train_ratio: Training set proportion (default: 0.7)
            val_ratio: Validation set proportion (default: 0.15)
            test_ratio: Test set proportion (default: 0.15)
            seed: Random seed for reproducibility
        """
        self.base_dir = Path(base_dir)
        self.language = language
        self.train_ratio = train_ratio
        self.val_ratio = val_ratio
        self.test_ratio = test_ratio
        self.seed = seed
        
        # Initialize utilities
        self.paths = PathManager(base_dir)
        self.splitter = StratifiedSplitter(seed)
    
    def load_dataset(self) -> List[Dict]:
        """
        Load ML dataset.
        
        Returns:
            List of dataset entries
        """
        dataset_path = self.paths.get_dataset_path(self.language)
        
        if not dataset_path.exists():
            raise FileNotFoundError(
                f"Dataset not found: {dataset_path}\n"
                f"Please run dataset_generator.py first."
            )
        
        logger.info(f"Loading dataset from {dataset_path}...")
        dataset = load_jsonl(dataset_path)
        logger.info(f"Loaded {len(dataset)} entries")
        
        return dataset
    
    def convert_to_codet5_format(self, dataset: List[Dict]) -> List[Dict]:
        """
        Convert dataset to CodeT5+ format.
        
        Args:
            dataset: Original dataset with id_a, id_b, code_a, code_b, label
        
        Returns:
            Dataset in CodeT5+ format with input_ids, input_ids_2, labels
        """
        logger.info("Converting to CodeT5+ format...")
        
        codet5_dataset = []
        
        for entry in dataset:
            # CodeT5+ uses 'input_ids' for first code snippet,
            # 'input_ids_2' for second code snippet,
            # and 'labels' for the clone type
            codet5_entry = {
                'input_ids': entry['code_a'],
                'input_ids_2': entry['code_b'],
                'labels': entry['label']
            }
            
            codet5_dataset.append(codet5_entry)
        
        logger.info(f"Converted {len(codet5_dataset)} entries")
        
        return codet5_dataset
    
    def create_splits(
        self,
        dataset: List[Dict]
    ) -> Tuple[List[Dict], List[Dict], List[Dict]]:
        """
        Create train/val/test splits.
        
        Args:
            dataset: Dataset to split
        
        Returns:
            Tuple of (train_data, val_data, test_data)
        """
        return self.splitter.split(
            dataset,
            self.train_ratio,
            self.val_ratio,
            self.test_ratio
        )
    
    def save_splits(
        self,
        train_data: List[Dict],
        val_data: List[Dict],
        test_data: List[Dict]
    ) -> None:
        """
        Save train/val/test splits to files.
        
        Args:
            train_data: Training data
            val_data: Validation data
            test_data: Test data
        """
        output_dir = self.paths.get_codet5_dir(self.language)
        ensure_dir(output_dir)
        
        # Save each split
        splits = {
            'train': train_data,
            'val': val_data,
            'test': test_data
        }
        
        for split_name, split_data in splits.items():
            output_path = output_dir / f"{split_name}.jsonl"
            logger.info(f"Saving {split_name} split to {output_path}...")
            save_jsonl(split_data, output_path)
            logger.info(f"Saved {len(split_data)} entries")
        
        logger.info(f"All splits saved to {output_dir}")
    
    def validate_splits(
        self,
        train_data: List[Dict],
        val_data: List[Dict],
        test_data: List[Dict]
    ) -> None:
        """
        Validate splits for data integrity and distribution.
        
        Args:
            train_data: Training data
            val_data: Validation data
            test_data: Test data
        """
        logger.info("\nValidating splits...")
        
        # Check no overlap
        train_pairs = set((e['input_ids'], e['input_ids_2']) for e in train_data)
        val_pairs = set((e['input_ids'], e['input_ids_2']) for e in val_data)
        test_pairs = set((e['input_ids'], e['input_ids_2']) for e in test_data)
        
        train_val_overlap = train_pairs & val_pairs
        train_test_overlap = train_pairs & test_pairs
        val_test_overlap = val_pairs & test_pairs
        
        if train_val_overlap or train_test_overlap or val_test_overlap:
            logger.warning(f"Split overlap detected!")
            logger.warning(f"  Train-Val: {len(train_val_overlap)} pairs")
            logger.warning(f"  Train-Test: {len(train_test_overlap)} pairs")
            logger.warning(f"  Val-Test: {len(val_test_overlap)} pairs")
        else:
            logger.info("✓ No overlap between splits")
        
        # Check label distributions
        train_labels = Counter([e['labels'] for e in train_data])
        val_labels = Counter([e['labels'] for e in val_data])
        test_labels = Counter([e['labels'] for e in test_data])
        
        logger.info("\nLabel distributions:")
        logger.info(f"  Train: {dict(train_labels)}")
        logger.info(f"  Val: {dict(val_labels)}")
        logger.info(f"  Test: {dict(test_labels)}")
        
        # Check all labels present in each split
        all_labels = set(train_labels.keys()) | set(val_labels.keys()) | set(test_labels.keys())
        for split_name, split_labels in [('Train', train_labels), ('Val', val_labels), ('Test', test_labels)]:
            missing = all_labels - set(split_labels.keys())
            if missing:
                logger.warning(f"  {split_name} missing labels: {missing}")
            else:
                logger.info(f"  ✓ {split_name} has all labels")
    
    def print_statistics(
        self,
        train_data: List[Dict],
        val_data: List[Dict],
        test_data: List[Dict]
    ) -> None:
        """
        Print dataset statistics.
        
        Args:
            train_data: Training data
            val_data: Validation data
            test_data: Test data
        """
        total = len(train_data) + len(val_data) + len(test_data)
        
        logger.info("\n" + "="*60)
        logger.info("CODET5+ DATASET STATISTICS")
        logger.info("="*60)
        logger.info(f"Total entries: {total}")
        logger.info(f"\nSplit sizes:")
        logger.info(f"  Train: {len(train_data)} ({len(train_data)/total*100:.1f}%)")
        logger.info(f"  Val: {len(val_data)} ({len(val_data)/total*100:.1f}%)")
        logger.info(f"  Test: {len(test_data)} ({len(test_data)/total*100:.1f}%)")
        
        logger.info(f"\nOutput directory:")
        logger.info(f"  {self.paths.get_codet5_dir(self.language)}")
        
        logger.info(f"\nFiles created:")
        logger.info(f"  train.jsonl")
        logger.info(f"  val.jsonl")
        logger.info(f"  test.jsonl")
        
        logger.info("="*60)
    
    def run(self) -> None:
        """
        Execute complete CodeT5+ formatting pipeline.
        """
        logger.info("="*60)
        logger.info("CODET5+ DATASET FORMATTER")
        logger.info("="*60)
        logger.info(f"Language: {self.language}")
        logger.info(f"Split ratios: train={self.train_ratio}, "
                   f"val={self.val_ratio}, test={self.test_ratio}")
        logger.info(f"Random seed: {self.seed}")
        logger.info("="*60)
        
        # Load dataset
        dataset = self.load_dataset()
        
        # Convert to CodeT5+ format
        codet5_dataset = self.convert_to_codet5_format(dataset)
        
        # Create splits
        train_data, val_data, test_data = self.create_splits(codet5_dataset)
        
        # Validate splits
        self.validate_splits(train_data, val_data, test_data)
        
        # Save splits
        self.save_splits(train_data, val_data, test_data)
        
        # Print statistics
        self.print_statistics(train_data, val_data, test_data)
        
        logger.info("\nCodeT5+ formatting completed successfully!")


def main():
    """Main entry point for CodeT5+ formatting."""
    import argparse
    
    parser = argparse.ArgumentParser(
        description="Format clone detection dataset for CodeT5+"
    )
    parser.add_argument(
        '--language',
        type=str,
        default='java',
        help='Programming language (default: java)'
    )
    parser.add_argument(
        '--train-ratio',
        type=float,
        default=0.7,
        help='Training set proportion (default: 0.7)'
    )
    parser.add_argument(
        '--val-ratio',
        type=float,
        default=0.15,
        help='Validation set proportion (default: 0.15)'
    )
    parser.add_argument(
        '--test-ratio',
        type=float,
        default=0.15,
        help='Test set proportion (default: 0.15)'
    )
    parser.add_argument(
        '--seed',
        type=int,
        default=42,
        help='Random seed for reproducibility (default: 42)'
    )
    
    args = parser.parse_args()
    
    # Determine base directory
    script_path = Path(__file__).resolve()
    base_dir = script_path.parent
    
    # Initialize and run formatter
    formatter = CodeT5Formatter(
        base_dir=base_dir,
        language=args.language,
        train_ratio=args.train_ratio,
        val_ratio=args.val_ratio,
        test_ratio=args.test_ratio,
        seed=args.seed
    )
    
    formatter.run()


if __name__ == '__main__':
    main()
