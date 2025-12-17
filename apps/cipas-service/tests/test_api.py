from fastapi.testclient import TestClient
from unittest.mock import MagicMock, patch
import numpy as np

# Patch imports
with patch('app.main.CloneDetectionPipeline') as MockPipeline, \
     patch('app.main.ASTHandler') as MockAST, \
     patch('app.main.DataAugmentor') as MockAugmentor:
     
    # Configure the mock instance that will be created
    mock_instance = MockPipeline.return_value
    mock_instance.get_embeddings.return_value = np.array([[0.1, 0.2]])
    mock_instance.search_similar.return_value = []
    
    from app.main import app

    client = TestClient(app)

    def test_embed():
        response = client.post("/embed", json={"code": "public class A {}", "language": "java"})
        assert response.status_code == 200
        assert "embeddings" in response.json()
        assert len(response.json()["embeddings"]) == 1

    def test_detect():
        response = client.post("/detect", json={"code": "public class A {}", "language": "java"})
        assert response.status_code == 200
        assert "matches" in response.json()
