from typing import List

from pydantic import BaseModel

# Contract for what Go Fibre will send
class SubmissionInput(BaseModel):
    submission_id: str
    language: str
    source_code: str
    student_id: str

# Contract for what CIPAS will return
class IntegrityReport(BaseModel):
    submission_id: str
    status: str
    is_ai:bool
    integrity_score: float
    detected_clones: List[str] = []