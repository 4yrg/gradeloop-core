# tests/test_train_encoder.py
import pytest
from pathlib import Path
from unittest.mock import MagicMock, patch
import json

import pytorch_lightning as pl
import torch
from torch.utils.data import DataLoader, Dataset
from transformers import AutoTokenizer, AutoModel

# Assuming the script can be imported directly for testing
from ..scripts.train_encoder import (
    ContrastiveDataset,
    ContrastiveEncoder,
    TrainingConfig,
    HardNegativeMiner,
)

# Mark all tests in this file as asyncio if any async components are used directly.
# For Pytorch Lightning, most things are synchronous from the test perspective
# unless explicitly calling async functions (like data loading from DB/storage)
# pytestmark = pytest.mark.asyncio


# --- Mock Data and Fixtures ---

@pytest.fixture
def dummy_t4_pairs_csv(tmp_path):
    """Creates a dummy T4 pairs CSV file."""
    csv_path = tmp_path / "t4_validated_pairs.csv"
    with open(csv_path, "w", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(["submission_id_1", "submission_id_2", "problem_id", "language", "clone_type"])
        writer.writerow(["subA_id", "subB_id", "p00001", "Java", "T4"])
        writer.writerow(["subC_id", "subD_id", "p00001", "Java", "T4"])
    return csv_path

@pytest.fixture
def dummy_negatives_json(tmp_path):
    """Creates a dummy generated negatives JSON file."""
    json_path = tmp_path / "generated_negatives_p00001.json"
    with open(json_path, "w") as f:
        json.dump(["negative_code_1", "negative_code_2"], f)
    return json_path

@pytest.fixture
def mock_submission_contents():
    """Mocks the content loading from DB/storage."""
    return {
        "subA_id": "public class A { /* code A */ }",
        "subB_id": "public class B { /* code B */ }",
        "subC_id": "public class C { /* code C */ }",
        "subD_id": "public class D { /* code D */ }",
        "negative_code_1": "public class Neg1 { /* neg code 1 */ }",
        "negative_code_2": "public class Neg2 { /* neg code 2 */ }",
    }

@pytest.fixture
def mock_get_storage(mock_submission_contents):
    """Mocks the get_storage function to return a mock storage instance."""
    mock_storage_instance = MagicMock()
    async def mock_load(uri):
        # In this context, URI is the submission ID for the mock
        return mock_submission_contents.get(uri, "").encode("utf-8")
    mock_storage_instance.load = AsyncMock(side_effect=mock_load)
    with patch("gradeloop-core.apps.model-orchestrator.app.models.cipas.code_clone_detection.scripts.train_encoder.get_storage", return_value=mock_storage_instance):
        yield

@pytest.fixture
def mock_db_session(mock_submission_contents):
    """Mocks the database session to return mock Submission objects."""
    async def mock_execute(query):
        mock_result = MagicMock()
        # Extract submission ID from the WHERE clause (simplified)
        # This is a brittle mock; real implementation would parse the query
        if "WHERE submission.id" in str(query):
            sid = str(query).split("WHERE submission.id = ")[1].strip().replace("'", "").split(" ")[0]
            if sid in mock_submission_contents:
                mock_sub = MagicMock(spec=Submission)
                mock_sub.id = sid
                mock_sub.artifact_uri = sid # Use sid as artifact_uri for this mock
                mock_result.scalars.return_value.first.return_value = mock_sub
            else:
                mock_result.scalars.return_value.first.return_value = None
        else:
            mock_result.scalars.return_value.all.return_value = []
        return mock_result

    with patch("gradeloop-core.apps.model-orchestrator.app.models.cipas.code_clone_detection.scripts.train_encoder.AsyncSessionLocal", new_callable=MagicMock) as mock_async_session_local:
        mock_session_instance = MagicMock(spec=AsyncSession)
        mock_session_instance.execute.side_effect = mock_execute
        mock_session_instance.close = AsyncMock() # Mock the async close method
        mock_async_session_local.return_value.__aenter__.return_value = mock_session_instance
        mock_async_session_local.return_value.__aexit__.return_value = False
        yield mock_session_instance


@pytest.fixture
def mock_tokenizer():
    """Mocks a HuggingFace tokenizer."""
    tokenizer = AutoTokenizer.from_pretrained("Salesforce/codet5p-220m-bimodal")
    tokenizer.model_max_length = 256 # Ensure it has this attribute
    return tokenizer


@pytest.fixture
def mock_model(mocker):
    """Mocks a HuggingFace model."""
    mock_model_instance = mocker.MagicMock(spec=AutoModel)
    
    # Mock the forward pass to return dummy embeddings
    # (batch_size, sequence_length, hidden_size)
    mock_output = MagicMock()
    mock_output.last_hidden_state = torch.randn(1, 256, 768) 
    mock_model_instance.return_value.forward.return_value = mock_output
    
    # Patch AutoModel.from_pretrained
    mocker.patch(
        "gradeloop-core.apps.model-orchestrator.app.models.cipas.code_clone_detection.scripts.train_encoder.AutoModel.from_pretrained",
        return_value=mock_model_instance
    )
    return mock_model_instance


# --- Tests ---

async def test_contrastive_dataset_loading(
    dummy_t4_pairs_csv, dummy_negatives_json, mock_tokenizer, mock_db_session, mock_get_storage
):
    """Test if the dataset loads pairs and negatives correctly."""
    config = TrainingConfig()
    config.t4_pairs_csv = dummy_t4_pairs_csv
    config.negatives_json = dummy_negatives_json

    dataset = ContrastiveDataset(
        t4_pairs_csv=config.t4_pairs_csv,
        negatives_json=config.negatives_json,
        tokenizer=mock_tokenizer,
        max_length=config.max_length,
    )
    
    # The async calls within __init__ need to be awaited if they're not fully mocked
    # For now, rely on `mock_db_session` and `mock_get_storage` to handle this.
    await asyncio.sleep(0.1) # Allow async mocks to resolve

    assert len(dataset) == 4 # (A,B), (B,A), (C,D), (D,C)
    assert "subA_id" in dataset.submission_contents
    assert "negative_code_1" in dataset.initial_negatives["p00001"]

    item = dataset[0] # Test __getitem__
    assert "anchor_input_ids" in item
    assert item["anchor_input_ids"].shape == (config.max_length,)
    assert item["negative_input_ids"].shape == (config.num_hard_negatives, config.max_length)


@patch("gradeloop-core.apps.model-orchestrator.app.models.cipas.code_clone_detection.scripts.train_encoder.faiss.IndexFlatL2")
@patch("gradeloop-core.apps.model-orchestrator.app.models.cipas.code_clone_detection.scripts.train_encoder.faiss.IndexFlatL2.add")
@patch("gradeloop-core.apps.model-orchestrator.app.models.cipas.code_clone_detection.scripts.train_encoder.faiss.IndexFlatL2.search")
async def test_training_loop_one_epoch(
    mock_faiss_add, mock_faiss_search, mock_faiss_index,
    dummy_t4_pairs_csv, dummy_negatives_json, mock_tokenizer, mock_model, mock_db_session, mock_get_storage
):
    """
    Test that the training loop can run for one epoch without crashing
    with mocked data and models.
    """
    config = TrainingConfig()
    config.t4_pairs_csv = dummy_t4_pairs_csv
    config.negatives_json = dummy_negatives_json
    config.epochs = 1
    config.batch_size = 2 # Small batch size for testing
    config.eval_batch_size = 2

    # Mock FAISS search to return dummy indices
    mock_faiss_search.return_value = (np.array([[0]]), np.array([[0]]))

    dataset = ContrastiveDataset(
        t4_pairs_csv=config.t4_pairs_csv,
        negatives_json=config.negatives_json,
        tokenizer=mock_tokenizer,
        max_length=config.max_length,
    )
    # Give some dummy values to submission_contents for hard negative mining
    dataset.submission_contents = mock_submission_contents
    
    dataloader = DataLoader(dataset, batch_size=config.batch_size)

    model_instance = ContrastiveEncoder(config, mock_tokenizer)
    
    # Patch the _get_embeddings method to return dummy values for the pooled embeddings
    # (batch_size, embedding_dim)
    model_instance._get_embeddings = MagicMock(return_value=torch.randn(config.batch_size, 768))

    # Hard negative miner callback
    hn_miner = HardNegativeMiner(config, mock_tokenizer, dataset)
    
    trainer = pl.Trainer(
        max_epochs=config.epochs,
        limit_train_batches=1, # Run only one batch for speed
        limit_val_batches=0, # No validation for this test
        logger=False,
        callbacks=[hn_miner],
        accelerator="cpu", # Force CPU for testing
    )
    
    # This should run without exceptions
    trainer.fit(model_instance, dataloaders=dataloader)

    # Check that hard negative mining was attempted
    assert hn_miner.train_dataset.hn_cache is not None

    # Verify that the model instance was used
    mock_model.assert_called_once_with(config.model_name)
    assert model_instance._get_embeddings.called

