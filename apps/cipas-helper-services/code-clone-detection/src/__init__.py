"""
Code Clone Detection Dataset Pipeline

A modular pipeline for creating high-quality code clone datasets with support
for extraction, preprocessing, generation, validation, balancing, and export.

Main modules:
- utils: Shared utilities (config, logging, file I/O)
- extract: Code fragment extraction
- preprocess: Data cleaning and normalization
- generation: Clone pair generation
- negatives: Negative sample generation
- validation: Quality validation
- balancing: Dataset balancing
- export: Export to various formats
"""

__version__ = "0.1.0"

# Legacy imports for backward compatibility
from .clone_detector import detect_clones
from .config_loader import Config, load_yaml_config
from .data_io import (
    load_clone_pairs,
    load_fragments,
    save_clone_pairs,
    save_fragments,
)
from .file_utils import scan_directory
from .llm_adapter import LLMAdapter, create_llm_adapter
from .models import ClonePair, CodeFragment, CodeMetrics
from .parser import extract_fragments_from_file
from .pipeline import CloneDetectionPipeline, run_pipeline_from_config

__all__ = [
    # Main pipeline
    "CloneDetectionPipeline",
    "run_pipeline_from_config",
    # Models
    "CodeFragment",
    "ClonePair",
    "CodeMetrics",
    # Config
    "Config",
    "load_yaml_config",
    # Parser
    "extract_fragments_from_file",
    # Clone detection
    "detect_clones",
    # File utilities
    "scan_directory",
    # Data I/O
    "save_fragments",
    "load_fragments",
    "save_clone_pairs",
    "load_clone_pairs",
    # LLM
    "LLMAdapter",
    "create_llm_adapter",
]
