# tests/test_inference_service.py
import asyncio
import pickle
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock, patch

import faiss
import numpy as np
import pytest
import torch
from transformers import AutoModel, AutoTokenizer

from ..services.inference_service import InferenceService, EMBEDDINGS_DIR
from ..scripts.train_encoder import TrainingConfig # To mock ContrastiveEncoder pooling


# --- Fixtures for mocking dependencies ---

@pytest.fixture
def mock_model_and_tokenizer(mocker):
    """Mocks AutoModel and AutoTokenizer loading."""
    mock_tokenizer = mocker.MagicMock(spec=AutoTokenizer)
    mock_tokenizer.side_effect = lambda text, **kwargs: {
        'input_ids': torch.tensor([[1, 2, 3] + [0]*(256-3)]),
        'attention_mask': torch.tensor([[1, 1, 1] + [0]*(256-3)])
    }
    mock_tokenizer.model_max_length = 256 # for ContrastiveEncoder init
    
    mock_model = mocker.MagicMock(spec=AutoModel)
    mock_model.eval.return_value = mock_model # for chaining .eval().to()
    mock_model.to.return_value = mock_model
    mock_model.return_value = mocker.MagicMock(last_hidden_state=torch.randn(1, 256, 768)) # For outputs

    mocker.patch("gradeloop-core.apps.model-orchestrator.app.models.cipas.code_clone_detection.services.inference_service.AutoTokenizer.from_pretrained", return_value=mock_tokenizer)
    mocker.patch("gradeloop-core.apps.model-orchestrator.app.models.cipas.code_clone_detection.services.inference_service.AutoModel.from_pretrained", return_value=mock_model)
    
    # Mock the pooling logic from ContrastiveEncoder
    mocker.patch(
        "gradeloop-core.apps.model-orchestrator.app.models.cipas.code_clone_detection.services.inference_service.ContrastiveEncoder.pooler",
        new_callable=mocker.PropertyMock,
        return_value=lambda embeddings, attention_mask: torch.randn(embeddings.shape[0], 768) # Return dummy pooled embeddings
    )

    return mock_model, mock_tokenizer

@pytest.fixture
def mock_faiss_index_and_map(tmp_path, mocker):
    """Creates dummy FAISS index and sid map files."""
    faiss_path = tmp_path / "faiss_index.bin"
    sid_map_path = tmp_path / "sid_map.pkl"

    # Create dummy FAISS index
    dummy_index = faiss.IndexFlatIP(768) # Assuming 768-dim embeddings
    dummy_embeddings = np.array([np.random.rand(768) for _ in range(5)], dtype=np.float32)
    dummy_index.add(dummy_embeddings)
    faiss.write_index(dummy_index, str(faiss_path))

    # Create dummy SID map
    dummy_sids = ["subA", "subB", "subC", "subD", "subE"]
    with open(sid_map_path, "wb") as f:
        pickle.dump(dummy_sids, f)
    
    # Mock faiss.read_index
    mocker.patch("gradeloop-core.apps.model-orchestrator.app.models.cipas.code_clone_detection.services.inference_service.faiss.read_index", return_value=dummy_index)
    
    # Mock the paths within the InferenceService module
    with patch("gradeloop-core.apps.model-orchestrator.app.models.cipas.code_clone_detection.services.inference_service.FAISS_INDEX_PATH", faiss_path),
         patch("gradeloop-core.apps.model-orchestrator.app.models.cipas.code_clone_detection.services.inference_service.SID_MAP_PATH", sid_map_path),
         patch("gradeloop-core.apps.model-orchestrator.app.models.cipas.code_clone_detection.services.inference_service.MODEL_CHECKPOINT_PATH", tmp_path / "dummy_model_path"):
        yield faiss_path, sid_map_path, dummy_index, dummy_sids


# --- Tests ---

def test_inference_service_init(mock_model_and_tokenizer, mock_faiss_index_and_map):
    """Tests that the InferenceService initializes correctly."""
    service = InferenceService()
    assert service.tokenizer is not None
    assert service.model is not None
    assert service.faiss_index is not None
    assert service.sid_map is not None
    assert len(service.sid_map) == service.faiss_index.ntotal


def test_embed_code(mock_model_and_tokenizer, mock_faiss_index_and_map):
    """Tests that embed_code returns a valid embedding."""
    service = InferenceService()
    code = "public class Test { }"
    embedding = service.embed_code(code)
    assert isinstance(embedding, np.ndarray)
    assert embedding.shape == (768,) # Assuming 768-dim embeddings


@pytest.mark.asyncio
async def test_retrieve(mocker, mock_model_and_tokenizer, mock_faiss_index_and_map):
    """Tests that retrieve returns correct results from FAISS search."""
    faiss_path, sid_map_path, dummy_index, dummy_sids = mock_faiss_index_and_map
    
    service = InferenceService()
    
    # Mock the embed_code method to return a dummy query embedding
    mocker.patch.object(service, 'embed_code', return_value=np.random.rand(768).astype(np.float32))
    
    # Mock the FAISS search method to return predictable results
    # Query for top 2
    dummy_distances = np.array([[0.1, 0.2]], dtype=np.float32) # Lower distance means higher similarity for L2, higher for IP
    dummy_indices = np.array([[1, 0]], dtype=np.int64) # subB and subA are closest
    dummy_index.search.return_value = (dummy_distances, dummy_indices)
    
    results = await service.retrieve("query code", k=2)
    
    assert len(results) == 2
    assert results[0] == ("subB", 0.1) # Assuming IP, so higher distance means lower similarity
    assert results[1] == ("subA", 0.2) # FAISS returns actual distances


def test_rebuild_index_placeholder(mocker, mock_model_and_tokenizer, mock_faiss_index_and_map):
    """Tests the rebuild_index method, which is currently a placeholder."""
    faiss_path, sid_map_path, _, _ = mock_faiss_index_and_map
    service = InferenceService()
    
    # Ensure index and map files exist initially
    assert faiss_path.exists()
    assert sid_map_path.exists()

    # Mock os.remove
    mocker.patch("os.remove")
    
    # Call rebuild
    service.rebuild_index(
        embeddings_dir=EMBEDDINGS_DIR,
        index_type="flat",
        nlist=100,
        metric="ip"
    )
    
    # Verify that os.remove was called
    os.remove.assert_any_call(faiss_path)
    os.remove.assert_any_call(sid_map_path)
    
    # Verify service state is cleared
    assert service.faiss_index is None
    assert service.sid_map is None
