#!/usr/bin/env python3
"""
Setup Verification Script

Verifies that the code clone detection pipeline is properly configured
and all necessary directories and files are in place.
"""

import sys
from pathlib import Path

def check_directory(path: Path, description: str) -> bool:
    """Check if a directory exists."""
    if path.exists() and path.is_dir():
        print(f"✓ {description}: {path}")
        return True
    else:
        print(f"✗ {description}: {path} - NOT FOUND")
        return False

def check_file(path: Path, description: str) -> bool:
    """Check if a file exists."""
    if path.exists() and path.is_file():
        print(f"✓ {description}: {path}")
        return True
    else:
        print(f"✗ {description}: {path} - NOT FOUND")
        return False

def check_config_loadable(config_path: Path) -> bool:
    """Check if a config file is loadable."""
    try:
        from src.config_loader import load_yaml_config
        config = load_yaml_config(config_path)
        print(f"✓ Config {config_path.name} is valid and loadable")
        return True
    except Exception as e:
        print(f"✗ Config {config_path.name} failed to load: {e}")
        return False

def main():
    """Run all verification checks."""
    print("=" * 70)
    print("Code Clone Detection Pipeline - Setup Verification")
    print("=" * 70)
    print()
    
    project_root = Path(__file__).parent
    all_checks_passed = True
    
    # Check data directories
    print("Checking Data Directories:")
    print("-" * 70)
    data_dirs = [
        (project_root / "data/raw", "Raw data directory"),
        (project_root / "data/raw/java", "Java raw data directory"),
        (project_root / "data/raw/python", "Python raw data directory"),
        (project_root / "data/work", "Working directory"),
        (project_root / "data/work/extracted", "Extracted work directory"),
        (project_root / "data/work/preprocessed", "Preprocessed work directory"),
        (project_root / "data/work/generated", "Generated work directory"),
        (project_root / "data/work/validated", "Validated work directory"),
        (project_root / "data/tmp", "Temporary directory"),
        (project_root / "data/output", "Output directory"),
        (project_root / "data/output/parquet", "Parquet output directory"),
        (project_root / "data/output/csv", "CSV output directory"),
        (project_root / "data/output/json", "JSON output directory"),
        (project_root / "data/processed", "Processed data directory"),
        (project_root / "data/processed/clones", "Clones output directory"),
        (project_root / "data/logs", "Logs directory"),
        (project_root / "data/logs/pipeline", "Pipeline logs directory"),
        (project_root / "data/logs/validation", "Validation logs directory"),
        (project_root / "data/logs/generation", "Generation logs directory"),
        (project_root / "data/cache", "Cache directory"),
        (project_root / "data/checkpoints", "Checkpoints directory"),
        (project_root / "data/metadata", "Metadata directory"),
        (project_root / "data/export", "Export directory"),
    ]
    
    for dir_path, description in data_dirs:
        if not check_directory(dir_path, description):
            all_checks_passed = False
    
    print()
    
    # Check configuration files
    print("Checking Configuration Files:")
    print("-" * 70)
    config_files = [
        (project_root / "configs/paths.yaml", "Paths configuration"),
        (project_root / "configs/pipeline_config.yaml", "Pipeline configuration"),
        (project_root / "configs/clones_config.yaml", "Clones configuration"),
        (project_root / "configs/models.yaml", "Models configuration"),
        (project_root / "configs/schema.yaml", "Schema configuration"),
    ]
    
    for config_path, description in config_files:
        if not check_file(config_path, description):
            all_checks_passed = False
    
    print()
    
    # Check if configs are loadable
    print("Checking Configuration Validity:")
    print("-" * 70)
    for config_path, _ in config_files:
        if config_path.exists():
            if not check_config_loadable(config_path):
                all_checks_passed = False
    
    print()
    
    # Check source directories
    print("Checking Source Directories:")
    print("-" * 70)
    src_dirs = [
        (project_root / "src", "Main source directory"),
        (project_root / "src/utils", "Utils directory"),
        (project_root / "src/extract", "Extract directory"),
        (project_root / "src/preprocess", "Preprocess directory"),
        (project_root / "src/generation", "Generation directory"),
        (project_root / "src/negatives", "Negatives directory"),
        (project_root / "src/validation", "Validation directory"),
        (project_root / "src/balancing", "Balancing directory"),
        (project_root / "src/export", "Export directory"),
    ]
    
    for dir_path, description in src_dirs:
        if not check_directory(dir_path, description):
            all_checks_passed = False
    
    print()
    
    # Summary
    print("=" * 70)
    if all_checks_passed:
        print("✓ All checks passed! Setup is complete and ready for use.")
        print()
        print("Next Steps:")
        print("  1. Place your raw code data in data/raw/java or data/raw/python")
        print("  2. Review and adjust configs/pipeline_config.yaml as needed")
        print("  3. Run the pipeline: python -m src.pipeline")
        print("  4. Check output in data/output/ or data/processed/")
    else:
        print("✗ Some checks failed. Please review the errors above.")
        print()
        print("To fix:")
        print("  1. Run: python scripts/init_project.py")
        print("  2. Re-run this verification script")
    print("=" * 70)
    
    return 0 if all_checks_passed else 1

if __name__ == "__main__":
    sys.exit(main())
