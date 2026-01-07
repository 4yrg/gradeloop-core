"""
Data models for IVAS (Interactive Voice Assessment System)
"""
from typing import List, Optional
from pydantic import BaseModel, Field


class StartVivaRequest(BaseModel):
    """Request to start a new viva session"""
    student_id: str = Field(..., description="Unique identifier for the student")
    assignment_title: str = Field(..., description="Title of the assignment being assessed")
    assignment_description: str = Field(..., description="Description of what the assignment involves")
    student_code: str = Field(..., description="The student's submitted code")


class VivaQuestion(BaseModel):
    """A question in the viva assessment"""
    question_number: int = Field(..., description="The sequence number of this question (1-5)")
    question_text: str = Field(..., description="The text of the question")
    audio_url: Optional[str] = Field(None, description="URL or hex-encoded audio for the question")


class StudentAnswer(BaseModel):
    """A student's answer to a question"""
    session_id: str = Field(..., description="The viva session ID")
    question_number: int = Field(..., description="Which question this answers")
    answer_text: str = Field(..., description="Transcribed text of the student's answer")


class AssessmentResult(BaseModel):
    """Assessment of a single answer"""
    understanding_level: str = Field(..., description="Level: excellent, good, partial, minimal, or none")
    score: int = Field(..., ge=0, le=100, description="Score from 0-100")
    feedback: Optional[str] = Field(None, description="Brief feedback on the answer")


class ConversationEntry(BaseModel):
    """One Q&A exchange in the conversation"""
    question_number: int
    question_text: str
    answer_text: str
    understanding_level: str
    score: int


class FinalReport(BaseModel):
    """Final assessment report after all questions"""
    session_id: str = Field(..., description="The viva session ID")
    student_id: str = Field(..., description="The student's ID")
    assignment_title: str = Field(..., description="The assignment title")
    total_score: int = Field(..., ge=0, le=100, description="Overall score from 0-100")
    competency_level: str = Field(..., description="EXPERT, ADVANCED, INTERMEDIATE, or BEGINNER")
    strengths: List[str] = Field(default_factory=list, description="2-3 specific strengths identified")
    weaknesses: List[str] = Field(default_factory=list, description="2-3 areas needing improvement")
    recommendations: List[str] = Field(default_factory=list, description="2-3 actionable recommendations")
    conversation_history: List[ConversationEntry] = Field(default_factory=list, description="All Q&A exchanges")


class VivaSession(BaseModel):
    """In-memory representation of an active viva session"""
    session_id: str
    student_id: str
    assignment_title: str
    assignment_description: str
    student_code: str
    current_question: int = 1
    current_question_text: Optional[str] = None
    current_question_difficulty: float = 0.0  # IRT difficulty parameter
    conversation_history: List[ConversationEntry] = Field(default_factory=list)
    student_theta: float = 0.0  # IRT ability estimate
    is_complete: bool = False


class AnswerResponse(BaseModel):
    """Response after submitting an answer"""
    is_complete: bool = Field(..., description="Whether the viva is complete (5 questions done)")
    transcript: str = Field(..., description="What the student said (transcribed)")
    assessment: Optional[AssessmentResult] = Field(None, description="Assessment of this answer")
    next_question: Optional[VivaQuestion] = Field(None, description="Next question (if not complete)")
    question_audio: Optional[str] = Field(None, description="Hex-encoded audio for next question")
    final_report: Optional[FinalReport] = Field(None, description="Final report (if complete)")


class HealthResponse(BaseModel):
    """Health check response"""
    status: str = "healthy"
    services: dict = Field(default_factory=dict, description="Status of individual services")
