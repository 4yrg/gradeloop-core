"""
Metadata Indexer for CodeNet dataset processing.

This module provides functionality to build a master index of accepted submissions
from CodeNet metadata, organized by problem and programming language. The index
is cached for faster subsequent access.
"""

import pickle
from pathlib import Path
from typing import Dict, List
import pandas as pd

from .config import CODENET_ROOT, MIN_CODE_SIZE


def build_master_index(
    codenet_root: str = None,
    languages: List[str] = None,
    min_code_size: int = MIN_CODE_SIZE,
    use_cache: bool = True
) -> Dict[str, Dict[str, List[str]]]:
    """
    Build a master index of accepted submissions from CodeNet metadata.

    Reads all {problem_id}.csv files in codenet_root/metadata/, filters for
    accepted submissions with sufficient code size, and organizes them by
    problem ID and programming language.

    Args:
        codenet_root: Root path to the CodeNet dataset (defaults to config.CODENET_ROOT)
        languages: List of programming languages to include (defaults to config.LANGUAGES)
        min_code_size: Minimum code size in bytes (default from config)
        use_cache: Whether to use cached index if available

    Returns:
        Nested dictionary: {"p00001": {"java": ["s1", "s2"], "python": [...]}, ...}

    Raises:
        FileNotFoundError: If metadata directory doesn't exist
    """
    # Use defaults from config if not provided
    if codenet_root is None:
        from .config import CODENET_ROOT as root
        codenet_root = root

    if languages is None:
        from .config import LANGUAGES
        languages = LANGUAGES

    # Setup paths
    metadata_dir = Path(codenet_root) / "metadata"
    processed_dir = Path(codenet_root) / "processed"
    cache_file = processed_dir / "master_index.pkl"

    # Create processed directory if it doesn't exist
    processed_dir.mkdir(exist_ok=True)

    # Check if cached version exists and is valid
    if use_cache and cache_file.exists():
        try:
            cache_mtime = cache_file.stat().st_mtime
            csv_files = list(metadata_dir.glob("*.csv"))

            if csv_files:
                metadata_mtime = max([f.stat().st_mtime for f in csv_files])

                if cache_mtime > metadata_mtime:
                    print(f"Loading cached master index from {cache_file}")
                    with open(cache_file, 'rb') as f:
                        return pickle.load(f)
        except (OSError, ValueError, pickle.PickleError) as e:
            print(f"Cache read failed: {e}. Rebuilding index...")

    print(f"Building master index from {metadata_dir}")

    # Get all CSV files in metadata directory
    csv_files = list(metadata_dir.glob("*.csv"))

    if not csv_files:
        raise FileNotFoundError(f"No CSV files found in {metadata_dir}")

    print(f"Found {len(csv_files)} problem metadata files")

    # Initialize the master index
    master_index = {}
    processed_count = 0

    # Process each CSV file
    for csv_file in csv_files:
        problem_id = csv_file.stem

        try:
            # Read the CSV file
            df = pd.read_csv(csv_file)

            # Filter for accepted submissions with sufficient code size
            filtered_df = df[
                (df['status'] == 'Accepted') &
                (df['code_size'] >= min_code_size)
            ]

            if filtered_df.empty:
                continue

            # Initialize problem entry
            master_index[problem_id] = {}

            # Group submissions by language
            for language in languages:
                lang_submissions = filtered_df[
                    filtered_df['language'].str.lower() == language.lower()
                ]

                if not lang_submissions.empty:
                    submission_ids = lang_submissions['submission_id'].tolist()
                    master_index[problem_id][language.lower()] = submission_ids

            # Remove problem if no submissions found for any target language
            if not master_index[problem_id]:
                del master_index[problem_id]
            else:
                processed_count += 1
                if processed_count % 100 == 0:
                    print(f"Processed {processed_count} problems...")

        except Exception as e:
            print(f"Error processing {csv_file}: {e}")
            continue

    print(f"Master index built with {len(master_index)} problems")

    # Cache the result
    if use_cache:
        try:
            with open(cache_file, 'wb') as f:
                pickle.dump(master_index, f)
            print(f"Master index cached to {cache_file}")
        except Exception as e:
            print(f"Warning: Failed to cache master index: {e}")

    return master_index


def get_problem_stats(master_index: Dict[str, Dict[str, List[str]]]) -> pd.DataFrame:
    """
    Generate statistics about problems and submissions in the master index.

    Args:
        master_index: The master index dictionary

    Returns:
        DataFrame with columns: problem_id, language, submission_count
    """
    stats_data = []

    for problem_id, languages in master_index.items():
        for language, submissions in languages.items():
            stats_data.append({
                'problem_id': problem_id,
                'language': language,
                'submission_count': len(submissions)
            })

    return pd.DataFrame(stats_data)


def filter_index_by_min_submissions(
    master_index: Dict[str, Dict[str, List[str]]],
    min_submissions: int = 5
) -> Dict[str, Dict[str, List[str]]]:
    """
    Filter master index to only include problems with minimum submissions per language.

    Args:
        master_index: The master index dictionary
        min_submissions: Minimum number of submissions required per language

    Returns:
        Filtered master index
    """
    filtered_index = {}

    for problem_id, languages in master_index.items():
        filtered_languages = {
            lang: subs for lang, subs in languages.items()
            if len(subs) >= min_submissions
        }

        if filtered_languages:
            filtered_index[problem_id] = filtered_languages

    return filtered_index


def get_language_distribution(master_index: Dict[str, Dict[str, List[str]]]) -> Dict[str, int]:
    """
    Get distribution of submissions across languages.

    Args:
        master_index: The master index dictionary

    Returns:
        Dictionary mapping language to total submission count
    """
    distribution = {}

    for problem_languages in master_index.values():
        for language, submissions in problem_languages.items():
            distribution[language] = distribution.get(language, 0) + len(submissions)

    return distribution


def print_index_summary(master_index: Dict[str, Dict[str, List[str]]]):
    """
    Print a human-readable summary of the master index.

    Args:
        master_index: The master index dictionary
    """
    print("\n" + "=" * 80)
    print("MASTER INDEX SUMMARY")
    print("=" * 80)

    print(f"\nTotal problems: {len(master_index)}")

    # Language distribution
    lang_dist = get_language_distribution(master_index)
    print(f"\nSubmissions by language:")
    for lang, count in sorted(lang_dist.items(), key=lambda x: x[1], reverse=True):
        print(f"  {lang:12s}: {count:,}")

    # Problem statistics
    stats_df = get_problem_stats(master_index)
    print(f"\nPer-language statistics:")
    summary = stats_df.groupby('language').agg({
        'submission_count': ['count', 'sum', 'mean', 'min', 'max']
    }).round(2)
    print(summary)

    print("=" * 80)

