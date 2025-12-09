"""
Data persistence utilities.

Handles reading and writing datasets in various formats (CSV, Parquet, JSON).
"""

import json
import logging
from pathlib import Path
from typing import Any, Dict, List, Optional

import pandas as pd

from .models import ClonePair, CodeFragment

logger = logging.getLogger(__name__)


def save_fragments(
    fragments: List[CodeFragment],
    output_path: str | Path,
    format: str = "parquet",
    compression: Optional[str] = "snappy"
) -> None:
    """
    Save code fragments to file.
    
    Args:
        fragments: List of CodeFragment objects
        output_path: Output file path
        format: Output format (parquet, csv, json)
        compression: Compression type for parquet
        
    Example:
        >>> save_fragments(fragments, "data/fragments.parquet", format="parquet")
    """
    output_path = Path(output_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    
    # Convert to list of dicts
    data = [frag.to_dict() for frag in fragments]
    
    if format == "parquet":
        df = pd.DataFrame(data)
        df.to_parquet(output_path, compression=compression, index=False)
        logger.info(f"Saved {len(fragments)} fragments to {output_path} (parquet)")
    
    elif format == "csv":
        df = pd.DataFrame(data)
        df.to_csv(output_path, index=False)
        logger.info(f"Saved {len(fragments)} fragments to {output_path} (csv)")
    
    elif format == "json":
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2)
        logger.info(f"Saved {len(fragments)} fragments to {output_path} (json)")
    
    else:
        raise ValueError(f"Unsupported format: {format}")


def load_fragments(
    input_path: str | Path,
    format: Optional[str] = None
) -> List[CodeFragment]:
    """
    Load code fragments from file.
    
    Args:
        input_path: Input file path
        format: Input format (auto-detected if None)
        
    Returns:
        List of CodeFragment objects
        
    Example:
        >>> fragments = load_fragments("data/fragments.parquet")
        >>> len(fragments)
        100
    """
    input_path = Path(input_path)
    
    if not input_path.exists():
        raise FileNotFoundError(f"File not found: {input_path}")
    
    # Auto-detect format
    if format is None:
        format = input_path.suffix[1:]  # Remove leading dot
    
    if format == "parquet":
        df = pd.read_parquet(input_path)
        data = df.to_dict('records')
    
    elif format == "csv":
        df = pd.read_csv(input_path)
        data = df.to_dict('records')
    
    elif format == "json":
        with open(input_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
    
    else:
        raise ValueError(f"Unsupported format: {format}")
    
    # Convert to CodeFragment objects
    fragments = [CodeFragment.from_dict(item) for item in data]
    logger.info(f"Loaded {len(fragments)} fragments from {input_path}")
    
    return fragments


def save_clone_pairs(
    clone_pairs: List[ClonePair],
    output_path: str | Path,
    format: str = "parquet",
    compression: Optional[str] = "snappy"
) -> None:
    """
    Save clone pairs to file.
    
    Args:
        clone_pairs: List of ClonePair objects
        output_path: Output file path
        format: Output format (parquet, csv, json)
        compression: Compression type for parquet
    """
    output_path = Path(output_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    
    data = [pair.to_dict() for pair in clone_pairs]
    
    if format == "parquet":
        df = pd.DataFrame(data)
        df.to_parquet(output_path, compression=compression, index=False)
        logger.info(f"Saved {len(clone_pairs)} clone pairs to {output_path} (parquet)")
    
    elif format == "csv":
        df = pd.DataFrame(data)
        df.to_csv(output_path, index=False)
        logger.info(f"Saved {len(clone_pairs)} clone pairs to {output_path} (csv)")
    
    elif format == "json":
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2)
        logger.info(f"Saved {len(clone_pairs)} clone pairs to {output_path} (json)")
    
    else:
        raise ValueError(f"Unsupported format: {format}")


def load_clone_pairs(
    input_path: str | Path,
    format: Optional[str] = None
) -> List[ClonePair]:
    """
    Load clone pairs from file.
    
    Args:
        input_path: Input file path
        format: Input format (auto-detected if None)
        
    Returns:
        List of ClonePair objects
    """
    input_path = Path(input_path)
    
    if not input_path.exists():
        raise FileNotFoundError(f"File not found: {input_path}")
    
    if format is None:
        format = input_path.suffix[1:]
    
    if format == "parquet":
        df = pd.read_parquet(input_path)
        data = df.to_dict('records')
    
    elif format == "csv":
        df = pd.read_csv(input_path)
        data = df.to_dict('records')
    
    elif format == "json":
        with open(input_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
    
    else:
        raise ValueError(f"Unsupported format: {format}")
    
    clone_pairs = [ClonePair.from_dict(item) for item in data]
    logger.info(f"Loaded {len(clone_pairs)} clone pairs from {input_path}")
    
    return clone_pairs


def save_dataset_metadata(
    metadata: Dict[str, Any],
    output_path: str | Path
) -> None:
    """
    Save dataset metadata to JSON file.
    
    Args:
        metadata: Metadata dictionary
        output_path: Output file path
    """
    output_path = Path(output_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(metadata, f, indent=2, default=str)
    
    logger.info(f"Saved metadata to {output_path}")


def load_dataset_metadata(input_path: str | Path) -> Dict[str, Any]:
    """
    Load dataset metadata from JSON file.
    
    Args:
        input_path: Input file path
        
    Returns:
        Metadata dictionary
    """
    input_path = Path(input_path)
    
    if not input_path.exists():
        raise FileNotFoundError(f"File not found: {input_path}")
    
    with open(input_path, 'r', encoding='utf-8') as f:
        metadata = json.load(f)
    
    logger.info(f"Loaded metadata from {input_path}")
    return metadata
