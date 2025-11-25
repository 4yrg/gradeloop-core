# tests/test_api_router.py
import asyncio
import json
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from httpx import AsyncClient

from ..api.router import app as ciploc_router_app # Assuming it's defined this way if standalone
from ...main import create_app # This needs to be correctly imported from model-orchestrator's main.py
from ...config import settings as app_settings # Global app settings

# Mark all tests in this file as asyncio
pytestmark = pytest.mark.asyncio

# --- Fixtures ---

@pytest.fixture
def mock_inference_service():
    """Mocks the InferenceService."""
    mock_svc = MagicMock()
    mock_svc.embed_code.return_value = np.array([0.1, 0.2, 0.3])
    mock_svc.retrieve.return_value = [("sub1", 0.9), ("sub2", 0.8)]
    
    # Mock _load_faiss_index to prevent actual file operations during rebuild
    mock_svc._load_faiss_index = MagicMock()
    mock_svc.rebuild_index = MagicMock() # Will be called by the API endpoint
    
    with patch("gradeloop-core.apps.model-orchestrator.app.models.cipas.code_clone_detection.api.router.load_inference_service", return_value=mock_svc):
        yield mock_svc

@pytest.fixture
async def client_with_ciploc(mock_inference_service):
    """
    Creates an AsyncClient for testing the FastAPI app with the ciploc router.
    """
    # Create a minimal FastAPI app and include the ciploc_router
    # For testing, we generally create a new app instance
    # The actual app is created in `model-orchestrator/main.py`
    
    # Need to handle the fact that router.py is not a full app.
    # We should add this router to the main app from `model-orchestrator`
    main_app = create_app()
    from ..api.router import router as ciploc_api_router
    main_app.include_router(ciploc_api_router)

    async with AsyncClient(app=main_app, base_url="http://test") as client:
        yield client

# --- Tests ---

async def test_health_check(client_with_ciploc):
    """Test the health check endpoint."""
    response = await client_with_ciploc.get("/ciploc/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}

async def test_encode_endpoint(client_with_ciploc, mock_inference_service):
    """Test the /ciploc/encode endpoint."""
    code_to_encode = "def hello(): pass"
    response = await client_with_ciploc.post(
        "/ciploc/encode",
        json={"code": code_to_encode, "lang": "python"}
    )
    assert response.status_code == 200
    json_response = response.json()
    assert "embedding" in json_response
    assert "shape" in json_response
    assert json_response["embedding"] == [0.1, 0.2, 0.3]
    assert json_response["shape"] == [3]
    mock_inference_service.embed_code.assert_called_once_with(code_to_encode)

async def test_retrieve_endpoint(client_with_ciploc, mock_inference_service):
    """Test the /ciploc/retrieve endpoint."""
    query_code = "int main() { return 0; }"
    response = await client_with_ciploc.post(
        "/ciploc/retrieve",
        json={"code": query_code, "lang": "cpp", "k": 5}
    )
    assert response.status_code == 200
    json_response = response.json()
    assert "results" in json_response
    assert json_response["count"] == 2
    assert json_response["results"] == [{"id": "sub1", "score": 0.9}, {"id": "sub2", "score": 0.8}]
    mock_inference_service.retrieve.assert_called_once_with(query_code, 5)

async def test_rebuild_index_endpoint_authorized(client_with_ciploc, mock_inference_service, tmp_path):
    """Test the /ciploc/rebuild-index endpoint with a valid API key."""
    # Temporarily set the API key environment variable for this test
    with patch.dict('os.environ', {'CIPLOC_API_KEY': 'test_api_key'}):
        headers = {"X-API-Key": "test_api_key"}
        rebuild_request_body = {
            "embeddings_dir": str(tmp_path / "dummy_embeddings"),
            "index_type": "flat",
            "nlist": 100,
            "metric": "ip"
        }
        response = await client_with_ciploc.post(
            "/ciploc/rebuild-index",
            json=rebuild_request_body,
            headers=headers
        )
        assert response.status_code == 200
        json_response = response.json()
        assert json_response["status"] == "success"
        mock_inference_service.rebuild_index.assert_called_once_with(
            embeddings_dir=Path(rebuild_request_body["embeddings_dir"]),
            index_type="flat",
            nlist=100,
            metric="ip"
        )
        mock_inference_service._load_faiss_index.assert_called_once()

async def test_rebuild_index_endpoint_unauthorized(client_with_ciploc):
    """Test the /ciploc/rebuild-index endpoint with an invalid API key."""
    # Temporarily set the API key environment variable for this test
    with patch.dict('os.environ', {'CIPLOC_API_KEY': 'test_api_key'}):
        headers = {"X-API-Key": "wrong_key"}
        rebuild_request_body = {
            "embeddings_dir": "/tmp/dummy",
            "index_type": "flat",
            "nlist": 100,
            "metric": "ip"
        }
        response = await client_with_ciploc.post(
            "/ciploc/rebuild-index",
            json=rebuild_request_body,
            headers=headers
        )
        assert response.status_code == 401
        assert response.json()["detail"] == "Invalid API Key"
