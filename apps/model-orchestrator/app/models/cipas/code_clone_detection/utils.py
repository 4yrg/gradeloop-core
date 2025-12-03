#!/usr/bin/env python3
"""
Shared utilities for clone detection pipeline.

This module provides common functionality used across the clone detection pipeline,
including path handling, file I/O, metadata management, and data validation.
"""

import json
import csv
from pathlib import Path
from typing import Dict, List, Tuple, Optional, Any, Set
import logging

logger = logging.getLogger(__name__)


class PathManager:
    """
    Centralized path management for clone detection pipeline.
    
    This class ensures consistent path handling across all modules and provides
    a single source of truth for directory structure.
    """
    
    def __init__(self, base_dir: Path):
        """
        Initialize path manager.
        
        Args:
            base_dir: Root directory of the clone detection project
        """
        self.base_dir = Path(base_dir)
        
        # Data directories
        self.data_dir = self.base_dir / "data"
        self.raw_dir = self.data_dir / "raw"
        self.normalized_dir = self.data_dir / "normalized"
        self.tokens_dir = self.data_dir / "tokens"
        self.ast_dir = self.data_dir / "ast"
        self.metadata_dir = self.data_dir / "metadata"
        self.datasets_dir = self.data_dir / "datasets"
        self.eval_dir = self.data_dir / "eval"
        self.configs_dir = self.data_dir / "configs"
        
    def get_normalized_path(self, language: str, problem_id: str, submission_id: str) -> Path:
        """Get path to normalized code file."""
        return self.normalized_dir / language / problem_id / submission_id
    
    def get_tokens_path(self, language: str, problem_id: str, submission_id: str) -> Path:
        """Get path to tokens file."""
        return self.tokens_dir / language / problem_id / submission_id / "tokens.json"
    
    def get_ast_path(self, language: str, problem_id: str, submission_id: str) -> Path:
        """Get path to AST file."""
        return self.ast_dir / language / problem_id / submission_id / "ast.json"
    
    def get_t1_t2_hashes_path(self) -> Path:
        """Get path to T1/T2 hashes file."""
        return self.metadata_dir / "t1_t2_hashes.json"
    
    def get_t1_pairs_path(self) -> Path:
        """Get path to T1 pairs CSV."""
        return self.metadata_dir / "t1_pairs.csv"
    
    def get_t2_pairs_path(self) -> Path:
        """Get path to T2 pairs CSV."""
        return self.metadata_dir / "t2_pairs.csv"
    
    def get_t3_pairs_path(self) -> Path:
        """Get path to T3 pairs CSV."""
        return self.metadata_dir / "t3_pairs.csv"
    
    def get_t4_pairs_path(self) -> Path:
        """Get path to T4 pairs CSV."""
        return self.metadata_dir / "t4_pairs.csv"
    
    def get_codenet_index_path(self) -> Path:
        """Get path to CodeNet metadata index."""
        return self.metadata_dir / "codenet_index.json"
    
    def get_dataset_path(self, language: str) -> Path:
        """Get path to ML dataset JSONL."""
        return self.datasets_dir / language / "clones.jsonl"
    
    def get_codet5_dir(self, language: str) -> Path:
        """Get directory for CodeT5+ formatted datasets."""
        return self.datasets_dir / language / "codet5"
    
    def get_eval_metrics_path(self) -> Path:
        """Get path to evaluation metrics JSON."""
        return self.eval_dir / "clone_detection_metrics.json"


class MetadataLoader:
    """
    Loader for metadata and clone pair files.
    
    This class provides consistent methods for loading various metadata files
    produced by the clone detection pipeline.
    """
    
    def __init__(self, path_manager: PathManager):
        """
        Initialize metadata loader.
        
        Args:
            path_manager: PathManager instance for resolving paths
        """
        self.paths = path_manager
    
    def load_codenet_index(self) -> List[Dict[str, str]]:
        """
        Load CodeNet metadata index.
        
        Returns:
            List of metadata entries with language, problem_id, submission_id, file_path
        """
        index_path = self.paths.get_codenet_index_path()
        if not index_path.exists():
            logger.warning(f"CodeNet index not found: {index_path}")
            return []
        
        with open(index_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    
    def load_t1_t2_hashes(self) -> Dict[str, Dict[str, str]]:
        """
        Load T1/T2 hashes.
        
        Returns:
            Dict mapping file_id to {'t1_hash': str, 't2_hash': str}
        """
        hashes_path = self.paths.get_t1_t2_hashes_path()
        if not hashes_path.exists():
            logger.warning(f"T1/T2 hashes not found: {hashes_path}")
            return {}
        
        with open(hashes_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    
    def load_clone_pairs(self, clone_type: str) -> List[Tuple[str, str]]:
        """
        Load clone pairs for a specific type.
        
        Args:
            clone_type: One of 't1', 't2', 't3', 't4'
        
        Returns:
            List of (file_id1, file_id2) tuples
        """
        if clone_type == 't1':
            pairs_path = self.paths.get_t1_pairs_path()
        elif clone_type == 't2':
            pairs_path = self.paths.get_t2_pairs_path()
        elif clone_type == 't3':
            pairs_path = self.paths.get_t3_pairs_path()
        elif clone_type == 't4':
            pairs_path = self.paths.get_t4_pairs_path()
        else:
            raise ValueError(f"Invalid clone type: {clone_type}")
        
        if not pairs_path.exists():
            logger.warning(f"{clone_type.upper()} pairs not found: {pairs_path}")
            return []
        
        pairs = []
        with open(pairs_path, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                # Handle different CSV formats
                if 'file1' in row and 'file2' in row:
                    pairs.append((row['file1'], row['file2']))
                elif 'file_id1' in row and 'file_id2' in row:
                    pairs.append((row['file_id1'], row['file_id2']))
                elif 'submission_id_1' in row and 'submission_id_2' in row:
                    # T4 format includes problem_id
                    problem_id = row.get('problem_id', '')
                    sub1 = row['submission_id_1']
                    sub2 = row['submission_id_2']
                    # Construct file_id format: problem_id/submission_id
                    pairs.append((f"{problem_id}/{sub1}", f"{problem_id}/{sub2}"))
        
        return pairs
    
    def load_normalized_code(self, language: str, problem_id: str, submission_id: str) -> Optional[str]:
        """
        Load normalized code for a specific submission.
        
        Args:
            language: Programming language (e.g., 'java')
            problem_id: Problem identifier
            submission_id: Submission identifier
        
        Returns:
            Normalized code content or None if not found
        """
        code_dir = self.paths.get_normalized_path(language, problem_id, submission_id)
        
        if not code_dir.exists():
            return None
        
        # Find Java file in directory
        java_files = list(code_dir.glob("*.java"))
        if not java_files:
            return None
        
        # Read first Java file
        with open(java_files[0], 'r', encoding='utf-8') as f:
            return f.read()


class FileIDParser:
    """
    Parser for file identifiers used across the pipeline.
    
    File IDs follow the format: language/problem_id/submission_id
    or problem_id/submission_id (language implicit from context)
    """
    
    @staticmethod
    def parse(file_id: str) -> Tuple[str, str, Optional[str]]:
        """
        Parse file ID into components.
        
        Args:
            file_id: File identifier string
        
        Returns:
            Tuple of (problem_id, submission_id, language_or_none)
        """
        parts = file_id.split('/')
        
        if len(parts) == 3:
            # Format: language/problem_id/submission_id
            return parts[1], parts[2], parts[0]
        elif len(parts) == 2:
            # Format: problem_id/submission_id
            return parts[0], parts[1], None
        else:
            # Fallback: treat as submission_id only
            return "", file_id, None
    
    @staticmethod
    def construct(language: str, problem_id: str, submission_id: str) -> str:
        """
        Construct file ID from components.
        
        Args:
            language: Programming language
            problem_id: Problem identifier
            submission_id: Submission identifier
        
        Returns:
            File ID string
        """
        return f"{language}/{problem_id}/{submission_id}"


class ClonePairDeduplicator:
    """
    Deduplicates and resolves conflicts in clone pair labels.
    
    When a pair appears in multiple clone type sets, the highest clone type wins
    (since T1 ⊂ T2 ⊂ T3 ⊂ T4 semantically).
    """
    
    @staticmethod
    def deduplicate(
        t1_pairs: List[Tuple[str, str]],
        t2_pairs: List[Tuple[str, str]],
        t3_pairs: List[Tuple[str, str]],
        t4_pairs: List[Tuple[str, str]]
    ) -> Dict[Tuple[str, str], int]:
        """
        Deduplicate pairs and assign highest clone type.
        
        Args:
            t1_pairs: T1 clone pairs
            t2_pairs: T2 clone pairs
            t3_pairs: T3 clone pairs
            t4_pairs: T4 clone pairs
        
        Returns:
            Dict mapping normalized (id1, id2) to clone_type (1-4)
        """
        pair_labels: Dict[Tuple[str, str], int] = {}
        
        # Process in order T1 -> T2 -> T3 -> T4
        # Later types overwrite earlier types (highest wins)
        for pairs, label in [(t1_pairs, 1), (t2_pairs, 2), (t3_pairs, 3), (t4_pairs, 4)]:
            for id1, id2 in pairs:
                # Normalize pair order (smaller first)
                normalized = tuple(sorted([id1, id2]))
                pair_labels[normalized] = label
        
        return pair_labels
    
    @staticmethod
    def normalize_pair(id1: str, id2: str) -> Tuple[str, str]:
        """
        Normalize pair order (lexicographically smaller first).
        
        Args:
            id1: First file ID
            id2: Second file ID
        
        Returns:
            Normalized tuple
        """
        return tuple(sorted([id1, id2]))


def ensure_dir(path: Path) -> None:
    """
    Ensure directory exists, create if necessary.
    
    Args:
        path: Directory path
    """
    path.mkdir(parents=True, exist_ok=True)


def file_exists_and_nonempty(path: Path) -> bool:
    """
    Check if file exists and is non-empty.
    
    Args:
        path: File path
    
    Returns:
        True if file exists and has size > 0
    """
    return path.exists() and path.stat().st_size > 0


def load_json(path: Path) -> Any:
    """
    Load JSON file.
    
    Args:
        path: Path to JSON file
    
    Returns:
        Parsed JSON content
    """
    with open(path, 'r', encoding='utf-8') as f:
        return json.load(f)


def save_json(data: Any, path: Path, indent: int = 2) -> None:
    """
    Save data as JSON file.
    
    Args:
        data: Data to save
        path: Output path
        indent: JSON indentation
    """
    ensure_dir(path.parent)
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=indent)


def save_jsonl(data: List[Dict], path: Path) -> None:
    """
    Save data as JSONL (one JSON object per line).
    
    Args:
        data: List of dictionaries
        path: Output path
    """
    ensure_dir(path.parent)
    with open(path, 'w', encoding='utf-8') as f:
        for item in data:
            f.write(json.dumps(item) + '\n')


def load_jsonl(path: Path) -> List[Dict]:
    """
    Load JSONL file.
    
    Args:
        path: Path to JSONL file
    
    Returns:
        List of dictionaries
    """
    data = []
    with open(path, 'r', encoding='utf-8') as f:
        for line in f:
            if line.strip():
                data.append(json.loads(line))
    return data
