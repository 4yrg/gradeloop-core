from pydantic import BaseModel

# Domain-specific schemas (e.g., Embedding results)

class EmbeddingRequest(BaseModel):
    code: str

class EmbeddingResponse(BaseModel):
    vector: list[float]
