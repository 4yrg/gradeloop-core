#!/usr/bin/env python3
"""
Main script for Type-3 Clone Detection.

This script orchestrates the entire T3 clone detection pipeline:
1. Load configuration
2. Load AST metadata and T1/T2 results
3. Compute AST similarities using tree edit distance
4. Identify clone pairs
5. Save results

Usage:
    python t3_detect_clones.py [--config CONFIG_PATH]
    
Examples:
    # Use default config
    python t3_detect_clones.py
    
    # Use custom config
    python t3_detect_clones.py --config my_config.yaml
    
    # Override threshold via environment variable
    DETECTION_SIMILARITY_THRESHOLD=0.8 python t3_detect_clones.py
"""

import sys
import argparse
import logging
from pathlib import Path
from typing import Dict, Any, Optional
import yaml
from pydantic import BaseModel, Field
from pydantic_settings import BaseSettings

# Add parent directory to path for imports
sys.path.append(str(Path(__file__).parent))

from t3_clone_detection import T3CloneDetector, T3Config


class InputConfig(BaseModel):
    """Input configuration."""
    ast_root: str = "data/ast/java"
    t1_t2_hashes: Optional[str] = "data/metadata/t1_t2_hashes.json"


class OutputConfig(BaseModel):
    """Output configuration."""
    metadata_dir: str = "data/metadata"
    similarity_json: str = "data/metadata/t3_similarity.json"
    pairs_csv: str = "data/metadata/t3_pairs.csv"
    statistics_json: str = "data/metadata/t3_statistics.json"


class DetectionConfig(BaseModel):
    """Detection parameters."""
    similarity_threshold: float = 0.7
    max_size_ratio: float = 3.0
    enable_problem_grouping: bool = True
    enable_parallel: bool = True
    max_workers: Optional[int] = None


class TreeEditDistanceConfig(BaseModel):
    """Tree edit distance cost configuration."""
    insert_cost: float = 1.0
    delete_cost: float = 1.0
    rename_cost: float = 1.0


class PerformanceConfig(BaseModel):
    """Performance settings."""
    ast_cache_size: int = 1000
    progress_bar_refresh: float = 0.1


class LoggingConfig(BaseModel):
    """Logging configuration."""
    level: str = "INFO"
    format: str = "%(asctime)s - %(levelname)s - %(message)s"
    file: Optional[str] = None


class T3DetectionSettings(BaseSettings):
    """Main configuration using pydantic-settings."""
    input: InputConfig = Field(default_factory=InputConfig)
    output: OutputConfig = Field(default_factory=OutputConfig)
    detection: DetectionConfig = Field(default_factory=DetectionConfig)
    tree_edit_distance: TreeEditDistanceConfig = Field(default_factory=TreeEditDistanceConfig)
    performance: PerformanceConfig = Field(default_factory=PerformanceConfig)
    logging: LoggingConfig = Field(default_factory=LoggingConfig)
    reproducibility: Dict[str, Any] = Field(default_factory=lambda: {"seed": 42})
    
    class Config:
        env_prefix = "DETECTION_"
        env_nested_delimiter = "_"


def load_config(config_path: Optional[Path] = None) -> T3DetectionSettings:
    """
    Load configuration from YAML file and environment variables.
    
    Priority (highest to lowest):
    1. Environment variables (DETECTION_*)
    2. YAML configuration file
    3. Default values
    
    Args:
        config_path: Path to YAML config file (optional)
        
    Returns:
        Loaded configuration settings
    """
    if config_path and config_path.exists():
        with open(config_path, 'r') as f:
            config_dict = yaml.safe_load(f)
        
        # Create settings from dict
        return T3DetectionSettings(**config_dict)
    else:
        # Use defaults and environment variables
        return T3DetectionSettings()


def setup_logging(log_config: LoggingConfig) -> None:
    """Configure logging based on settings."""
    log_level = getattr(logging, log_config.level.upper(), logging.INFO)
    
    logging_kwargs = {
        'level': log_level,
        'format': log_config.format
    }
    
    if log_config.file:
        logging_kwargs['filename'] = log_config.file
        logging_kwargs['filemode'] = 'a'
    
    logging.basicConfig(**logging_kwargs)


def validate_paths(settings: T3DetectionSettings, base_dir: Path) -> bool:
    """
    Validate that required input paths exist.
    
    Args:
        settings: Configuration settings
        base_dir: Base directory for relative paths
        
    Returns:
        True if all required paths exist
    """
    logger = logging.getLogger(__name__)
    
    # Check AST root
    ast_root = base_dir / settings.input.ast_root
    if not ast_root.exists():
        logger.error(f"AST root directory not found: {ast_root}")
        return False
    
    # Check T1/T2 hashes (optional but warn if missing)
    if settings.input.t1_t2_hashes:
        t1_t2_path = base_dir / settings.input.t1_t2_hashes
        if not t1_t2_path.exists():
            logger.warning(f"T1/T2 hashes file not found: {t1_t2_path} (will proceed without filtering)")
            settings.input.t1_t2_hashes = None
    
    return True


def main():
    """Main entry point for T3 clone detection."""
    # Parse command-line arguments
    parser = argparse.ArgumentParser(
        description='Type-3 Clone Detection using AST Similarity',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Use default configuration
  python t3_detect_clones.py
  
  # Use custom configuration file
  python t3_detect_clones.py --config custom_config.yaml
  
  # Override similarity threshold
  DETECTION_SIMILARITY_THRESHOLD=0.8 python t3_detect_clones.py
  
  # Disable parallel processing
  DETECTION_ENABLE_PARALLEL=false python t3_detect_clones.py
        """
    )
    
    parser.add_argument(
        '--config',
        type=Path,
        default=Path('data/configs/t3_detection.yaml'),
        help='Path to YAML configuration file (default: data/configs/t3_detection.yaml)'
    )
    
    parser.add_argument(
        '--base-dir',
        type=Path,
        default=Path.cwd(),
        help='Base directory for relative paths (default: current directory)'
    )
    
    args = parser.parse_args()
    
    # Load configuration
    config_path = args.base_dir / args.config if not args.config.is_absolute() else args.config
    settings = load_config(config_path if config_path.exists() else None)
    
    # Setup logging
    setup_logging(settings.logging)
    logger = logging.getLogger(__name__)
    
    logger.info("=" * 80)
    logger.info("Type-3 Clone Detection Pipeline")
    logger.info("=" * 80)
    logger.info(f"Base directory: {args.base_dir}")
    logger.info(f"Configuration: {config_path if config_path.exists() else 'defaults + environment'}")
    logger.info(f"Similarity threshold: {settings.detection.similarity_threshold}")
    logger.info(f"Problem grouping: {settings.detection.enable_problem_grouping}")
    logger.info(f"Parallel processing: {settings.detection.enable_parallel}")
    logger.info("=" * 80)
    
    # Validate paths
    if not validate_paths(settings, args.base_dir):
        logger.error("Path validation failed. Exiting.")
        sys.exit(1)
    
    # Create T3Config from settings
    t3_config = T3Config(
        similarity_threshold=settings.detection.similarity_threshold,
        max_size_ratio=settings.detection.max_size_ratio,
        insert_cost=settings.tree_edit_distance.insert_cost,
        delete_cost=settings.tree_edit_distance.delete_cost,
        rename_cost=settings.tree_edit_distance.rename_cost,
        enable_problem_grouping=settings.detection.enable_problem_grouping,
        enable_parallel=settings.detection.enable_parallel,
        max_workers=settings.detection.max_workers
    )
    
    # Initialize detector
    detector = T3CloneDetector(t3_config)
    detector.cache_size_limit = settings.performance.ast_cache_size
    
    # Resolve paths
    ast_root = args.base_dir / settings.input.ast_root
    t1_t2_hashes = args.base_dir / settings.input.t1_t2_hashes if settings.input.t1_t2_hashes else None
    output_dir = args.base_dir / settings.output.metadata_dir
    
    try:
        # Step 1: Load metadata
        logger.info("Step 1/3: Loading file metadata and T1/T2 results...")
        detector.load_file_metadata(ast_root, t1_t2_hashes)
        
        # Step 2: Detect clones
        logger.info("Step 2/3: Computing AST similarities and detecting clones...")
        detector.detect_clones()
        
        # Step 3: Save results
        logger.info("Step 3/3: Saving results...")
        detector.save_results(output_dir)
        
        # Summary
        logger.info("=" * 80)
        logger.info("Detection Complete!")
        logger.info(f"Total files processed: {len(detector.file_metadata)}")
        logger.info(f"Total comparisons: {len(detector.similarity_scores)}")
        logger.info(f"Clone pairs found: {len(detector.clone_pairs)}")
        logger.info(f"Results saved to: {output_dir}")
        logger.info("=" * 80)
        
        # Show top clones
        if detector.clone_pairs:
            logger.info("\nTop 10 clone pairs by similarity:")
            for i, (file_id1, file_id2, similarity) in enumerate(detector.clone_pairs[:10], 1):
                logger.info(f"  {i}. {file_id1} <-> {file_id2} : {similarity:.4f}")
        
        return 0
    
    except Exception as e:
        logger.exception(f"Error during detection: {e}")
        return 1


if __name__ == "__main__":
    sys.exit(main())
