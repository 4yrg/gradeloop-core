"""
Unit tests for configuration loader.
"""

import tempfile
from pathlib import Path

import pytest

from src.config_loader import (
    Config,
    get_nested_value,
    load_yaml_config,
    merge_configs,
    validate_config,
)


def test_load_yaml_config():
    """Test loading YAML configuration."""
    with tempfile.NamedTemporaryFile(mode='w', suffix='.yaml', delete=False) as f:
        f.write("""
data_source:
  type: local
  input_dir: data/raw
logging:
  level: DEBUG
""")
        config_path = f.name
    
    try:
        config = load_yaml_config(config_path)
        assert config["data_source"]["type"] == "local"
        assert config["logging"]["level"] == "DEBUG"
    finally:
        Path(config_path).unlink()


def test_get_nested_value():
    """Test getting nested values from config."""
    config = {
        "data_source": {
            "type": "local",
            "input_dir": "data/raw"
        }
    }
    
    assert get_nested_value(config, "data_source.type") == "local"
    assert get_nested_value(config, "data_source.input_dir") == "data/raw"
    assert get_nested_value(config, "nonexistent.key", "default") == "default"


def test_merge_configs():
    """Test merging configurations."""
    base = {
        "data_source": {"type": "local"},
        "logging": {"level": "INFO"}
    }
    override = {
        "data_source": {"input_dir": "data/new"},
        "logging": {"level": "DEBUG"}
    }
    
    merged = merge_configs(base, override)
    assert merged["data_source"]["type"] == "local"
    assert merged["data_source"]["input_dir"] == "data/new"
    assert merged["logging"]["level"] == "DEBUG"


def test_validate_config():
    """Test configuration validation."""
    config = {
        "data_source": {"type": "local"},
        "logging": {"level": "INFO"}
    }
    
    # Should pass
    assert validate_config(config, ["data_source.type", "logging.level"])
    
    # Should fail
    with pytest.raises(ValueError):
        validate_config(config, ["nonexistent.key"])


def test_config_class():
    """Test Config class."""
    data = {"llm": {"provider": "mock", "model": "test"}}
    config = Config(data)
    
    assert config.get("llm.provider") == "mock"
    assert config.get("llm.model") == "test"
    assert config.get("nonexistent", "default") == "default"
    assert config.to_dict() == data
