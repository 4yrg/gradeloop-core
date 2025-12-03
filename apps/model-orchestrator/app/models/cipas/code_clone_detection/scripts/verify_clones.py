#!/usr/bin/env python3
"""
Verification script for T1/T2 clone detection results.

This script validates clone pairs by showing side-by-side comparisons
of the original code to verify that detected clones are indeed similar.
"""

import json
import csv
from pathlib import Path
from typing import List, Tuple


def load_clone_pairs(pairs_file: Path, limit: int = 5) -> List[Tuple[str, str]]:
    """Load clone pairs from CSV file."""
    pairs = []
    with open(pairs_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for i, row in enumerate(reader):
            if i >= limit:
                break
            pairs.append((row['file1'], row['file2']))
    return pairs


def read_normalized_code(base_path: Path, file_id: str) -> str:
    """Read normalized code for a file."""
    problem_id, submission_id = file_id.split('/')
    file_path = (base_path / 'data' / 'normalized' / 'java' / 
                 problem_id / submission_id / f"{submission_id}.java")
    
    with open(file_path, 'r', encoding='utf-8') as f:
        return f.read()


def verify_clone_pair(base_path: Path, file1: str, file2: str):
    """Display side-by-side comparison of a clone pair."""
    print("\n" + "="*80)
    print(f"Clone Pair: {file1} ↔ {file2}")
    print("="*80)
    
    code1 = read_normalized_code(base_path, file1)
    code2 = read_normalized_code(base_path, file2)
    
    print(f"\nFile 1: {file1}")
    print("-" * 80)
    print(code1[:500])  # Show first 500 chars
    if len(code1) > 500:
        print(f"... ({len(code1) - 500} more characters)")
    
    print(f"\nFile 2: {file2}")
    print("-" * 80)
    print(code2[:500])  # Show first 500 chars
    if len(code2) > 500:
        print(f"... ({len(code2) - 500} more characters)")
    
    # Show differences
    print("\n" + "-" * 80)
    print("Analysis:")
    print(f"  Length difference: {abs(len(code1) - len(code2))} characters")
    print(f"  Exact match: {code1 == code2}")
    
    # Count identifier differences (simple heuristic)
    tokens1 = set(code1.split())
    tokens2 = set(code2.split())
    unique_to_1 = tokens1 - tokens2
    unique_to_2 = tokens2 - tokens1
    
    if unique_to_1 or unique_to_2:
        print(f"  Unique tokens in file 1: {list(unique_to_1)[:10]}")
        print(f"  Unique tokens in file 2: {list(unique_to_2)[:10]}")


def main():
    """Main verification routine."""
    # Get base path
    script_path = Path(__file__).resolve()
    base_path = script_path.parent.parent
    
    print("="*80)
    print("T1/T2 Clone Detection Verification")
    print("="*80)
    
    # Verify T2 pairs
    t2_pairs_file = base_path / 'data' / 'metadata' / 't2_pairs.csv'
    
    if t2_pairs_file.exists():
        print("\n\nVerifying T2 (Renamed) Clone Pairs:")
        print("="*80)
        
        pairs = load_clone_pairs(t2_pairs_file, limit=3)
        
        for file1, file2 in pairs:
            verify_clone_pair(base_path, file1, file2)
    
    # Check T1 pairs
    t1_pairs_file = base_path / 'data' / 'metadata' / 't1_pairs.csv'
    
    if t1_pairs_file.exists():
        with open(t1_pairs_file, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            t1_pairs = list(reader)
        
        if t1_pairs:
            print("\n\nVerifying T1 (Exact) Clone Pairs:")
            print("="*80)
            
            for i, row in enumerate(t1_pairs[:3]):
                verify_clone_pair(base_path, row['file1'], row['file2'])
        else:
            print("\n\nNo T1 (Exact) clone pairs found.")
    
    print("\n" + "="*80)
    print("Verification Complete")
    print("="*80)


if __name__ == '__main__':
    main()
