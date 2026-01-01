from pydantic import BaseModel

# Placeholders for Pydantic models for request/response validation
class SyntacticAnalysisRequest(BaseModel):
    pass


class SyntacticAnalysisResponse(BaseModel):
    pass

class MethodMetadata(BaseModel):
    method_id: str
    length: int
    token_count: int

class CandidatePair(BaseModel):
    query_id: str
    candidate_id: str
    token_overlap: int
    similarity_score: float
    features: list[float] = [] 
