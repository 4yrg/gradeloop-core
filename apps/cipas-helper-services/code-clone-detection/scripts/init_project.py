#!/usr/bin/env python3
"""
Project initialization script for Code Clone Detection Pipeline.

This script creates the necessary directory structure for the project.
It is idempotent - safe to run multiple times without causing issues.

Usage:
    python scripts/init_project.py
"""

import os
import sys
from pathlib import Path


def create_directory(path: Path, description: str = "") -> None:
    """
    Create directory if it doesn't exist.
    
    Args:
        path: Directory path to create
        description: Optional description of the directory purpose
    """
    if path.exists():
        print(f"✓ Directory already exists: {path}")
    else:
        path.mkdir(parents=True, exist_ok=True)
        print(f"✓ Created directory: {path}")
    
    if description:
        print(f"  → {description}")


def create_init_file(directory: Path) -> None:
    """
    Create __init__.py file in directory if it doesn't exist.
    
    Args:
        directory: Directory path where __init__.py should be created
    """
    init_file = directory / "__init__.py"
    if not init_file.exists():
        init_file.write_text('"""\nPackage initialization.\n"""\n')
        print(f"  ✓ Created {init_file.name}")


def create_readme_stub(directory: Path, title: str) -> None:
    """
    Create README.md stub in directory if it doesn't exist.
    
    Args:
        directory: Directory path where README.md should be created
        title: Title for the README
    """
    readme_file = directory / "README.md"
    if not readme_file.exists():
        content = f"# {title}\n\nPlaceholder for {title.lower()} documentation.\n"
        readme_file.write_text(content)
        print(f"  ✓ Created {readme_file.name}")


def main():
    """Main initialization function."""
    print("=" * 70)
    print("Code Clone Detection Pipeline - Project Initialization")
    print("=" * 70)
    print()
    
    # Get project root (parent of scripts directory)
    script_dir = Path(__file__).parent
    project_root = script_dir.parent
    
    print(f"Project root: {project_root}")
    print()
    
    # Define directory structure
    directories = {
        "src": "Main source code directory",
        "src/utils": "Shared utilities (config, logging, file I/O)",
        "src/extract": "Code fragment extraction modules",
        "src/preprocess": "Data cleaning and normalization",
        "src/generation": "Clone pair generation",
        "src/negatives": "Negative sample generation",
        "src/validation": "Quality validation modules",
        "src/balancing": "Dataset balancing utilities",
        "src/export": "Export to various formats",
        "scripts": "Utility scripts",
        "notebooks": "Jupyter notebooks for exploration",
        "configs": "Configuration files",
        "tests": "Test directory",
        "tests/unit": "Unit tests",
        "data": "Data directory",
        "data/raw": "Input source code",
        "data/processed": "Output datasets",
        "logs": "Log files",
    }
    
    print("Creating directory structure...")
    print()
    
    # Create directories
    for dir_path, description in directories.items():
        full_path = project_root / dir_path
        create_directory(full_path, description)
        
        # Create __init__.py in Python package directories
        if dir_path.startswith("src/") or dir_path == "src":
            create_init_file(full_path)
        
        # Create README stubs in major directories
        if dir_path in ["notebooks", "tests/unit"]:
            title = dir_path.split("/")[-1].replace("_", " ").title()
            create_readme_stub(full_path, title)
    
    print()
    print("=" * 70)
    print("✓ Project initialization complete!")
    print("=" * 70)
    print()
    print("Next steps:")
    print("  1. Install dependencies: pip install -r requirements.txt")
    print("  2. Configure pipeline: edit configs/pipeline_config.yaml")
    print("  3. Run tests: pytest tests/")
    print("  4. Explore notebooks: jupyter notebook notebooks/")
    print()


if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)
