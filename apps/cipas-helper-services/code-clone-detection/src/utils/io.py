"""
I/O utilities for the code clone detection pipeline.

Provides functions for reading/writing YAML, Parquet, JSONL files,
and directory management with proper error handling and logging.
"""

import json
import logging
from pathlib import Path
from typing import Any, Dict, List

import pandas as pd
import yaml

logger = logging.getLogger(__name__)


def read_yaml(path: str) -> Dict[str, Any]:
    """
    Read YAML configuration file.
    
    Args:
        path: Path to the YAML file
        
    Returns:
        Dictionary containing YAML data
        
    Raises:
        FileNotFoundError: If file doesn't exist
        yaml.YAMLError: If YAML parsing fails
        
    Example:
        >>> config = read_yaml("configs/clones_config.yaml")
        >>> print(config['languages'])
        ['java', 'python']
    """
    file_path = Path(path)
    
    if not file_path.exists():
        logger.error(f"YAML file not found: {path}")
        raise FileNotFoundError(f"YAML file not found: {path}")
    
    logger.debug(f"Reading YAML file: {path}")
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = yaml.safe_load(f)
        
        if data is None:
            logger.warning(f"Empty YAML file: {path}")
            data = {}
        
        logger.info(f"Successfully read YAML file: {path}")
        return data
        
    except yaml.YAMLError as e:
        logger.error(f"Failed to parse YAML file {path}: {e}")
        raise
    except Exception as e:
        logger.error(f"Error reading YAML file {path}: {e}")
        raise


def write_parquet(df: pd.DataFrame, path: str) -> None:
    """
    Write DataFrame to Parquet file using PyArrow.
    
    Args:
        df: Pandas DataFrame to write
        path: Output file path
        
    Raises:
        ValueError: If DataFrame is empty or invalid
        IOError: If write operation fails
        
    Example:
        >>> df = pd.DataFrame({'col1': [1, 2], 'col2': [3, 4]})
        >>> write_parquet(df, "data/output/dataset.parquet")
    """
    if df is None or df.empty:
        logger.warning(f"Attempting to write empty DataFrame to {path}")
    
    file_path = Path(path)
    
    # Ensure parent directory exists
    ensure_dir(str(file_path.parent))
    
    logger.debug(f"Writing {len(df)} rows to Parquet file: {path}")
    
    try:
        df.to_parquet(
            file_path,
            engine='pyarrow',
            compression='snappy',
            index=False
        )
        logger.info(f"Successfully wrote Parquet file: {path} ({len(df)} rows)")
        
    except Exception as e:
        logger.error(f"Failed to write Parquet file {path}: {e}")
        raise IOError(f"Failed to write Parquet file: {e}")


def ensure_dir(path: str) -> None:
    """
    Ensure directory exists, create if it doesn't.
    
    Args:
        path: Directory path to create
        
    Example:
        >>> ensure_dir("data/work/extracted")
        >>> # Directory is now guaranteed to exist
    """
    dir_path = Path(path)
    
    if dir_path.exists():
        if not dir_path.is_dir():
            logger.error(f"Path exists but is not a directory: {path}")
            raise NotADirectoryError(f"Path exists but is not a directory: {path}")
        logger.debug(f"Directory already exists: {path}")
        return
    
    try:
        dir_path.mkdir(parents=True, exist_ok=True)
        logger.info(f"Created directory: {path}")
        
    except Exception as e:
        logger.error(f"Failed to create directory {path}: {e}")
        raise


def read_jsonl(path: str) -> List[Dict[str, Any]]:
    """
    Read JSONL (JSON Lines) file.
    
    Each line in the file should contain a valid JSON object.
    
    Args:
        path: Path to the JSONL file
        
    Returns:
        List of dictionaries, one per line
        
    Raises:
        FileNotFoundError: If file doesn't exist
        json.JSONDecodeError: If line contains invalid JSON
        
    Example:
        >>> items = read_jsonl("data/fragments.jsonl")
        >>> print(f"Read {len(items)} items")
        Read 100 items
    """
    file_path = Path(path)
    
    if not file_path.exists():
        logger.error(f"JSONL file not found: {path}")
        raise FileNotFoundError(f"JSONL file not found: {path}")
    
    logger.debug(f"Reading JSONL file: {path}")
    
    items: List[Dict[str, Any]] = []
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            for line_num, line in enumerate(f, 1):
                line = line.strip()
                
                # Skip empty lines
                if not line:
                    continue
                
                try:
                    item = json.loads(line)
                    items.append(item)
                    
                except json.JSONDecodeError as e:
                    logger.error(f"Invalid JSON at line {line_num} in {path}: {e}")
                    raise json.JSONDecodeError(
                        f"Invalid JSON at line {line_num}",
                        line,
                        e.pos
                    )
        
        logger.info(f"Successfully read {len(items)} items from JSONL file: {path}")
        return items
        
    except Exception as e:
        logger.error(f"Error reading JSONL file {path}: {e}")
        raise


def write_jsonl(items: List[Dict[str, Any]], path: str) -> None:
    """
    Write list of dictionaries to JSONL (JSON Lines) file.
    
    Each dictionary is written as a JSON object on a separate line.
    
    Args:
        items: List of dictionaries to write
        path: Output file path
        
    Raises:
        ValueError: If items list is invalid
        IOError: If write operation fails
        
    Example:
        >>> items = [{'id': 1, 'name': 'foo'}, {'id': 2, 'name': 'bar'}]
        >>> write_jsonl(items, "data/output/items.jsonl")
    """
    if not isinstance(items, list):
        logger.error(f"items must be a list, got {type(items)}")
        raise ValueError(f"items must be a list, got {type(items)}")
    
    if not items:
        logger.warning(f"Attempting to write empty list to {path}")
    
    file_path = Path(path)
    
    # Ensure parent directory exists
    ensure_dir(str(file_path.parent))
    
    logger.debug(f"Writing {len(items)} items to JSONL file: {path}")
    
    try:
        with open(file_path, 'w', encoding='utf-8') as f:
            for item in items:
                if not isinstance(item, dict):
                    logger.warning(f"Non-dict item in list: {type(item)}")
                
                json_line = json.dumps(item, ensure_ascii=False)
                f.write(json_line + '\n')
        
        logger.info(f"Successfully wrote {len(items)} items to JSONL file: {path}")
        
    except Exception as e:
        logger.error(f"Failed to write JSONL file {path}: {e}")
        raise IOError(f"Failed to write JSONL file: {e}")


def read_parquet(path: str) -> pd.DataFrame:
    """
    Read Parquet file into DataFrame.
    
    Args:
        path: Path to the Parquet file
        
    Returns:
        Pandas DataFrame
        
    Raises:
        FileNotFoundError: If file doesn't exist
        
    Example:
        >>> df = read_parquet("data/processed/dataset.parquet")
        >>> print(len(df))
        1000
    """
    file_path = Path(path)
    
    if not file_path.exists():
        logger.error(f"Parquet file not found: {path}")
        raise FileNotFoundError(f"Parquet file not found: {path}")
    
    logger.debug(f"Reading Parquet file: {path}")
    
    try:
        df = pd.read_parquet(file_path, engine='pyarrow')
        logger.info(f"Successfully read Parquet file: {path} ({len(df)} rows)")
        return df
        
    except Exception as e:
        logger.error(f"Failed to read Parquet file {path}: {e}")
        raise


def write_yaml(data: Dict[str, Any], path: str) -> None:
    """
    Write dictionary to YAML file.
    
    Args:
        data: Dictionary to write
        path: Output file path
        
    Example:
        >>> config = {'languages': ['java', 'python']}
        >>> write_yaml(config, "configs/output.yaml")
    """
    file_path = Path(path)
    
    # Ensure parent directory exists
    ensure_dir(str(file_path.parent))
    
    logger.debug(f"Writing YAML file: {path}")
    
    try:
        with open(file_path, 'w', encoding='utf-8') as f:
            yaml.safe_dump(data, f, default_flow_style=False, sort_keys=False)
        
        logger.info(f"Successfully wrote YAML file: {path}")
        
    except Exception as e:
        logger.error(f"Failed to write YAML file {path}: {e}")
        raise IOError(f"Failed to write YAML file: {e}")
