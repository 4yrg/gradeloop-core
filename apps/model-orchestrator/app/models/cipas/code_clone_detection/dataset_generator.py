#!/usr/bin/env python3
"""
ML-Ready Clone Dataset Generator.

This module generates pairwise clone-labeled datasets suitable for machine learning
training. Each pair is labeled with the highest applicable clone type (0-4).

Label Semantics:
    0: Non-clone (different semantic behavior)
    1: Type-1 (exact clones after normalization)
    2: Type-2 (renamed clones, same structure)
    3: Type-3 (similar with modifications)
    4: Type-4 (semantic equivalence, different structure)

Dataset Format (JSONL):
    {
        "id_a": "problem_id/submission_id",
        "id_b": "problem_id/submission_id",
        "code_a": "<normalized code>",
        "code_b": "<normalized code>",
        "label": 0-4
    }

Engineering Principles:
- Deterministic: Same inputs always produce same outputs
- No duplicates: Each pair appears once
- Highest type wins: T4 > T3 > T2 > T1 for conflicting labels
- Controlled negatives: Sample non-clones from same problem (different logic)
- Balanced classes: Optional balancing to prevent label imbalance
"""

import logging
import random
from pathlib import Path
from typing import Dict, List, Tuple, Set, Optional
from collections import defaultdict, Counter

from utils import (
    PathManager,
    MetadataLoader,
    FileIDParser,
    ClonePairDeduplicator,
    save_jsonl,
    ensure_dir
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class NegativeSampler:
    """
    Generates negative (non-clone) pairs using controlled sampling.
    
    Strategy:
    1. Sample from same problem (students solving same problem differently)
    2. Exclude pairs already labeled as clones
    3. Use deterministic sampling (fixed seed)
    """
    
    def __init__(self, seed: int = 42):
        """
        Initialize negative sampler.
        
        Args:
            seed: Random seed for deterministic sampling
        """
        self.seed = seed
        random.seed(seed)
    
    def sample_negatives(
        self,
        submissions_by_problem: Dict[str, List[str]],
        positive_pairs: Set[Tuple[str, str]],
        num_negatives: int
    ) -> List[Tuple[str, str]]:
        """
        Sample negative pairs from same problems.
        
        Args:
            submissions_by_problem: Dict mapping problem_id to list of submission_ids
            positive_pairs: Set of pairs already labeled as clones
            num_negatives: Number of negative pairs to sample
        
        Returns:
            List of negative (non-clone) pairs
        """
        logger.info(f"Sampling {num_negatives} negative pairs...")
        
        negatives = []
        candidates = []
        
        # Generate candidate negative pairs from same problems
        for problem_id, submissions in submissions_by_problem.items():
            if len(submissions) < 2:
                continue
            
            # Generate all pairs within problem
            for i, sub1 in enumerate(submissions):
                for sub2 in submissions[i+1:]:
                    pair = ClonePairDeduplicator.normalize_pair(
                        f"{problem_id}/{sub1}",
                        f"{problem_id}/{sub2}"
                    )
                    
                    # Only include if not already a positive
                    if pair not in positive_pairs:
                        candidates.append(pair)
        
        logger.info(f"Found {len(candidates)} candidate negative pairs")
        
        # Sample requested number
        if len(candidates) <= num_negatives:
            negatives = candidates
        else:
            negatives = random.sample(candidates, num_negatives)
        
        logger.info(f"Sampled {len(negatives)} negative pairs")
        
        return negatives


class DatasetGenerator:
    """
    Main dataset generator for ML-ready clone datasets.
    
    Generates pairwise datasets with clone labels (0-4) and normalized code.
    """
    
    def __init__(
        self,
        base_dir: Path,
        language: str = "java",
        negative_ratio: float = 1.0,
        seed: int = 42
    ):
        """
        Initialize dataset generator.
        
        Args:
            base_dir: Root directory of clone detection project
            language: Programming language (default: 'java')
            negative_ratio: Ratio of negatives to positives (default: 1.0 = balanced)
            seed: Random seed for reproducibility
        """
        self.base_dir = Path(base_dir)
        self.language = language
        self.negative_ratio = negative_ratio
        self.seed = seed
        
        # Initialize utilities
        self.paths = PathManager(base_dir)
        self.loader = MetadataLoader(self.paths)
        self.negative_sampler = NegativeSampler(seed)
        
        # Storage
        self.metadata = []
        self.submissions_by_problem = defaultdict(list)
        self.clone_pairs = {}  # (id1, id2) -> label
    
    def load_metadata(self) -> None:
        """
        Load CodeNet metadata and organize by problem.
        """
        logger.info("Loading CodeNet metadata...")
        self.metadata = self.loader.load_codenet_index()
        
        # Organize submissions by problem
        for entry in self.metadata:
            if entry['language'] == self.language:
                problem_id = entry['problem_id']
                submission_id = entry['submission_id']
                self.submissions_by_problem[problem_id].append(submission_id)
        
        logger.info(f"Loaded {len(self.metadata)} submissions")
        logger.info(f"Found {len(self.submissions_by_problem)} problems")
    
    def load_clone_pairs(self) -> None:
        """
        Load all clone pairs and deduplicate with highest type wins.
        """
        logger.info("Loading clone pairs...")
        
        # Load each type
        t1_pairs = self.loader.load_clone_pairs('t1')
        t2_pairs = self.loader.load_clone_pairs('t2')
        t3_pairs = self.loader.load_clone_pairs('t3')
        t4_pairs = self.loader.load_clone_pairs('t4')
        
        logger.info(f"Loaded T1: {len(t1_pairs)}, T2: {len(t2_pairs)}, "
                   f"T3: {len(t3_pairs)}, T4: {len(t4_pairs)} pairs")
        
        # Deduplicate and assign highest type
        self.clone_pairs = ClonePairDeduplicator.deduplicate(
            t1_pairs, t2_pairs, t3_pairs, t4_pairs
        )
        
        logger.info(f"Total unique clone pairs: {len(self.clone_pairs)}")
        
        # Log label distribution
        label_counts = Counter(self.clone_pairs.values())
        for label in sorted(label_counts.keys()):
            logger.info(f"  Type-{label}: {label_counts[label]} pairs")
    
    def generate_negative_pairs(self) -> List[Tuple[str, str]]:
        """
        Generate negative (non-clone) pairs.
        
        Returns:
            List of negative pairs
        """
        num_positives = len(self.clone_pairs)
        num_negatives = int(num_positives * self.negative_ratio)
        
        logger.info(f"Generating negatives (ratio: {self.negative_ratio})...")
        logger.info(f"Positives: {num_positives}, Target negatives: {num_negatives}")
        
        # Convert clone pairs to set for fast lookup
        positive_set = set(self.clone_pairs.keys())
        
        # Sample negatives
        negatives = self.negative_sampler.sample_negatives(
            self.submissions_by_problem,
            positive_set,
            num_negatives
        )
        
        return negatives
    
    def create_dataset(self) -> List[Dict]:
        """
        Create complete dataset with code and labels.
        
        Returns:
            List of dataset entries
        """
        logger.info("Creating dataset...")
        
        dataset = []
        
        # Add positive pairs (clones)
        for (id_a, id_b), label in self.clone_pairs.items():
            # Parse IDs
            problem_a, submission_a, _ = FileIDParser.parse(id_a)
            problem_b, submission_b, _ = FileIDParser.parse(id_b)
            
            # Load code
            code_a = self.loader.load_normalized_code(self.language, problem_a, submission_a)
            code_b = self.loader.load_normalized_code(self.language, problem_b, submission_b)
            
            # Skip if code not found
            if code_a is None or code_b is None:
                logger.warning(f"Code not found for pair: {id_a}, {id_b}")
                continue
            
            dataset.append({
                'id_a': id_a,
                'id_b': id_b,
                'code_a': code_a,
                'code_b': code_b,
                'label': label
            })
        
        logger.info(f"Added {len(dataset)} positive pairs")
        
        # Add negative pairs (non-clones)
        negative_pairs = self.generate_negative_pairs()
        
        for id_a, id_b in negative_pairs:
            # Parse IDs
            problem_a, submission_a, _ = FileIDParser.parse(id_a)
            problem_b, submission_b, _ = FileIDParser.parse(id_b)
            
            # Load code
            code_a = self.loader.load_normalized_code(self.language, problem_a, submission_a)
            code_b = self.loader.load_normalized_code(self.language, problem_b, submission_b)
            
            # Skip if code not found
            if code_a is None or code_b is None:
                continue
            
            dataset.append({
                'id_a': id_a,
                'id_b': id_b,
                'code_a': code_a,
                'code_b': code_b,
                'label': 0  # Non-clone
            })
        
        logger.info(f"Added {len(negative_pairs)} negative pairs")
        logger.info(f"Total dataset size: {len(dataset)}")
        
        # Shuffle dataset for randomness
        random.seed(self.seed)
        random.shuffle(dataset)
        
        return dataset
    
    def save_dataset(self, dataset: List[Dict]) -> None:
        """
        Save dataset to JSONL file.
        
        Args:
            dataset: List of dataset entries
        """
        output_path = self.paths.get_dataset_path(self.language)
        ensure_dir(output_path.parent)
        
        logger.info(f"Saving dataset to {output_path}...")
        save_jsonl(dataset, output_path)
        logger.info(f"Dataset saved successfully")
        
        # Print statistics
        self._print_statistics(dataset)
    
    def _print_statistics(self, dataset: List[Dict]) -> None:
        """
        Print dataset statistics.
        
        Args:
            dataset: List of dataset entries
        """
        label_counts = Counter([entry['label'] for entry in dataset])
        
        logger.info("\n" + "="*60)
        logger.info("DATASET STATISTICS")
        logger.info("="*60)
        logger.info(f"Total pairs: {len(dataset)}")
        logger.info(f"\nLabel distribution:")
        
        label_names = {
            0: "Non-clone",
            1: "Type-1 (Exact)",
            2: "Type-2 (Renamed)",
            3: "Type-3 (Similar)",
            4: "Type-4 (Semantic)"
        }
        
        for label in sorted(label_counts.keys()):
            count = label_counts[label]
            percentage = (count / len(dataset)) * 100
            name = label_names.get(label, f"Unknown-{label}")
            logger.info(f"  {name}: {count} ({percentage:.1f}%)")
        
        logger.info("="*60)
    
    def run(self) -> None:
        """
        Execute complete dataset generation pipeline.
        """
        logger.info("="*60)
        logger.info("ML DATASET GENERATOR")
        logger.info("="*60)
        logger.info(f"Language: {self.language}")
        logger.info(f"Negative ratio: {self.negative_ratio}")
        logger.info(f"Random seed: {self.seed}")
        logger.info("="*60)
        
        # Load data
        self.load_metadata()
        self.load_clone_pairs()
        
        # Generate dataset
        dataset = self.create_dataset()
        
        # Save dataset
        self.save_dataset(dataset)
        
        logger.info("\nDataset generation completed successfully!")


def main():
    """Main entry point for dataset generation."""
    import argparse
    
    parser = argparse.ArgumentParser(
        description="Generate ML-ready clone detection dataset"
    )
    parser.add_argument(
        '--language',
        type=str,
        default='java',
        help='Programming language (default: java)'
    )
    parser.add_argument(
        '--negative-ratio',
        type=float,
        default=1.0,
        help='Ratio of negatives to positives (default: 1.0)'
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
    
    # Initialize and run generator
    generator = DatasetGenerator(
        base_dir=base_dir,
        language=args.language,
        negative_ratio=args.negative_ratio,
        seed=args.seed
    )
    
    generator.run()


if __name__ == '__main__':
    main()
