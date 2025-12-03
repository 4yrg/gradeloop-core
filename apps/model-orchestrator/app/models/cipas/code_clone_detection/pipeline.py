#!/usr/bin/env python3
"""
Unified Clone Detection Pipeline Orchestrator.

This module orchestrates the end-to-end clone detection pipeline from T1 to T4,
ensuring proper sequencing, dependency management, and incremental execution.

Pipeline Stages:
1. Data Ingestion (assumes already done)
2. Normalization (assumes already done)
3. Tokenization (assumes already done)
4. AST Extraction (assumes already done)
5. T1/T2 Clone Detection (hash-based)
6. T3 Clone Detection (AST similarity)
7. T4 Clone Detection (execution-based)

Each stage executes only if its outputs do not already exist, enabling
efficient re-execution and debugging.
"""

import logging
import subprocess
import sys
from pathlib import Path
from typing import Optional
import yaml

from utils import (
    PathManager,
    file_exists_and_nonempty,
    ensure_dir
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class PipelineStage:
    """
    Represents a single stage in the clone detection pipeline.
    
    Each stage has:
    - Name and description
    - Input dependencies (files that must exist)
    - Output artifacts (files that will be created)
    - Execution script
    """
    
    def __init__(
        self,
        name: str,
        description: str,
        script_path: Path,
        input_dependencies: list[Path],
        output_artifacts: list[Path]
    ):
        """
        Initialize pipeline stage.
        
        Args:
            name: Stage name (e.g., "T1/T2 Detection")
            description: Human-readable description
            script_path: Path to Python script to execute
            input_dependencies: Files that must exist before execution
            output_artifacts: Files that will be created by this stage
        """
        self.name = name
        self.description = description
        self.script_path = script_path
        self.input_dependencies = input_dependencies
        self.output_artifacts = output_artifacts
    
    def can_skip(self) -> bool:
        """
        Check if stage can be skipped (outputs already exist).
        
        Returns:
            True if all output artifacts exist and are non-empty
        """
        return all(file_exists_and_nonempty(artifact) for artifact in self.output_artifacts)
    
    def has_inputs(self) -> bool:
        """
        Check if all input dependencies are satisfied.
        
        Returns:
            True if all input files exist
        """
        missing = [dep for dep in self.input_dependencies if not dep.exists()]
        if missing:
            logger.warning(f"Stage '{self.name}' missing inputs: {[str(m) for m in missing]}")
        return len(missing) == 0
    
    def execute(self) -> bool:
        """
        Execute the stage by running its script.
        
        Returns:
            True if execution succeeded
        """
        logger.info(f"Executing stage: {self.name}")
        logger.info(f"Description: {self.description}")
        logger.info(f"Script: {self.script_path}")
        
        try:
            # Execute script using current Python interpreter
            result = subprocess.run(
                [sys.executable, str(self.script_path)],
                cwd=self.script_path.parent.parent,  # Run from project root
                check=True,
                capture_output=True,
                text=True
            )
            
            logger.info(f"Stage '{self.name}' completed successfully")
            if result.stdout:
                logger.debug(f"Output:\n{result.stdout}")
            
            return True
        
        except subprocess.CalledProcessError as e:
            logger.error(f"Stage '{self.name}' failed with exit code {e.returncode}")
            logger.error(f"Error output:\n{e.stderr}")
            if e.stdout:
                logger.error(f"Standard output:\n{e.stdout}")
            return False
        
        except Exception as e:
            logger.error(f"Unexpected error in stage '{self.name}': {e}")
            return False


class CloneDetectionPipeline:
    """
    Main pipeline orchestrator for T1 → T4 clone detection.
    
    This class manages the execution flow, ensuring:
    - Stages execute in correct order
    - Dependencies are satisfied
    - Outputs are only regenerated when necessary
    - Proper error handling and logging
    """
    
    def __init__(self, base_dir: Path, config_path: Optional[Path] = None):
        """
        Initialize pipeline.
        
        Args:
            base_dir: Root directory of clone detection project
            config_path: Optional path to pipeline configuration YAML
        """
        self.base_dir = Path(base_dir)
        self.paths = PathManager(self.base_dir)
        
        # Load configuration
        if config_path and config_path.exists():
            with open(config_path, 'r') as f:
                self.config = yaml.safe_load(f)
        else:
            self.config = self._default_config()
        
        # Scripts directory
        self.scripts_dir = self.base_dir / "scripts"
        
        # Initialize stages
        self.stages = self._create_stages()
    
    def _default_config(self) -> dict:
        """
        Get default pipeline configuration.
        
        Returns:
            Default config dict
        """
        return {
            'language': 'java',
            'force_rerun': False,
            'stop_on_error': True,
            'stages': {
                'data_ingestion': {'enabled': True},
                'normalization': {'enabled': True},
                'tokenization': {'enabled': True},
                'ast_extraction': {'enabled': True},
                't1_t2_detection': {'enabled': True},
                't3_detection': {'enabled': True},
                't4_detection': {'enabled': True}
            }
        }
    
    def _create_stages(self) -> list[PipelineStage]:
        """
        Create pipeline stages with dependencies.
        
        Returns:
            List of PipelineStage objects in execution order
        """
        language = self.config.get('language', 'java')
        
        stages = []
        
        # Stage 1: Data Ingestion
        # Outputs: data/raw/java/*, data/metadata/codenet_index.json
        if self.config['stages']['data_ingestion']['enabled']:
            stages.append(PipelineStage(
                name="Data Ingestion",
                description="Ingest source code from Project CodeNet dataset",
                script_path=self.scripts_dir / "data_ingest.py",
                input_dependencies=[],
                output_artifacts=[self.paths.get_codenet_index_path()]
            ))
        
        # Stage 2: Normalization
        # Inputs: data/raw/java/*
        # Outputs: data/normalized/java/*
        if self.config['stages']['normalization']['enabled']:
            stages.append(PipelineStage(
                name="Code Normalization",
                description="Normalize source code (remove whitespace, comments)",
                script_path=self.scripts_dir / "java_normalize.py",
                input_dependencies=[self.paths.get_codenet_index_path()],
                output_artifacts=[self.paths.normalized_dir / language]
            ))
        
        # Stage 3: Tokenization
        # Inputs: data/normalized/java/*
        # Outputs: data/tokens/java/*
        if self.config['stages']['tokenization']['enabled']:
            stages.append(PipelineStage(
                name="Tokenization",
                description="Generate token streams using javalang",
                script_path=self.scripts_dir / "java_tokenize.py",
                input_dependencies=[self.paths.normalized_dir / language],
                output_artifacts=[self.paths.tokens_dir / language]
            ))
        
        # Stage 4: AST Extraction
        # Inputs: data/normalized/java/*
        # Outputs: data/ast/java/*
        if self.config['stages']['ast_extraction']['enabled']:
            stages.append(PipelineStage(
                name="AST Extraction",
                description="Extract Abstract Syntax Trees using tree-sitter",
                script_path=self.scripts_dir / "java_ast_extract.py",
                input_dependencies=[self.paths.normalized_dir / language],
                output_artifacts=[self.paths.ast_dir / language]
            ))
        
        # Stage 5: T1/T2 Detection
        # Inputs: data/normalized/java/*, data/tokens/java/*
        # Outputs: data/metadata/t1_t2_hashes.json, t1_pairs.csv, t2_pairs.csv
        if self.config['stages']['t1_t2_detection']['enabled']:
            stages.append(PipelineStage(
                name="T1/T2 Detection",
                description="Detect exact (T1) and renamed (T2) clones using hashing",
                script_path=self.scripts_dir / "t1_t2_clone_hashing.py",
                input_dependencies=[
                    self.paths.normalized_dir / language,
                    self.paths.tokens_dir / language
                ],
                output_artifacts=[
                    self.paths.get_t1_t2_hashes_path(),
                    self.paths.get_t1_pairs_path(),
                    self.paths.get_t2_pairs_path()
                ]
            ))
        
        # Stage 6: T3 Detection
        # Inputs: data/ast/java/*, data/metadata/t1_t2_hashes.json
        # Outputs: data/metadata/t3_pairs.csv, t3_similarity.json
        if self.config['stages']['t3_detection']['enabled']:
            stages.append(PipelineStage(
                name="T3 Detection",
                description="Detect similar clones with modifications using AST similarity",
                script_path=self.scripts_dir / "t3_detect_clones.py",
                input_dependencies=[
                    self.paths.ast_dir / language,
                    self.paths.get_t1_t2_hashes_path()
                ],
                output_artifacts=[
                    self.paths.get_t3_pairs_path(),
                    self.paths.metadata_dir / "t3_similarity.json"
                ]
            ))
        
        # Stage 7: T4 Detection
        # Inputs: data/raw/java/*, t1_pairs.csv, t2_pairs.csv, t3_pairs.csv
        # Outputs: data/metadata/t4_pairs.csv
        if self.config['stages']['t4_detection']['enabled']:
            stages.append(PipelineStage(
                name="T4 Detection",
                description="Detect semantic clones using execution-based validation",
                script_path=self.scripts_dir / "t4_detect_clones.py",
                input_dependencies=[
                    self.paths.raw_dir / language,
                    self.paths.get_t1_pairs_path(),
                    self.paths.get_t2_pairs_path(),
                    self.paths.get_t3_pairs_path()
                ],
                output_artifacts=[
                    self.paths.get_t4_pairs_path()
                ]
            ))
        
        return stages
    
    def run(self) -> bool:
        """
        Execute the complete pipeline.
        
        Returns:
            True if all stages completed successfully
        """
        logger.info("="*80)
        logger.info("CLONE DETECTION PIPELINE")
        logger.info("="*80)
        logger.info(f"Base directory: {self.base_dir}")
        logger.info(f"Language: {self.config.get('language', 'java')}")
        logger.info(f"Total stages: {len(self.stages)}")
        logger.info("="*80)
        
        force_rerun = self.config.get('force_rerun', False)
        stop_on_error = self.config.get('stop_on_error', True)
        
        for i, stage in enumerate(self.stages, 1):
            logger.info(f"\n[Stage {i}/{len(self.stages)}] {stage.name}")
            logger.info(f"Description: {stage.description}")
            
            # Check if stage can be skipped
            if not force_rerun and stage.can_skip():
                logger.info(f"✓ Skipping stage (outputs already exist)")
                continue
            
            # Check input dependencies
            if not stage.has_inputs():
                logger.error(f"✗ Stage cannot execute: missing input dependencies")
                if stop_on_error:
                    return False
                continue
            
            # Execute stage
            success = stage.execute()
            
            if not success:
                logger.error(f"✗ Stage failed")
                if stop_on_error:
                    logger.error("Pipeline stopped due to stage failure")
                    return False
                logger.warning("Continuing despite stage failure")
            else:
                logger.info(f"✓ Stage completed successfully")
        
        logger.info("\n" + "="*80)
        logger.info("PIPELINE COMPLETED")
        logger.info("="*80)
        
        return True
    
    def get_stage_status(self) -> dict:
        """
        Get status of all stages.
        
        Returns:
            Dict with stage names as keys and status info as values
        """
        status = {}
        
        for stage in self.stages:
            status[stage.name] = {
                'can_skip': stage.can_skip(),
                'has_inputs': stage.has_inputs(),
                'output_artifacts': [str(a) for a in stage.output_artifacts],
                'missing_artifacts': [
                    str(a) for a in stage.output_artifacts 
                    if not file_exists_and_nonempty(a)
                ]
            }
        
        return status


def run_pipeline(language: str = "java", config_path: Optional[str] = None) -> None:
    """
    Public API for running the clone detection pipeline.
    
    Args:
        language: Programming language to process (default: 'java')
        config_path: Optional path to pipeline configuration YAML
    
    Examples:
        >>> from pipeline import run_pipeline
        >>> run_pipeline("java")
        >>> run_pipeline("java", "data/configs/pipeline.yaml")
    """
    # Determine base directory
    script_path = Path(__file__).resolve()
    base_dir = script_path.parent
    
    # Load or create config
    if config_path:
        config_file = Path(config_path)
    else:
        config_file = base_dir / "data" / "configs" / "pipeline.yaml"
    
    # Initialize and run pipeline
    pipeline = CloneDetectionPipeline(base_dir, config_file)
    success = pipeline.run()
    
    if not success:
        logger.error("Pipeline execution failed")
        sys.exit(1)


def main():
    """Main entry point when run as script."""
    import argparse
    
    parser = argparse.ArgumentParser(
        description="Unified Clone Detection Pipeline (T1 → T4)"
    )
    parser.add_argument(
        '--language',
        type=str,
        default='java',
        help='Programming language to process (default: java)'
    )
    parser.add_argument(
        '--config',
        type=str,
        help='Path to pipeline configuration YAML'
    )
    parser.add_argument(
        '--status',
        action='store_true',
        help='Show pipeline status without executing'
    )
    
    args = parser.parse_args()
    
    # Determine base directory
    script_path = Path(__file__).resolve()
    base_dir = script_path.parent
    
    # Load config
    config_file = Path(args.config) if args.config else None
    
    # Initialize pipeline
    pipeline = CloneDetectionPipeline(base_dir, config_file)
    
    # Show status if requested
    if args.status:
        status = pipeline.get_stage_status()
        print("\nPipeline Stage Status:")
        print("="*80)
        for stage_name, info in status.items():
            print(f"\n{stage_name}:")
            print(f"  Can skip: {info['can_skip']}")
            print(f"  Has inputs: {info['has_inputs']}")
            if info['missing_artifacts']:
                print(f"  Missing artifacts:")
                for artifact in info['missing_artifacts']:
                    print(f"    - {artifact}")
        print("\n" + "="*80)
        return
    
    # Run pipeline
    success = pipeline.run()
    
    if not success:
        sys.exit(1)


if __name__ == '__main__':
    main()
