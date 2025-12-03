#!/usr/bin/env python3
"""
T1 and T2 Clone Detection for Java using Project CodeNet.

This module implements two types of clone detection:
- T1 (Type-1): Exact clones - identical code after normalization
- T2 (Type-2): Renamed clones - identical code structure with renamed identifiers/literals

The implementation is designed to be:
- Deterministic (no randomness)
- Modular (clean separation of concerns)
- Extensible (easy to adapt to other languages)
"""

import hashlib
import json
import csv
from pathlib import Path
from typing import Dict, List, Tuple, Set
from collections import defaultdict
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class T1CloneDetector:
    """
    T1 (Type-1) Clone Detector: Detects exact clones.
    
    T1 clones are code fragments that are identical after normalization
    (whitespace and comments removed). We use SHA-256 hashing because:
    
    1. Deterministic: Same input always produces same hash
    2. Collision-resistant: Virtually no false positives
    3. Fast: O(n) complexity for n bytes of code
    4. Standard: SHA-256 is widely used and trusted
    """
    
    def __init__(self):
        self.file_hashes: Dict[str, str] = {}
    
    def compute_hash(self, normalized_code: str) -> str:
        """
        Compute SHA-256 hash of normalized code.
        
        Args:
            normalized_code: The normalized Java source code as a string
            
        Returns:
            Hexadecimal string representation of the SHA-256 hash
            
        Why SHA-256:
        - Provides 256 bits of entropy (2^256 possible hashes)
        - Industry standard for content-based hashing
        - Probability of collision is negligible for our dataset size
        """
        # Encode to UTF-8 bytes for consistent hashing across platforms
        code_bytes = normalized_code.encode('utf-8')
        
        # Compute SHA-256 hash
        hash_obj = hashlib.sha256(code_bytes)
        
        # Return hexadecimal digest (64 characters)
        return hash_obj.hexdigest()
    
    def process_file(self, file_path: Path, file_id: str) -> str:
        """
        Process a single normalized Java file and compute its hash.
        
        Args:
            file_path: Path to the normalized .java file
            file_id: Unique identifier for this file (problem_id/submission_id)
            
        Returns:
            The computed hash string
        """
        try:
            # Read normalized code
            with open(file_path, 'r', encoding='utf-8') as f:
                normalized_code = f.read()
            
            # Compute hash
            file_hash = self.compute_hash(normalized_code)
            
            # Store mapping
            self.file_hashes[file_id] = file_hash
            
            return file_hash
            
        except Exception as e:
            logger.error(f"Error processing T1 for {file_id}: {e}")
            raise
    
    def get_hashes(self) -> Dict[str, str]:
        """Return the computed file hashes."""
        return self.file_hashes


class T2CloneDetector:
    """
    T2 (Type-2) Clone Detector: Detects renamed clones.
    
    T2 clones have the same structure but use different identifier names
    and literal values. We detect them by:
    
    1. Canonicalizing the token stream (renaming identifiers/literals)
    2. Hashing the canonicalized sequence
    
    Why canonicalization works:
    - Identifiers (variable names, method names, etc.) → id1, id2, ...
    - Literals (numbers, strings) → lit1, lit2, ...
    - Preserves: keywords, operators, separators (structure)
    
    This transforms structurally identical code with different names
    into identical token sequences, enabling hash-based detection.
    """
    
    def __init__(self):
        self.file_hashes: Dict[str, str] = {}
    
    def canonicalize_tokens(self, tokens: List[Dict]) -> str:
        """
        Canonicalize a token stream by renaming identifiers and literals.
        
        Args:
            tokens: List of token dictionaries with 'type' and 'value' keys
            
        Returns:
            String representation of canonicalized token sequence
            
        Canonicalization strategy:
        - Identifiers → id1, id2, id3, ... (in order of first occurrence)
        - Literals → lit1, lit2, lit3, ... (in order of first occurrence)
        - Keywords, Operators, Separators, Modifiers → preserved as-is
        
        Why this works:
        Code with identical structure but different names will produce
        identical canonicalized sequences. For example:
        
        Original A: int count = 0;
        Original B: int total = 0;
        
        Both become: int id1 = lit1 ;
        """
        # Track first occurrence of each identifier/literal for deterministic renaming
        identifier_map: Dict[str, str] = {}
        literal_map: Dict[str, str] = {}
        
        # Counters for generating canonical names
        identifier_counter = 1
        literal_counter = 1
        
        # Build canonicalized token sequence
        canonical_tokens = []
        
        for token in tokens:
            token_type = token.get('type', '')
            token_value = token.get('value', '')
            
            if token_type == 'Identifier':
                # Rename identifiers to id1, id2, etc.
                if token_value not in identifier_map:
                    identifier_map[token_value] = f'id{identifier_counter}'
                    identifier_counter += 1
                canonical_tokens.append(identifier_map[token_value])
                
            elif token_type in ['Integer', 'DecimalInteger', 'OctalInteger', 
                               'HexInteger', 'BinaryInteger', 'FloatingPoint',
                               'String', 'Character', 'Boolean', 'Null']:
                # Rename literals to lit1, lit2, etc.
                if token_value not in literal_map:
                    literal_map[token_value] = f'lit{literal_counter}'
                    literal_counter += 1
                canonical_tokens.append(literal_map[token_value])
                
            else:
                # Preserve keywords, operators, separators, modifiers
                # These define the code structure
                canonical_tokens.append(token_value)
        
        # Join tokens with space delimiter for consistent string representation
        # The delimiter doesn't matter as long as it's consistent
        return ' '.join(canonical_tokens)
    
    def compute_hash(self, canonical_sequence: str) -> str:
        """
        Compute SHA-256 hash of canonicalized token sequence.
        
        Args:
            canonical_sequence: The canonicalized token string
            
        Returns:
            Hexadecimal string representation of the SHA-256 hash
        """
        sequence_bytes = canonical_sequence.encode('utf-8')
        hash_obj = hashlib.sha256(sequence_bytes)
        return hash_obj.hexdigest()
    
    def process_file(self, tokens_path: Path, file_id: str) -> str:
        """
        Process a single token file and compute its T2 hash.
        
        Args:
            tokens_path: Path to the tokens.json file
            file_id: Unique identifier for this file (problem_id/submission_id)
            
        Returns:
            The computed hash string
        """
        try:
            # Load token stream
            with open(tokens_path, 'r', encoding='utf-8') as f:
                tokens = json.load(f)
            
            # Canonicalize tokens
            canonical_sequence = self.canonicalize_tokens(tokens)
            
            # Compute hash
            file_hash = self.compute_hash(canonical_sequence)
            
            # Store mapping
            self.file_hashes[file_id] = file_hash
            
            return file_hash
            
        except Exception as e:
            logger.error(f"Error processing T2 for {file_id}: {e}")
            raise
    
    def get_hashes(self) -> Dict[str, str]:
        """Return the computed file hashes."""
        return self.file_hashes


class CloneGrouper:
    """
    Groups files by hash and generates clone pairs.
    
    This class takes file-to-hash mappings and produces:
    1. Groups: Hash → List of files with that hash
    2. Pairs: All unordered pairs of files in the same group
    """
    
    @staticmethod
    def create_groups(file_hashes: Dict[str, str]) -> Dict[str, List[str]]:
        """
        Group files by their hash values.
        
        Args:
            file_hashes: Mapping from file_id to hash
            
        Returns:
            Mapping from hash to list of file_ids with that hash
            
        Only includes groups with more than one file (actual clones).
        """
        hash_to_files: Dict[str, List[str]] = defaultdict(list)
        
        for file_id, file_hash in file_hashes.items():
            hash_to_files[file_hash].append(file_id)
        
        # Filter to only groups with clones (more than 1 file)
        clone_groups = {
            hash_val: files 
            for hash_val, files in hash_to_files.items() 
            if len(files) > 1
        }
        
        return dict(clone_groups)
    
    @staticmethod
    def create_pairs(groups: Dict[str, List[str]]) -> List[Tuple[str, str]]:
        """
        Generate all unordered clone pairs from groups.
        
        Args:
            groups: Mapping from hash to list of file_ids
            
        Returns:
            List of (file_id1, file_id2) pairs where file_id1 < file_id2
            
        Pairs are unordered and deterministic:
        - (A, B) is included but not (B, A)
        - Pairs are sorted for consistent output
        """
        pairs = []
        
        for hash_val, files in groups.items():
            # Sort files for deterministic pair generation
            sorted_files = sorted(files)
            
            # Generate all pairs using nested loops
            for i in range(len(sorted_files)):
                for j in range(i + 1, len(sorted_files)):
                    pairs.append((sorted_files[i], sorted_files[j]))
        
        # Sort all pairs for deterministic output
        pairs.sort()
        
        return pairs


class CloneHashingPipeline:
    """
    Main pipeline for T1 and T2 clone detection.
    
    Orchestrates the entire process:
    1. Load metadata
    2. Process all files for T1 and T2
    3. Group hashes
    4. Generate pairs
    5. Save outputs
    """
    
    def __init__(self, base_path: Path):
        """
        Initialize the pipeline.
        
        Args:
            base_path: Base path to the code_clone_detection directory
        """
        self.base_path = base_path
        self.data_path = base_path / 'data'
        self.metadata_path = self.data_path / 'metadata'
        self.normalized_path = self.data_path / 'normalized' / 'java'
        self.tokens_path = self.data_path / 'tokens' / 'java'
        
        # Initialize detectors
        self.t1_detector = T1CloneDetector()
        self.t2_detector = T2CloneDetector()
        self.grouper = CloneGrouper()
    
    def load_metadata(self) -> List[Dict]:
        """Load the CodeNet index metadata."""
        metadata_file = self.metadata_path / 'codenet_index.json'
        
        logger.info(f"Loading metadata from {metadata_file}")
        with open(metadata_file, 'r', encoding='utf-8') as f:
            metadata = json.load(f)
        
        logger.info(f"Loaded {len(metadata)} file entries")
        return metadata
    
    def process_all_files(self, metadata: List[Dict]):
        """
        Process all files for both T1 and T2 detection.
        
        Args:
            metadata: List of file metadata entries
        """
        logger.info("Starting T1 and T2 hash computation...")
        
        processed_count = 0
        skipped_count = 0
        
        for entry in metadata:
            problem_id = entry['problem_id']
            submission_id = entry['submission_id']
            file_id = f"{problem_id}/{submission_id}"
            
            # Construct file paths
            normalized_file = (self.normalized_path / problem_id / submission_id / 
                             f"{submission_id}.java")
            tokens_file = (self.tokens_path / problem_id / submission_id / 
                          "tokens.json")
            
            # Check if files exist
            if not normalized_file.exists():
                logger.warning(f"Normalized file not found: {normalized_file}")
                skipped_count += 1
                continue
            
            if not tokens_file.exists():
                logger.warning(f"Tokens file not found: {tokens_file}")
                skipped_count += 1
                continue
            
            try:
                # Process T1 (normalized code hash)
                self.t1_detector.process_file(normalized_file, file_id)
                
                # Process T2 (canonicalized token hash)
                self.t2_detector.process_file(tokens_file, file_id)
                
                processed_count += 1
                
                if processed_count % 1000 == 0:
                    logger.info(f"Processed {processed_count} files...")
                    
            except Exception as e:
                logger.error(f"Error processing {file_id}: {e}")
                skipped_count += 1
                continue
        
        logger.info(f"Processing complete: {processed_count} processed, {skipped_count} skipped")
    
    def generate_outputs(self):
        """Generate all output files: hashes, groups, and pairs."""
        logger.info("Generating output files...")
        
        # Get hashes from detectors
        t1_hashes = self.t1_detector.get_hashes()
        t2_hashes = self.t2_detector.get_hashes()
        
        # Create combined hash output
        combined_hashes = {}
        for file_id in t1_hashes.keys():
            combined_hashes[file_id] = {
                't1_hash': t1_hashes.get(file_id, ''),
                't2_hash': t2_hashes.get(file_id, '')
            }
        
        # Save combined hashes
        hashes_file = self.metadata_path / 't1_t2_hashes.json'
        logger.info(f"Saving hashes to {hashes_file}")
        with open(hashes_file, 'w', encoding='utf-8') as f:
            json.dump(combined_hashes, f, indent=2)
        
        # Generate T1 groups and pairs
        logger.info("Generating T1 clone groups...")
        t1_groups = self.grouper.create_groups(t1_hashes)
        logger.info(f"Found {len(t1_groups)} T1 clone groups")
        
        t1_groups_file = self.metadata_path / 't1_groups.json'
        with open(t1_groups_file, 'w', encoding='utf-8') as f:
            json.dump(t1_groups, f, indent=2)
        
        logger.info("Generating T1 clone pairs...")
        t1_pairs = self.grouper.create_pairs(t1_groups)
        logger.info(f"Found {len(t1_pairs)} T1 clone pairs")
        
        t1_pairs_file = self.metadata_path / 't1_pairs.csv'
        with open(t1_pairs_file, 'w', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)
            writer.writerow(['file1', 'file2'])
            writer.writerows(t1_pairs)
        
        # Generate T2 groups and pairs
        logger.info("Generating T2 clone groups...")
        t2_groups = self.grouper.create_groups(t2_hashes)
        logger.info(f"Found {len(t2_groups)} T2 clone groups")
        
        t2_groups_file = self.metadata_path / 't2_groups.json'
        with open(t2_groups_file, 'w', encoding='utf-8') as f:
            json.dump(t2_groups, f, indent=2)
        
        logger.info("Generating T2 clone pairs...")
        t2_pairs = self.grouper.create_pairs(t2_groups)
        logger.info(f"Found {len(t2_pairs)} T2 clone pairs")
        
        t2_pairs_file = self.metadata_path / 't2_pairs.csv'
        with open(t2_pairs_file, 'w', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)
            writer.writerow(['file1', 'file2'])
            writer.writerows(t2_pairs)
        
        logger.info("All outputs generated successfully!")
        
        # Print summary
        self._print_summary(t1_hashes, t2_hashes, t1_groups, t2_groups, 
                          t1_pairs, t2_pairs)
    
    def _print_summary(self, t1_hashes, t2_hashes, t1_groups, t2_groups, 
                      t1_pairs, t2_pairs):
        """Print a summary of the clone detection results."""
        logger.info("\n" + "="*60)
        logger.info("CLONE DETECTION SUMMARY")
        logger.info("="*60)
        logger.info(f"Total files processed: {len(t1_hashes)}")
        logger.info(f"\nT1 (Exact) Clones:")
        logger.info(f"  - Clone groups: {len(t1_groups)}")
        logger.info(f"  - Clone pairs: {len(t1_pairs)}")
        logger.info(f"\nT2 (Renamed) Clones:")
        logger.info(f"  - Clone groups: {len(t2_groups)}")
        logger.info(f"  - Clone pairs: {len(t2_pairs)}")
        logger.info("="*60)
    
    def run(self):
        """Execute the complete pipeline."""
        logger.info("Starting T1/T2 Clone Detection Pipeline")
        logger.info("="*60)
        
        # Load metadata
        metadata = self.load_metadata()
        
        # Process all files
        self.process_all_files(metadata)
        
        # Generate outputs
        self.generate_outputs()
        
        logger.info("\nPipeline completed successfully!")


def main():
    """Main entry point for the script."""
    # Get base path (script is in scripts/ directory)
    script_path = Path(__file__).resolve()
    base_path = script_path.parent.parent
    
    # Initialize and run pipeline
    pipeline = CloneHashingPipeline(base_path)
    pipeline.run()


if __name__ == '__main__':
    main()
