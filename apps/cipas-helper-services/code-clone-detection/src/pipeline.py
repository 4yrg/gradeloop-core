"""
Main pipeline orchestrator for code clone detection.

Coordinates the entire pipeline from data loading to clone detection and output.
"""

import logging
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional

from .clone_detector import detect_clones
from .config_loader import Config
from .data_io import (
    load_clone_pairs,
    load_fragments,
    save_clone_pairs,
    save_dataset_metadata,
    save_fragments,
)
from .file_utils import scan_directory
from .llm_adapter import LLMAdapter, create_llm_adapter
from .logger import setup_logging
from .models import ClonePair, CodeFragment
from .parser import extract_fragments_from_file

logger = logging.getLogger(__name__)


class CloneDetectionPipeline:
    """
    Main pipeline orchestrator for code clone detection.
    
    Example:
        >>> config = Config.from_file("configs/pipeline_config.yaml")
        >>> pipeline = CloneDetectionPipeline(config)
        >>> results = pipeline.run()
    """
    
    def __init__(self, config: Config):
        """
        Initialize pipeline with configuration.
        
        Args:
            config: Configuration object
        """
        self.config = config
        self.fragments: List[CodeFragment] = []
        self.clone_pairs: List[ClonePair] = []
        self.llm_adapter: Optional[LLMAdapter] = None
        
        # Setup logging
        log_config = config.get("logging", {})
        setup_logging(
            level=log_config.get("level", "INFO"),
            log_file=log_config.get("file"),
            console=log_config.get("console", True)
        )
        
        logger.info("Initialized CloneDetectionPipeline")
    
    def run(self) -> Dict:
        """
        Run the complete pipeline.
        
        Returns:
            Dictionary with pipeline results and statistics
            
        Example:
            >>> results = pipeline.run()
            >>> print(f"Found {results['clone_count']} clones")
        """
        logger.info("=" * 60)
        logger.info("Starting Code Clone Detection Pipeline")
        logger.info("=" * 60)
        
        start_time = datetime.now()
        
        # Step 1: Load or extract fragments
        self.fragments = self._load_or_extract_fragments()
        
        # Step 2: Generate embeddings if needed
        if self.config.get("llm.enabled", False):
            self._generate_embeddings()
        
        # Step 3: Detect clones
        self.clone_pairs = self._detect_clones()
        
        # Step 4: Save results
        self._save_results()
        
        # Step 5: Generate metadata
        metadata = self._generate_metadata(start_time)
        
        logger.info("=" * 60)
        logger.info("Pipeline completed successfully")
        logger.info("=" * 60)
        
        return metadata
    
    def _load_or_extract_fragments(self) -> List[CodeFragment]:
        """Load existing fragments or extract from source files."""
        logger.info("Step 1: Loading/Extracting code fragments")
        
        data_source = self.config.get("data_source", {})
        source_type = data_source.get("type", "local")
        
        if source_type == "local":
            input_dir = data_source.get("input_dir", "data/raw")
            extensions = data_source.get("extensions", [".py"])
            
            logger.info(f"Scanning directory: {input_dir}")
            files = scan_directory(input_dir, extensions=extensions)
            logger.info(f"Found {len(files)} source files")
            
            # Extract fragments from files
            parser_config = self.config.get("parser", {})
            language = parser_config.get("language", "python")
            min_lines = parser_config.get("min_lines", 5)
            extract_functions = parser_config.get("extract_functions", True)
            extract_classes = parser_config.get("extract_classes", True)
            
            all_fragments: List[CodeFragment] = []
            for file_path in files:
                fragments = extract_fragments_from_file(
                    file_path,
                    language,
                    min_lines=min_lines,
                    extract_functions=extract_functions,
                    extract_classes=extract_classes
                )
                all_fragments.extend(fragments)
            
            logger.info(f"Extracted {len(all_fragments)} code fragments")
            return all_fragments
        
        else:
            raise ValueError(f"Unsupported data source type: {source_type}")
    
    def _generate_embeddings(self) -> None:
        """Generate semantic embeddings for fragments."""
        logger.info("Step 2: Generating semantic embeddings")
        
        if self.llm_adapter is None:
            llm_config = self.config.get("llm", {})
            provider = llm_config.get("provider", "mock")
            self.llm_adapter = create_llm_adapter(provider, llm_config)
        
        # Generate embeddings in batches
        batch_size = self.config.get("llm.batch_size", 10)
        texts = [frag.content for frag in self.fragments]
        
        for i in range(0, len(texts), batch_size):
            batch_texts = texts[i:i + batch_size]
            embeddings = self.llm_adapter.generate_embeddings_batch(batch_texts)
            
            for j, embedding in enumerate(embeddings):
                self.fragments[i + j].embedding = embedding
            
            logger.debug(f"Generated embeddings for batch {i // batch_size + 1}")
        
        logger.info(f"Generated embeddings for {len(self.fragments)} fragments")
    
    def _detect_clones(self) -> List[ClonePair]:
        """Detect clone pairs from fragments."""
        logger.info("Step 3: Detecting code clones")
        
        detection_config = self.config.get("clone_detection", {})
        threshold = detection_config.get("similarity_threshold", 0.85)
        
        # Determine methods to use
        features = self.config.get("features", {})
        methods: List[str] = []
        if features.get("token_based", True):
            methods.append("token")
        if features.get("ast_based", True):
            methods.append("ast")
        if features.get("semantic_based", False):
            methods.append("semantic")
        
        clone_pairs = detect_clones(
            self.fragments,
            threshold=threshold,
            methods=methods
        )
        
        logger.info(f"Detected {len(clone_pairs)} clone pairs")
        return clone_pairs
    
    def _save_results(self) -> None:
        """Save fragments and clone pairs to disk in Parquet format."""
        logger.info("Step 4: Saving results")
        
        output_config = self.config.get("output", {})
        compression = output_config.get("compression", "snappy")
        include_source = output_config.get("include_source", True)
        
        data_source = self.config.get("data_source", {})
        output_dir = Path(data_source.get("output_dir", "data/processed"))
        output_dir.mkdir(parents=True, exist_ok=True)
        
        # Save fragments
        if include_source:
            fragments_path = output_dir / "fragments.parquet"
            save_fragments(
                self.fragments,
                fragments_path,
                compression=compression
            )
        
        # Save clone pairs
        clones_path = output_dir / "clone_pairs.parquet"
        save_clone_pairs(
            self.clone_pairs,
            clones_path,
            compression=compression
        )
        
        logger.info(f"Results saved to {output_dir}")
    
    def _generate_metadata(self, start_time: datetime) -> Dict:
        """Generate dataset metadata."""
        logger.info("Step 5: Generating metadata")
        
        end_time = datetime.now()
        duration = (end_time - start_time).total_seconds()
        
        # Collect statistics
        languages = list(set(frag.language for frag in self.fragments))
        file_paths = list(set(frag.file_path for frag in self.fragments))
        
        clone_types = {}
        for pair in self.clone_pairs:
            clone_types[pair.clone_type] = clone_types.get(pair.clone_type, 0) + 1
        
        metadata = {
            "name": "code-clone-dataset",
            "version": "1.0",
            "created_at": end_time.isoformat(),
            "duration_seconds": duration,
            "total_fragments": len(self.fragments),
            "total_clone_pairs": len(self.clone_pairs),
            "languages": languages,
            "source_files": len(file_paths),
            "clone_types": clone_types,
            "config": self.config.to_dict()
        }
        
        # Save metadata
        data_source = self.config.get("data_source", {})
        output_dir = Path(data_source.get("output_dir", "data/processed"))
        metadata_path = output_dir / "metadata.json"
        save_dataset_metadata(metadata, metadata_path)
        
        logger.info(f"Metadata saved to {metadata_path}")
        return metadata


def run_pipeline_from_config(config_path: str | Path) -> Dict:
    """
    Convenience function to run pipeline from config file.
    
    Args:
        config_path: Path to configuration YAML file
        
    Returns:
        Pipeline results dictionary
        
    Example:
        >>> results = run_pipeline_from_config("configs/pipeline_config.yaml")
        >>> print(f"Detected {results['total_clone_pairs']} clones")
    """
    config = Config.from_file(config_path)
    pipeline = CloneDetectionPipeline(config)
    return pipeline.run()
