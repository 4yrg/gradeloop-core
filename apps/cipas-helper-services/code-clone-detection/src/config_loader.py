"""
Configuration loader utility.

Loads and validates YAML configuration files for the pipeline.
"""

import logging
from pathlib import Path
from typing import Any, Dict, Optional

import yaml

logger = logging.getLogger(__name__)


def load_yaml_config(config_path: str | Path) -> Dict[str, Any]:
    """
    Load YAML configuration file.
    
    Args:
        config_path: Path to the YAML configuration file
        
    Returns:
        Dictionary containing configuration data
        
    Raises:
        FileNotFoundError: If config file doesn't exist
        yaml.YAMLError: If config file is invalid YAML
    """
    config_path = Path(config_path)
    
    if not config_path.exists():
        raise FileNotFoundError(f"Config file not found: {config_path}")
    
    logger.info(f"Loading configuration from {config_path}")
    
    with open(config_path, 'r', encoding='utf-8') as f:
        config = yaml.safe_load(f)
    
    if config is None:
        config = {}
    
    logger.debug(f"Loaded configuration: {config}")
    return config


def get_nested_value(config: Dict[str, Any], key_path: str, default: Any = None) -> Any:
    """
    Get nested value from configuration dictionary using dot notation.
    
    Args:
        config: Configuration dictionary
        key_path: Dot-separated path (e.g., "llm.provider")
        default: Default value if key not found
        
    Returns:
        Value at the specified path or default
        
    Example:
        >>> config = {"llm": {"provider": "openai"}}
        >>> get_nested_value(config, "llm.provider")
        'openai'
    """
    keys = key_path.split('.')
    value = config
    
    for key in keys:
        if isinstance(value, dict) and key in value:
            value = value[key]
        else:
            return default
    
    return value


def merge_configs(base_config: Dict[str, Any], override_config: Dict[str, Any]) -> Dict[str, Any]:
    """
    Merge two configuration dictionaries (override takes precedence).
    
    Args:
        base_config: Base configuration
        override_config: Configuration to override base
        
    Returns:
        Merged configuration dictionary
    """
    merged = base_config.copy()
    
    for key, value in override_config.items():
        if key in merged and isinstance(merged[key], dict) and isinstance(value, dict):
            # Recursively merge nested dictionaries
            merged[key] = merge_configs(merged[key], value)
        else:
            merged[key] = value
    
    return merged


def validate_config(config: Dict[str, Any], required_keys: list[str]) -> bool:
    """
    Validate that required keys exist in configuration.
    
    Args:
        config: Configuration dictionary to validate
        required_keys: List of required key paths (dot notation)
        
    Returns:
        True if all required keys exist
        
    Raises:
        ValueError: If required key is missing
    """
    for key_path in required_keys:
        value = get_nested_value(config, key_path)
        if value is None:
            raise ValueError(f"Required configuration key missing: {key_path}")
    
    logger.info("Configuration validation passed")
    return True


class Config:
    """
    Configuration container with convenient access methods.
    
    Example:
        >>> config = Config.from_file("configs/pipeline_config.yaml")
        >>> provider = config.get("llm.provider", "mock")
    """
    
    def __init__(self, data: Dict[str, Any]):
        """Initialize with configuration data."""
        self._data = data
    
    @classmethod
    def from_file(cls, config_path: str | Path) -> "Config":
        """Create Config instance from YAML file."""
        data = load_yaml_config(config_path)
        return cls(data)
    
    def get(self, key_path: str, default: Any = None) -> Any:
        """Get configuration value using dot notation."""
        return get_nested_value(self._data, key_path, default)
    
    def to_dict(self) -> Dict[str, Any]:
        """Return configuration as dictionary."""
        return self._data.copy()
    
    def __repr__(self) -> str:
        return f"Config({self._data})"
