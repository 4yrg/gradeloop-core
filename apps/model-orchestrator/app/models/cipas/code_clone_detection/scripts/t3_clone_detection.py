#!/usr/bin/env python3
"""
Type-3 Clone Detection using AST Similarity.

This module implements Type-3 clone detection by computing structural similarity
between Abstract Syntax Trees (ASTs) using tree edit distance.

Type-3 Clone Definition:
------------------------
Type-3 clones are code fragments that are similar but have been modified with:
- Statement insertions/deletions
- Minor changes in control flow
- Different variable names (already handled in normalization)

Detection Criteria:
- T1 == False (not exact clones)
- T2 == False (not purely renamed clones)
- AST Similarity ≥ threshold (configurable, default 0.7)

Why AST Similarity Captures Type-3 Clones:
------------------------------------------
1. **Structural Focus**: ASTs represent code structure, not syntax details
   - Whitespace, comments already removed
   - Focus on program semantics
   
2. **Handles Modifications**: Tree edit distance naturally models:
   - Node insertions (added statements)
   - Node deletions (removed statements)
   - Node replacements (changed operations)
   
3. **Quantifiable Similarity**: Unlike binary clone detection, provides a 
   similarity score that can be tuned based on project requirements
   
4. **Language-Agnostic**: Works with any tree structure, easily extensible
   to other programming languages

Algorithm Efficiency:
---------------------
- Full N² comparison: O(N² * TED_cost) where N = number of files
- TED_cost: O(n1 * n2 * d1 * d2) for trees with n nodes and depth d
- Optimization: Skip comparisons where T1=True or T2=True (already detected)

For 10k files with avg 1000 AST nodes each:
- Worst case: 10k * 10k * (1000 * 1000) = 100B operations (impractical)
- With T1/T2 filtering: Reduces comparisons by ~60-80% typically
- With problem-level grouping: Further reduces comparisons by ~50%

Optimization Strategies Applied:
1. Only compare within same problem_id (students solving same problem)
2. Skip pairs already marked as T1 or T2 clones
3. Cache AST loading (avoid redundant file I/O)
4. Early termination on very dissimilar ASTs (size difference > threshold)
"""

import json
import csv
from pathlib import Path
from typing import Dict, List, Tuple, Set, Optional
from collections import defaultdict
import logging
from dataclasses import dataclass
from concurrent.futures import ProcessPoolExecutor, as_completed
from tqdm import tqdm

from tree_edit_distance import TreeEditDistance

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@dataclass
class T3Config:
    """Configuration for T3 clone detection."""
    similarity_threshold: float = 0.7  # Minimum similarity to be considered a clone
    max_size_ratio: float = 3.0  # Skip comparison if size ratio > this value
    insert_cost: float = 1.0
    delete_cost: float = 1.0
    rename_cost: float = 1.0
    enable_problem_grouping: bool = True  # Only compare within same problem
    enable_parallel: bool = True
    max_workers: Optional[int] = None  # None = use all CPUs


@dataclass
class FileMetadata:
    """Metadata for a single file."""
    file_id: str  # problem_id/submission_id
    problem_id: str
    submission_id: str
    ast_path: Path
    ast_size: int  # Number of nodes
    is_t1_clone: bool = False
    is_t2_clone: bool = False


class T3CloneDetector:
    """
    Type-3 Clone Detector using AST Similarity.
    
    This class orchestrates the entire T3 detection pipeline:
    1. Load AST metadata and filter out T1/T2 clones
    2. Group files by problem_id for efficient comparison
    3. Compute pairwise AST similarities
    4. Label clone pairs based on threshold
    5. Save results to JSON and CSV
    """
    
    def __init__(self, config: T3Config):
        """
        Initialize T3 clone detector.
        
        Args:
            config: Configuration object with detection parameters
        """
        self.config = config
        self.ted = TreeEditDistance(
            insert_cost=config.insert_cost,
            delete_cost=config.delete_cost,
            rename_cost=config.rename_cost
        )
        
        # Storage
        self.file_metadata: Dict[str, FileMetadata] = {}
        self.problem_groups: Dict[str, List[str]] = defaultdict(list)
        self.similarity_scores: Dict[Tuple[str, str], float] = {}
        self.clone_pairs: List[Tuple[str, str, float]] = []
        
        # Cache for loaded ASTs (memory optimization)
        self.ast_cache: Dict[str, Dict] = {}
        self.cache_size_limit = 1000  # Max ASTs to keep in memory
    
    def load_file_metadata(self, 
                          ast_root: Path,
                          t1_t2_hashes_path: Optional[Path] = None) -> None:
        """
        Load metadata for all AST files and identify T1/T2 clones.
        
        Args:
            ast_root: Root directory containing AST files (data/ast/java)
            t1_t2_hashes_path: Path to combined T1/T2 hash JSON (optional)
        """
        logger.info("Loading file metadata...")
        
        # Load T1/T2 clone information
        t1_clones, t2_clones = self._load_combined_hashes(t1_t2_hashes_path) if t1_t2_hashes_path else ({}, {})
        
        # Scan AST directory structure
        for problem_dir in sorted(ast_root.iterdir()):
            if not problem_dir.is_dir():
                continue
            
            problem_id = problem_dir.name
            
            for submission_dir in problem_dir.iterdir():
                if not submission_dir.is_dir():
                    continue
                
                submission_id = submission_dir.name
                file_id = f"{problem_id}/{submission_id}"
                ast_path = submission_dir / "ast.json"
                
                if not ast_path.exists():
                    logger.warning(f"AST file not found: {ast_path}")
                    continue
                
                # Count AST nodes (for optimization)
                ast_size = self._count_ast_nodes(ast_path)
                
                # Check if it's a T1 or T2 clone
                is_t1 = file_id in t1_clones
                is_t2 = file_id in t2_clones
                
                # Store metadata
                metadata = FileMetadata(
                    file_id=file_id,
                    problem_id=problem_id,
                    submission_id=submission_id,
                    ast_path=ast_path,
                    ast_size=ast_size,
                    is_t1_clone=is_t1,
                    is_t2_clone=is_t2
                )
                
                self.file_metadata[file_id] = metadata
                
                # Group by problem
                if self.config.enable_problem_grouping:
                    self.problem_groups[problem_id].append(file_id)
        
        logger.info(f"Loaded metadata for {len(self.file_metadata)} files")
        logger.info(f"Found {len(self.problem_groups)} problem groups")
    
    def _load_combined_hashes(self, hash_path: Path) -> Tuple[Set[str], Set[str]]:
        """Load T1 and T2 clone hashes from combined JSON file."""
        try:
            with open(hash_path, 'r') as f:
                hash_data = json.load(f)
            
            # Extract file IDs that have clones
            t1_clone_files = set()
            t2_clone_files = set()
            
            t1_hash_to_files = defaultdict(list)
            t2_hash_to_files = defaultdict(list)
            
            for file_id, hashes in hash_data.items():
                if isinstance(hashes, dict):
                    t1_hash = hashes.get('t1_hash')
                    t2_hash = hashes.get('t2_hash')
                    
                    if t1_hash:
                        t1_hash_to_files[t1_hash].append(file_id)
                    if t2_hash:
                        t2_hash_to_files[t2_hash].append(file_id)
            
            # Files with duplicate hashes are clones
            for hash_value, files in t1_hash_to_files.items():
                if len(files) > 1:
                    t1_clone_files.update(files)
            
            for hash_value, files in t2_hash_to_files.items():
                if len(files) > 1:
                    t2_clone_files.update(files)
            
            logger.info(f"Found {len(t1_clone_files)} T1 clones and {len(t2_clone_files)} T2 clones")
            
            return t1_clone_files, t2_clone_files
        
        except Exception as e:
            logger.warning(f"Failed to load clone hashes from {hash_path}: {e}")
            return set(), set()
    
    def _count_ast_nodes(self, ast_path: Path) -> int:
        """Count number of nodes in AST (for optimization)."""
        try:
            with open(ast_path, 'r') as f:
                ast_dict = json.load(f)
            return self._count_nodes_recursive(ast_dict)
        except Exception as e:
            logger.warning(f"Failed to count nodes in {ast_path}: {e}")
            return 0
    
    def _count_nodes_recursive(self, node: Dict) -> int:
        """Recursively count nodes in AST."""
        count = 1
        for child in node.get("children", []):
            count += self._count_nodes_recursive(child)
        return count
    
    def load_ast(self, file_id: str) -> Optional[Dict]:
        """
        Load AST from file with caching.
        
        Args:
            file_id: Unique file identifier
            
        Returns:
            AST dictionary or None if loading fails
        """
        # Check cache
        if file_id in self.ast_cache:
            return self.ast_cache[file_id]
        
        # Load from file
        metadata = self.file_metadata.get(file_id)
        if not metadata:
            return None
        
        try:
            with open(metadata.ast_path, 'r') as f:
                ast_dict = json.load(f)
            
            # Add to cache (with size limit)
            if len(self.ast_cache) < self.cache_size_limit:
                self.ast_cache[file_id] = ast_dict
            
            return ast_dict
        
        except Exception as e:
            logger.error(f"Failed to load AST for {file_id}: {e}")
            return None
    
    def should_compare(self, file_id1: str, file_id2: str) -> bool:
        """
        Determine if two files should be compared.
        
        Optimization filters:
        1. Skip if either is a T1 or T2 clone (already detected)
        2. Skip if size ratio is too large (unlikely to be similar)
        
        Args:
            file_id1: First file ID
            file_id2: Second file ID
            
        Returns:
            True if comparison should proceed
        """
        meta1 = self.file_metadata.get(file_id1)
        meta2 = self.file_metadata.get(file_id2)
        
        if not meta1 or not meta2:
            return False
        
        # Skip if already detected as T1 or T2
        if meta1.is_t1_clone or meta1.is_t2_clone:
            return False
        if meta2.is_t1_clone or meta2.is_t2_clone:
            return False
        
        # Skip if size ratio is too large
        size_ratio = max(meta1.ast_size, meta2.ast_size) / max(min(meta1.ast_size, meta2.ast_size), 1)
        if size_ratio > self.config.max_size_ratio:
            return False
        
        return True
    
    def compute_similarity_batch(self, file_pairs: List[Tuple[str, str]]) -> Dict[Tuple[str, str], float]:
        """
        Compute similarities for a batch of file pairs.
        
        Args:
            file_pairs: List of (file_id1, file_id2) tuples
            
        Returns:
            Dictionary mapping pairs to similarity scores
        """
        results = {}
        
        for file_id1, file_id2 in file_pairs:
            # Load ASTs
            ast1 = self.load_ast(file_id1)
            ast2 = self.load_ast(file_id2)
            
            if ast1 is None or ast2 is None:
                logger.warning(f"Failed to load ASTs for pair: {file_id1}, {file_id2}")
                continue
            
            # Compute similarity
            try:
                similarity = self.ted.compute_similarity(ast1, ast2)
                results[(file_id1, file_id2)] = similarity
            except Exception as e:
                logger.error(f"Error computing similarity for {file_id1}, {file_id2}: {e}")
        
        return results
    
    def detect_clones(self) -> None:
        """
        Main detection logic: compute pairwise similarities and identify clones.
        
        This method orchestrates the detection pipeline:
        1. Generate candidate pairs (with optimizations)
        2. Compute AST similarities
        3. Filter pairs by threshold
        4. Store results
        """
        logger.info("Starting T3 clone detection...")
        
        # Generate candidate pairs
        candidate_pairs = self._generate_candidate_pairs()
        logger.info(f"Generated {len(candidate_pairs)} candidate pairs")
        
        if len(candidate_pairs) == 0:
            logger.warning("No candidate pairs found. Check T1/T2 filters and problem grouping.")
            return
        
        # Compute similarities
        if self.config.enable_parallel and len(candidate_pairs) > 100:
            self._compute_similarities_parallel(candidate_pairs)
        else:
            self._compute_similarities_sequential(candidate_pairs)
        
        # Identify clone pairs
        self._identify_clone_pairs()
        
        logger.info(f"Detection complete. Found {len(self.clone_pairs)} T3 clone pairs")
    
    def _generate_candidate_pairs(self) -> List[Tuple[str, str]]:
        """Generate candidate pairs for comparison."""
        pairs = []
        
        if self.config.enable_problem_grouping:
            # Compare only within problem groups
            for problem_id, file_ids in self.problem_groups.items():
                for i, file_id1 in enumerate(file_ids):
                    for file_id2 in file_ids[i+1:]:
                        if self.should_compare(file_id1, file_id2):
                            pairs.append((file_id1, file_id2))
        else:
            # Compare all pairs (not recommended for large datasets)
            file_ids = list(self.file_metadata.keys())
            for i, file_id1 in enumerate(file_ids):
                for file_id2 in file_ids[i+1:]:
                    if self.should_compare(file_id1, file_id2):
                        pairs.append((file_id1, file_id2))
        
        return pairs
    
    def _compute_similarities_sequential(self, pairs: List[Tuple[str, str]]) -> None:
        """Compute similarities sequentially with progress bar."""
        logger.info("Computing similarities (sequential)...")
        
        for file_id1, file_id2 in tqdm(pairs, desc="Computing similarities"):
            ast1 = self.load_ast(file_id1)
            ast2 = self.load_ast(file_id2)
            
            if ast1 is None or ast2 is None:
                continue
            
            try:
                similarity = self.ted.compute_similarity(ast1, ast2)
                self.similarity_scores[(file_id1, file_id2)] = similarity
            except Exception as e:
                logger.error(f"Error computing similarity: {e}")
    
    def _compute_similarities_parallel(self, pairs: List[Tuple[str, str]]) -> None:
        """Compute similarities in parallel."""
        logger.info("Computing similarities (parallel)...")
        
        # Split pairs into batches
        batch_size = max(1, len(pairs) // (self.config.max_workers or 4))
        batches = [pairs[i:i+batch_size] for i in range(0, len(pairs), batch_size)]
        
        with ProcessPoolExecutor(max_workers=self.config.max_workers) as executor:
            futures = [executor.submit(self.compute_similarity_batch, batch) for batch in batches]
            
            for future in tqdm(as_completed(futures), total=len(futures), desc="Computing similarities"):
                try:
                    batch_results = future.result()
                    self.similarity_scores.update(batch_results)
                except Exception as e:
                    logger.error(f"Batch processing error: {e}")
    
    def _identify_clone_pairs(self) -> None:
        """Identify clone pairs based on similarity threshold."""
        for (file_id1, file_id2), similarity in self.similarity_scores.items():
            if similarity >= self.config.similarity_threshold:
                self.clone_pairs.append((file_id1, file_id2, similarity))
        
        # Sort by similarity (descending)
        self.clone_pairs.sort(key=lambda x: x[2], reverse=True)
    
    def save_results(self, output_dir: Path) -> None:
        """
        Save detection results to files.
        
        Outputs:
        - t3_similarity.json: All pairwise similarity scores
        - t3_pairs.csv: Clone pairs with similarity >= threshold
        
        Args:
            output_dir: Directory to save results
        """
        output_dir.mkdir(parents=True, exist_ok=True)
        
        # Save similarity scores (JSON)
        similarity_path = output_dir / "t3_similarity.json"
        similarity_dict = {
            f"{file_id1}|{file_id2}": score
            for (file_id1, file_id2), score in self.similarity_scores.items()
        }
        
        with open(similarity_path, 'w') as f:
            json.dump(similarity_dict, f, indent=2)
        
        logger.info(f"Saved similarity scores to {similarity_path}")
        
        # Save clone pairs (CSV)
        pairs_path = output_dir / "t3_pairs.csv"
        with open(pairs_path, 'w', newline='') as f:
            writer = csv.writer(f)
            writer.writerow(['file_id1', 'file_id2', 'similarity', 'problem_id1', 'problem_id2'])
            
            for file_id1, file_id2, similarity in self.clone_pairs:
                meta1 = self.file_metadata[file_id1]
                meta2 = self.file_metadata[file_id2]
                writer.writerow([
                    file_id1,
                    file_id2,
                    f"{similarity:.4f}",
                    meta1.problem_id,
                    meta2.problem_id
                ])
        
        logger.info(f"Saved clone pairs to {pairs_path}")
        
        # Save detection statistics
        stats_path = output_dir / "t3_statistics.json"
        stats = {
            "total_files": len(self.file_metadata),
            "total_comparisons": len(self.similarity_scores),
            "clone_pairs_found": len(self.clone_pairs),
            "config": {
                "similarity_threshold": self.config.similarity_threshold,
                "max_size_ratio": self.config.max_size_ratio,
                "enable_problem_grouping": self.config.enable_problem_grouping
            }
        }
        
        with open(stats_path, 'w') as f:
            json.dump(stats, f, indent=2)
        
        logger.info(f"Saved statistics to {stats_path}")
