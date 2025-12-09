"""
Code Clone Detection Pipeline

A modular pipeline for detecting code clones across multiple programming languages.
"""

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

__version__ = "0.1.0"

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
