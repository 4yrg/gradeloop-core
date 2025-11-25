from pydantic import BaseModel, Field
from typing import List
import uuid


class Submission(BaseModel):
    """
    Represents a code submission for clone detection.
    """
    id: uuid.UUID = Field(default_factory=uuid.uuid4)
    content: str
    language: str


class CloneDetectionRequest(BaseModel):
    """
    Request model for detecting clones for a given submission.
    """
    submission: Submission


class CloneDetectionResult(BaseModel):
    """
    Represents a single detected clone.
    """
    submission_id: uuid.UUID
    similarity_score: float = Field(..., ge=0.0, le=1.0)
    clone_submission_id: uuid.UUID


class CloneDetectionResponse(BaseModel):
    """
    Response model for clone detection results.
    """
    submission_id: uuid.UUID
    results: List[CloneDetectionResult]
