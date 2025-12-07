"""
Configuration management for code clone detection dataset preparation.

This module centralizes all configuration parameters including dataset paths,
supported languages, and dataset generation settings. Configuration values
can be overridden via environment variables for flexibility across environments.
"""

import os
from pathlib import Path

# Supported programming languages for dataset preparation
LANGUAGES = ["java", "python", "c", "cpp", "go", "javascript", "c_sharp"]

# Path to the Project CodeNet dataset root directory
# Override with environment variable: CODENET_ROOT
CODENET_ROOT = os.getenv(
    'CODENET_ROOT',
    '/home/dasunwickr/SLIIT/Y4S1/4YRG/Datasets/Project_CodeNet'
)

# Output directory for processed dataset
# Override with environment variable: OUTPUT_DIR
OUTPUT_DIR = os.getenv(
    'OUTPUT_DIR',
    '/home/dasunwickr/SLIIT/Y4S1/4YRG/Datasets/processed_clones'
)

# Target number of code pairs to generate (total across all splits)
TARGET_PAIRS = int(os.getenv('TARGET_PAIRS', '100000'))

# Clone type distribution ratios (must sum to 1.0)
CLONE_TYPE_RATIOS = {
    'type1': 0.10,   # 10% - Exact copies with whitespace/comment variations
    'type2': 0.20,   # 20% - Renamed identifiers
    'type3': 0.10,   # 10% - Structural modifications
    'type4': 0.10,   # 10% - Semantically similar, syntactically different
    'negative_easy': 0.25,  # 25% - Different problems
    'negative_hard': 0.25,  # 25% - Same problem, low similarity
}

# Dataset split ratios
SPLIT_RATIOS = {
    'train': 0.60,  # 60% for training
    'val': 0.20,    # 20% for validation
    'test': 0.20,   # 20% for testing
}

# Minimum code size (in bytes) for valid submissions
MIN_CODE_SIZE = 50

# Type-4 clone detection threshold (Jaccard similarity)
# Pairs with similarity below this are considered Type-4 clones
TYPE4_THRESHOLD = 0.4

# Maximum pairs per problem to avoid clustering
MAX_PAIRS_PER_PROBLEM = 5


def validate_paths():
    """
    Validate that required paths exist and are accessible.

    Raises:
        FileNotFoundError: If CodeNet root or required subdirectories don't exist
    """
    codenet_path = Path(CODENET_ROOT)
    if not codenet_path.exists():
        raise FileNotFoundError(
            f"CodeNet root directory not found: {CODENET_ROOT}\n"
            f"Set CODENET_ROOT environment variable to the correct path."
        )

    metadata_path = codenet_path / "metadata"
    if not metadata_path.exists():
        raise FileNotFoundError(
            f"CodeNet metadata directory not found: {metadata_path}\n"
            f"Ensure the CodeNet dataset is properly extracted."
        )

    data_path = codenet_path / "data"
    if not data_path.exists():
        raise FileNotFoundError(
            f"CodeNet data directory not found: {data_path}\n"
            f"Ensure the CodeNet dataset is properly extracted."
        )


def get_output_path(filename: str) -> Path:
    """
    Get full output path for a file, creating directories if needed.

    Args:
        filename: Name of the output file

    Returns:
        Path object for the output file
    """
    output_path = Path(OUTPUT_DIR)
    output_path.mkdir(parents=True, exist_ok=True)
    return output_path / filename


def print_config():
    """Print current configuration for debugging."""
    print("=" * 80)
    print("CONFIGURATION")
    print("=" * 80)
    print(f"CodeNet Root:     {CODENET_ROOT}")
    print(f"Output Directory: {OUTPUT_DIR}")
    print(f"Languages:        {', '.join(LANGUAGES)}")
    print(f"Target Pairs:     {TARGET_PAIRS:,}")
    print(f"\nClone Type Ratios:")
    for clone_type, ratio in CLONE_TYPE_RATIOS.items():
        print(f"  {clone_type:15s}: {ratio:.1%}")
    print(f"\nSplit Ratios:")
    for split, ratio in SPLIT_RATIOS.items():
        print(f"  {split:6s}: {ratio:.1%}")
    print("=" * 80)

