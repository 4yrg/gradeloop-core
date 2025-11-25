# tests/test_hard_negative_mining.py
import pytest
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock, patch
import pandas as pd
import numpy as np
import csv

from ..scripts.hard_negative_mining import (
    mine_hard_negatives,
    _get_all_submission_code,
    compute_all_embeddings,
    TrainingConfig, # To instantiate ContrastiveEncoder
)
from ..models import Submission
from ..db import AsyncSessionLocal # Needed for _get_all_submission_code
from ..storage import get_storage # Needed for _get_all_submission_code
from ..scripts.train_encoder import ContrastiveEncoder # Needed for pooling logic

# Mark all tests in this file as asyncio
pytestmark = pytest.mark.asyncio

# --- Mock Data ---

@pytest.fixture
def mock_t4_pairs_csv(tmp_path):
    """Creates a dummy T4 pairs CSV file."""
    csv_path = tmp_path / "t4_validated_pairs.csv"
    data = [
        ["sub1", "sub2", "p001", "Java", "T4"],
        ["sub1", "sub3", "p001", "Java", "T4"], # sub3 is also a positive for sub1
        ["sub4", "sub5", "p002", "Python", "T4"],
    ]
    with open(csv_path, "w", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(["submission_id_1", "submission_id_2", "problem_id", "language", "clone_type"])
        writer.writerows(data)
    return csv_path

@pytest.fixture
def mock_submission_contents():
    """Mocks the content for various submission IDs."""
    return {
        "sub1": "code for sub1",
        "sub2": "code for sub2",
        "sub3": "code for sub3",
        "sub4": "code for sub4",
        "sub5": "code for sub5",
        "neg1": "code for neg1",
        "neg2": "code for neg2",
        "neg3": "code for neg3",
    }

@pytest.fixture
def mock_db_and_storage(mock_submission_contents):
    """Mocks the database and storage interactions."""
    # Mock AsyncSessionLocal and its enter/exit for `_get_all_submission_code`
    mock_session_instance = AsyncMock(spec=AsyncSession)
    
    async def mock_execute(query):
        mock_result = MagicMock()
        mock_scalars = MagicMock()
        sids_in_query = []
        # A very basic way to extract sids from a SQLAlchemy query string
        query_str = str(query)
        for sid in mock_submission_contents.keys():
            if f"'{sid}'" in query_str:
                sids_in_query.append(sid)
        
        db_subs = []
        for sid in sids_in_query:
            mock_sub = MagicMock(spec=Submission)
            mock_sub.id = sid
            mock_sub.artifact_uri = sid # Use sid as artifact_uri for this mock
            db_subs.append(mock_sub)
        
        mock_scalars.all.return_value = db_subs
        mock_result.scalars.return_value = mock_scalars
        return mock_result

    mock_session_instance.execute.side_effect = mock_execute
    mock_session_instance.close = AsyncMock()
    
    # Mock get_storage
    mock_storage_instance = AsyncMock()
    async def mock_load(artifact_uri):
        return mock_submission_contents.get(artifact_uri, b"").encode("utf-8")
    mock_storage_instance.load.side_effect = mock_load

    with patch("gradeloop-core.apps.model-orchestrator.app.models.cipas.code_clone_detection.scripts.hard_negative_mining.AsyncSessionLocal", return_value=mock_session_instance), \
         patch("gradeloop-core.apps.model-orchestrator.app.models.cipas.code_clone_detection.scripts.hard_negative_mining.get_storage", return_value=mock_storage_instance):
        yield

@pytest.fixture
def mock_tokenizer():
    """Mocks a HuggingFace tokenizer."""
    mock_tokenizer_instance = MagicMock(spec=AutoTokenizer)
    mock_tokenizer_instance.model_max_length = 256
    mock_tokenizer_instance.return_value.encode.return_value = [1, 2, 3] # Dummy tokens
    mock_tokenizer_instance.side_effect = lambda text, **kwargs: {
        'input_ids': torch.tensor([[1, 2, 3] + [0]*(256-3)]),
        'attention_mask': torch.tensor([[1, 1, 1] + [0]*(256-3)])
    }
    with patch("gradeloop-core.apps.model-orchestrator.app.models.cipas.code_clone_detection.scripts.hard_negative_mining.AutoTokenizer.from_pretrained", return_value=mock_tokenizer_instance):
        yield mock_tokenizer_instance

@pytest.fixture
def mock_model(mocker):
    """Mocks a HuggingFace AutoModel."""
    mock_model_instance = mocker.MagicMock(spec=AutoModel)
    # Mock the forward pass to return dummy last_hidden_state
    mock_output = MagicMock()
    mock_output.last_hidden_state = torch.randn(1, 256, 768) # (batch, seq_len, hidden_dim)
    mock_model_instance.return_value = mock_output # For direct call
    mock_model_instance.side_effect = lambda **kwargs: mock_output # For kwargs call
    
    with patch("gradeloop-core.apps.model-orchestrator.app.models.cipas.code_clone_detection.scripts.hard_negative_mining.AutoModel.from_pretrained", return_value=mock_model_instance):
        yield mock_model_instance

@pytest.fixture
def mock_contrastive_encoder_pooler(mocker):
    """Mocks the pooling logic from ContrastiveEncoder."""
    # This is a bit of a hack: directly patch the pooling logic
    # Assume output is (batch_size, hidden_dim)
    pooled_embedding = torch.randn(1, 768)
    mocker.patch.object(ContrastiveEncoder, 'pooler', new=lambda self, embeddings, attention_mask: pooled_embedding)
    yield pooled_embedding


@pytest.fixture
def mock_faiss(mocker):
    """Mocks FAISS library."""
    mock_index = mocker.MagicMock(spec=faiss.IndexFlatL2)
    mocker.patch("gradeloop-core.apps.model-orchestrator.app.models.cipas.code_clone_detection.scripts.hard_negative_mining.faiss.IndexFlatL2", return_value=mock_index)
    
    # Mock search to return predefined distances and indices
    mock_index.search.return_value = (
        np.array([[0.1, 0.2, 0.3, 0.4, 0.5]]),
        np.array([[0, 1, 2, 3, 4]])
    )
    yield mock_index


# --- Tests ---

async def test_get_all_submission_code(mock_db_and_storage, mock_submission_contents):
    """Test that submission codes are fetched correctly."""
    sids = ["sub1", "sub2", "non_existent_sub"]
    code_map = await _get_all_submission_code(sids)
    
    assert "sub1" in code_map
    assert "sub2" in code_map
    assert "non_existent_sub" not in code_map
    assert code_map["sub1"] == mock_submission_contents["sub1"]


async def test_compute_all_embeddings(
    mock_tokenizer, mock_model, mock_contrastive_encoder_pooler, mock_submission_contents
):
    """Test computation of embeddings for a list of submissions."""
    config = TrainingConfig()
    all_sids = ["sub1", "sub2"]
    
    embeddings, sids_in_order = await compute_all_embeddings(
        mock_model, mock_tokenizer, all_sids, mock_submission_contents, config, torch.device("cpu")
    )
    
    assert embeddings.shape == (2, 768) # 2 submissions, 768 is dummy hidden size
    assert sids_in_order == ["sub1", "sub2"]


async def test_mine_hard_negatives(
    mock_t4_pairs_csv,
    mock_db_and_storage,
    mock_tokenizer,
    mock_model,
    mock_contrastive_encoder_pooler,
    mock_faiss,
    tmp_path,
):
    """
    Test the end-to-end hard negative mining process.
    """
    output_csv = tmp_path / "hard_negatives_output.csv"
    
    # Simulate faiss search results for "sub1" anchor:
    # Let's say, sids_in_index_order is ["sub1", "sub2", "sub3", "sub4", "sub5", "neg1", "neg2", "neg3"]
    # And for anchor "sub1", nearest neighbors are:
    # index 0 (sub1, self), index 1 (sub2, positive), index 5 (neg1, HN), index 6 (neg2, HN)
    mock_faiss.search.return_value = (
        np.array([[0.01, 0.05, 0.1, 0.15, 0.2, 0.25]]), # Distances
        np.array([[0, 1, 5, 6, 2, 7]]) # Indices in sids_in_index_order
    )
    
    # Patch compute_all_embeddings to return predictable values
    mock_all_embeddings = np.random.rand(8, 768).astype(np.float32)
    mock_sids_in_order = ["sub1", "sub2", "sub3", "sub4", "sub5", "neg1", "neg2", "neg3"]
    
    with patch("gradeloop-core.apps.model-orchestrator.app.models.cipas.code_clone_detection.scripts.hard_negative_mining.compute_all_embeddings",
               return_value=(mock_all_embeddings, mock_sids_in_order)):
        
        await mine_hard_negatives(
            checkpoint_path=tmp_path / "dummy_checkpoint", # Doesn't matter as model is mocked
            t4_pairs_csv=mock_t4_pairs_csv,
            output_csv=output_csv,
            top_k=2,
            sample_limit=1, # Only process the first T4 pair
            batch_size=1, # Small batch size
            faiss_device=-1,
        )

    # Verify output CSV content
    df = pd.read_csv(output_csv)
    
    assert len(df) == 2 # 1 anchor, 2 top_k negatives
    assert df["anchor_sid"].iloc[0] == "sub1"
    assert df["positive_sid"].iloc[0] == "sub2"
    assert df["hard_negative_sid"].iloc[0] == "neg1" # Based on mock_faiss.search
    assert df["hard_negative_sid"].iloc[1] == "neg2"

    # Ensure other known positives are not selected as hard negatives
    assert "sub3" not in df["hard_negative_sid"].values
