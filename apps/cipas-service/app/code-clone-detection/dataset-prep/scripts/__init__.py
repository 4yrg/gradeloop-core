"""
Code Clone Detection Dataset Preparation Scripts

This package provides modules for generating code clone detection datasets
from the Project CodeNet dataset using Tree-sitter for code parsing.

Main Components:
- parser: PolyglotParser for multi-language code parsing
- indexer: Master index builder for CodeNet metadata
- clone_generators: Type-1 to Type-4 clone generators
- dataset_writer: Dataset generation pipeline
- config: Configuration management
"""

from .parser import PolyglotParser
from .indexer import (
    build_master_index,
    get_problem_stats,
    filter_index_by_min_submissions,
    get_language_distribution,
    print_index_summary
)
from .clone_generators import (
    generate_type1,
    generate_type2,
    generate_type3,
    get_type4_pairs,
    sample_clone_pairs
)
from .dataset_writer import generate_dataset, write_split_dataset
from .config import (
    LANGUAGES,
    CODENET_ROOT,
    OUTPUT_DIR,
    TARGET_PAIRS,
    CLONE_TYPE_RATIOS,
    SPLIT_RATIOS,
    validate_paths,
    print_config
)

__all__ = [
    # Parser
    'PolyglotParser',

    # Indexer
    'build_master_index',
    'get_problem_stats',
    'filter_index_by_min_submissions',
    'get_language_distribution',
    'print_index_summary',

    # Clone Generators
    'generate_type1',
    'generate_type2',
    'generate_type3',
    'get_type4_pairs',
    'sample_clone_pairs',

    # Dataset Writer
    'generate_dataset',
    'write_split_dataset',

    # Config
    'LANGUAGES',
    'CODENET_ROOT',
    'OUTPUT_DIR',
    'TARGET_PAIRS',
    'CLONE_TYPE_RATIOS',
    'SPLIT_RATIOS',
    'validate_paths',
    'print_config',
]

