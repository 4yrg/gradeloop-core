from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
import uuid
import datetime

from ..storage.database import get_session
from ..models.submission import Submission
from ..pipeline.orchestrator import orchestrator

router = APIRouter()

class DetectRequest(BaseModel):
    student_id: str
    assignment_id: str
    code: str

class MatchResult(BaseModel):
    submission_id: str
    similarity: float
    clone_type: str

class DetectResponse(BaseModel):
    submission_id: str
    top_matches: List[MatchResult]

@router.post("/detect", response_model=DetectResponse)
async def detect_clones(req: DetectRequest, session: AsyncSession = Depends(get_session)):
    """
    Submits code for clone detection.
    """
    try:
        # Create Submission object
        sub_id = f"subm_{uuid.uuid4().hex[:8]}"
        submission = Submission(
            id=sub_id,
            student_id=req.student_id,
            assignment_id=req.assignment_id,
            code=req.code,
            timestamp=datetime.datetime.utcnow()
        )
        
        # Save to DB
        session.add(submission)
        await session.commit()
        await session.refresh(submission)
        
        # Run Pipeline
        result = await orchestrator.processed_submission(submission)
        
        # Format response
        matches = []
        for m in result["matches"]:
            matches.append(MatchResult(
                submission_id=m["submission_id"],
                similarity=m["final_score"],
                clone_type=m["clone_type"]
            ))
            
        return DetectResponse(
            submission_id=submission.id,
            top_matches=matches
        )
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
