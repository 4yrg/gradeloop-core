# tests/test_build_faiss_index.py
import asyncio
import json
import pickle
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock, patch

import faiss
import numpy as np
import pytest
import typer
from typer.testing import CliRunner

from ..scripts.build_faiss_index import (
    app,
    _get_embedding_data_from_db,
    _save_index,
    _load_index,
    EMBEDDINGS_DIR,
    FAISS_INDEX_PATH,
    SID_MAP_PATH,
)

runner = CliRunner()

# --- Fixtures for mocked data and paths ---

@pytest.fixture
def mock_embeddings_dir(tmp_path):
    """Creates a temporary embeddings directory with dummy files."""
    test_embeddings_dir = tmp_path / "embeddings_test"
    test_embeddings_dir.mkdir()

    # Create dummy embeddings.npy
    dummy_embeddings = np.array([[1.0, 2.0, 3.0], [4.0, 5.0, 6.0], [7.0, 8.0, 9.0]], dtype=np.float32)
    np.save(test_embeddings_dir / "part_0.npy", dummy_embeddings)

    # Create dummy sids.json
    dummy_sids = ["sub_0", "sub_1", "sub_2"]
    with open(test_embeddings_dir / "part_0.json", "w") as f:
        json.dump(dummy_sids, f)

    # Create another part for add command test
    dummy_embeddings_2 = np.array([[10.0, 11.0, 12.0]], dtype=np.float32)
    np.save(test_embeddings_dir / "part_1.npy", dummy_embeddings_2)
    dummy_sids_2 = ["sub_3"]
    with open(test_embeddings_dir / "part_1.json", "w") as f:
        json.dump(dummy_sids_2, f)

    # Patch EMBEDDINGS_DIR to point to our test directory
    with patch("gradeloop-core.apps.model-orchestrator.app.models.cipas.code_clone_detection.scripts.build_faiss_index.EMBEDDINGS_DIR", test_embeddings_dir):
        yield test_embeddings_dir


@pytest.fixture
def mock_faiss_index_paths(tmp_path):
    """Provides temporary paths for FAISS index and SID map."""
    mock_index_path = tmp_path / "test_faiss_index.bin"
    mock_sid_map_path = tmp_path / "test_sid_map.pkl"
    with patch("gradeloop-core.apps.model-orchestrator.app.models.cipas.code_clone_detection.scripts.build_faiss_index.FAISS_INDEX_PATH", mock_index_path), \
         patch("gradeloop-core.apps.model-orchestrator.app.models.cipas.code_clone_detection.scripts.build_faiss_index.SID_MAP_PATH", mock_sid_map_path):
        yield mock_index_path, mock_sid_map_path


# --- Tests for internal helpers ---

async def test_get_embedding_data_from_db_loads_correctly(mock_embeddings_dir):
    embeddings, sids = await _get_embedding_data_from_db()
    assert len(sids) == 4 # Both parts should be loaded
    assert embeddings.shape == (4, 3)
    assert sids == ["sub_0", "sub_1", "sub_2", "sub_3"]


async def test_save_and_load_index(mock_faiss_index_paths):
    index_path, sid_map_path = mock_faiss_index_paths
    
    dummy_index = faiss.IndexFlatIP(3)
    dummy_index.add(np.array([[1.0, 1.0, 1.0]], dtype=np.float32))
    dummy_sids = ["sub_test"]

    _save_index(dummy_index, dummy_sids, index_path, sid_map_path)

    loaded_index, loaded_sids = _load_index(index_path, sid_map_path)

    assert loaded_index.ntotal == dummy_index.ntotal
    assert loaded_sids == dummy_sids


# --- Tests for CLI commands ---

@pytest.mark.asyncio
async def test_build_command_flat_index(mock_embeddings_dir, mock_faiss_index_paths):
    index_path, sid_map_path = mock_faiss_index_paths
    
    result = runner.invoke(app, [
        "build",
        "--index-path", str(index_path),
        "--sid-map-path", str(sid_map_path),
        "--index-type", "flat",
        "--metric", "ip",
        "--overwrite" # Ensure we can run it multiple times if needed
    ])
    
    assert result.exit_code == 0
    assert "FAISS index built successfully." in result.stdout
    assert index_path.exists()
    assert sid_map_path.exists()

    index, sids = _load_index(index_path, sid_map_path)
    assert index.ntotal == 4 # 4 embeddings loaded from mock_embeddings_dir
    assert index.d == 3 # Embedding dimension
    assert isinstance(index, faiss.IndexFlatIP)


@pytest.mark.asyncio
async def test_build_command_ivf_index(mock_embeddings_dir, mock_faiss_index_paths):
    index_path, sid_map_path = mock_faiss_index_paths

    result = runner.invoke(app, [
        "build",
        "--index-path", str(index_path),
        "--sid-map-path", str(sid_map_path),
        "--index-type", "ivf",
        "--nlist", "2", # Small nlist for testing
        "--metric", "l2",
        "--overwrite"
    ])
    
    assert result.exit_code == 0
    assert "FAISS index built successfully." in result.stdout
    assert index_path.exists()
    assert sid_map_path.exists()

    index, sids = _load_index(index_path, sid_map_path)
    assert index.ntotal == 4
    assert isinstance(index, faiss.IndexIVFFlat)
    assert index.nlist == 2


@pytest.mark.asyncio
async def test_add_command(mock_embeddings_dir, mock_faiss_index_paths):
    index_path, sid_map_path = mock_faiss_index_paths

    # First, build an initial index
    runner.invoke(app, [
        "build",
        "--index-path", str(index_path),
        "--sid-map-path", str(sid_map_path),
        "--index-type", "flat",
        "--overwrite",
        "--limit", "3", # Only build with the first 3 embeddings
    ])
    initial_index, initial_sids = _load_index(index_path, sid_map_path)
    assert initial_index.ntotal == 3
    assert initial_sids == ["sub_0", "sub_1", "sub_2"]

    # Now, add new embeddings
    new_embeddings_file = mock_embeddings_dir / "part_1.npy"
    new_sids_file = mock_embeddings_dir / "part_1.json"

    result = runner.invoke(app, [
        "add",
        str(new_embeddings_file),
        str(new_sids_file),
        "--index-path", str(index_path),
        "--sid-map-path", str(sid_map_path),
    ])

    assert result.exit_code == 0
    assert "Added 1 new embeddings" in result.stdout

    updated_index, updated_sids = _load_index(index_path, sid_map_path)
    assert updated_index.ntotal == 4
    assert updated_sids == ["sub_0", "sub_1", "sub_2", "sub_3"]


@pytest.mark.asyncio
async def test_rebuild_command(mock_embeddings_dir, mock_faiss_index_paths):
    index_path, sid_map_path = mock_faiss_index_paths

    # Create a dummy old index file
    (index_path.parent).mkdir(exist_ok=True)
    with open(index_path, "w") as f: f.write("old index")
    with open(sid_map_path, "w") as f: f.write("old sids")

    result = runner.invoke(app, [
        "rebuild",
        "--index-path", str(index_path),
        "--sid-map-path", str(sid_map_path),
        "--index-type", "flat",
    ])
    
    assert result.exit_code == 0
    assert "FAISS index built successfully." in result.stdout
    assert index_path.exists()
    assert sid_map_path.exists()

    index, sids = _load_index(index_path, sid_map_path)
    assert index.ntotal == 4
    assert sids == ["sub_0", "sub_1", "sub_2", "sub_3"]
