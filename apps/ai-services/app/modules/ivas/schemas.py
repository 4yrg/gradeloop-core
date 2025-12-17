"""
Pydantic schemas for IVAS module.
Defines request/response models for API endpoints.
"""

from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum


class CompetencyLevel(str, Enum):
    """Student competency levels"""
    BEGINNER = "beginner"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"


class SessionStatus(str, Enum):
    """Viva session status"""
    NOT_STARTED = "not_started"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"


# === Request Schemas ===

class StartVivaRequest(BaseModel):
    """Request to start a new viva session"""
    student_id: str = Field(..., description="Student identifier")
    student_name: str = Field(..., description="Student name")
    lab_assignment: str = Field(..., description="Lab assignment description")
    student_code: str = Field(..., description="Student's submitted code")
    
    class Config:
        json_schema_extra = {
            "example": {
                "student_id": "CS2021001",
                "student_name": "John Doe",
                "lab_assignment": "Write a Python function to reverse a string",
                "student_code": "def reverse_string(s):\n    return s[::-1]"
            }
        }


# === Response Schemas ===

class SessionResponse(BaseModel):
    """Response containing session details"""
    session_id: str
    student_id: str
    student_name: str
    status: SessionStatus
    started_at: datetime
    ended_at: Optional[datetime] = None


class ConversationTurn(BaseModel):
    """Single turn in the conversation"""
    turn_number: int
    speaker: str  # "student" or "ai"
    transcript: str
    timestamp: datetime


class AssessmentResult(BaseModel):
    """Final assessment result"""
    session_id: str
    overall_score: int = Field(..., ge=0, le=100)
    competency_level: CompetencyLevel
    misconceptions: List[str]
    strengths: str
    weaknesses: str
    full_analysis: str


class VivaSessionDetail(BaseModel):
    """Complete viva session with conversation and assessment"""
    session: SessionResponse
    conversation: List[ConversationTurn]
    assessment: Optional[AssessmentResult] = None


# === WebSocket Message Schemas ===

class WSMessageType(str, Enum):
    """WebSocket message types"""
    AUDIO_CHUNK = "audio_chunk"
    TRANSCRIPT = "transcript"
    AI_RESPONSE = "ai_response"
    AI_AUDIO = "ai_audio"
    ERROR = "error"
    SESSION_END = "session_end"


class WSMessage(BaseModel):
    """WebSocket message wrapper"""
    type: WSMessageType
    data: dict
    timestamp: datetime = Field(default_factory=datetime.utcnow)