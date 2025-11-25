import pytest
from httpx import AsyncClient
from uuid import uuid4

@pytest.mark.anyio
async def test_detect_clones(client: AsyncClient):
    submission_id = uuid4()
    request_data = {
        "submission": {
            "id": str(submission_id),
            "content": "def hello():\n  print('hello')",
            "language": "python"
        }
    }

    response = await client.post("/code_clone_detection/detect", json=request_data)
    assert response.status_code == 200
    
    response_json = response.json()
    assert response_json["submission_id"] == str(submission_id)
    assert isinstance(response_json["results"], list)

