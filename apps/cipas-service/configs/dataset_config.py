"""
Dataset configuration for code clone detection.
"""

# Supported programming languages for dataset preparation
LANGUAGES = ["java", "python", "c", "cpp", "go", "javascript", "c_sharp"]

# Path to the Project CodeNet dataset root directory
CODENET_ROOT = "/app/code-clone-detection/dataset-prep/raw_data/Project_CodeNet"

# Output directory for processed dataset
OUTPUT_DIR = "/app/code-clone-detection/dataset-prep/processed"

# Target number of code pairs to generate
TARGET_PAIRS = 100_000

# Problem ranges for train/validation/test splits
TRAIN_PROBLEMS = range(0, 2500)
VAL_PROBLEMS = range(2501, 3000)
TEST_PROBLEMS = range(3001, 4000)
