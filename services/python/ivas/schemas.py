"""
IVAS Schemas - Pydantic models for request/response validation
"""

from typing import List, Dict, Optional, Any, Literal
from pydantic import BaseModel, Field


# Health Check Schemas
class ServiceStatus(BaseModel):
    """Status of an individual AI service"""
    status: str = Field(..., description="Service status: available, unavailable, loading")
    model: str = Field(..., description="Model name/version being used")


class HealthCheckResponse(BaseModel):
    """Health check response with all service statuses"""
    status: str = Field(..., description="Overall service status")
    services: Dict[str, ServiceStatus] = Field(
        ..., 
        description="Status of individual services (asr, tts, llm)"
    )


# ASR (Speech-to-Text) Schemas
class TranscribeRequest(BaseModel):
    """Request for audio transcription (used with form data)"""
    language: Optional[str] = Field("en", description="Expected language code")


class TranscribeResponse(BaseModel):
    """Response from audio transcription"""
    transcript: str = Field(..., description="Transcribed text")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Confidence score")
    duration: float = Field(..., ge=0.0, description="Audio duration in seconds")
    language: str = Field(..., description="Detected or specified language")


# TTS (Text-to-Speech) Schemas
class SynthesizeRequest(BaseModel):
    """Request for speech synthesis"""
    text: str = Field(..., min_length=1, max_length=5000, description="Text to synthesize")
    emotion: str = Field("neutral", description="Emotion/tone: neutral, encouraging, questioning")
    speed: float = Field(1.0, ge=0.5, le=2.0, description="Speech speed multiplier")
    language: str = Field("en", description="Language code")


# LLM Question Generation Schemas
class ConversationTurn(BaseModel):
    """A single turn in the conversation"""
    speaker: str = Field(..., description="Speaker: AI or STUDENT")
    text: str = Field(..., description="What was said")
    timestamp: Optional[str] = Field(None, description="ISO timestamp")


class GenerateQuestionRequest(BaseModel):
    """Request to generate a Socratic question"""
    code: Optional[str] = Field(None, description="Student's code submission")
    topic: Optional[str] = Field(None, description="Topic/concept being assessed")
    difficulty: str = Field("medium", description="Difficulty: easier, same, harder")
    conversation_history: List[ConversationTurn] = Field(
        default_factory=list,
        description="Previous conversation turns"
    )
    student_context: Optional[Dict[str, Any]] = Field(
        None, 
        description="Additional context about student"
    )


class GenerateQuestionResponse(BaseModel):
    """Response with generated question"""
    question: str = Field(..., description="The generated question")
    difficulty: str = Field(..., description="Actual difficulty level")
    topic: str = Field(..., description="Topic being assessed")
    follow_up_hints: List[str] = Field(
        default_factory=list,
        description="Potential follow-up questions/hints"
    )


# LLM Response Assessment Schemas
class AssessResponseRequest(BaseModel):
    """Request to assess a student's response"""
    question: str = Field(..., description="The question that was asked")
    response: str = Field(..., description="Student's response")
    expected_concepts: Optional[List[str]] = Field(
        None,
        description="Concepts expected in the answer"
    )
    code_context: Optional[str] = Field(
        None,
        description="Relevant code for context"
    )
    conversation_history: List[ConversationTurn] = Field(
        default_factory=list,
        description="Previous conversation for context"
    )


class AssessResponseResponse(BaseModel):
    """Response with assessment of student's answer"""
    understanding_level: str = Field(
        ..., 
        description="Level: none, minimal, partial, good, excellent"
    )
    clarity: str = Field(
        ..., 
        description="Response clarity: confused, unclear, clear, very_clear"
    )
    confidence_score: float = Field(
        ..., 
        ge=0.0, 
        le=1.0, 
        description="Confidence in understanding (0-1)"
    )
    misconceptions: List[str] = Field(
        default_factory=list,
        description="Identified misconceptions"
    )
    strengths: List[str] = Field(
        default_factory=list,
        description="Strengths demonstrated"
    )
    areas_for_improvement: List[str] = Field(
        default_factory=list,
        description="Areas needing improvement"
    )
    suggested_follow_up: Optional[str] = Field(
        None,
        description="Suggested follow-up question"
    )


# WebSocket Message Schemas
class WebSocketMessage(BaseModel):
    """Base WebSocket message"""
    type: str = Field(..., description="Message type")
    data: Any = Field(..., description="Message payload")


class AudioChunkMessage(BaseModel):
    """Audio chunk from client"""
    type: Literal["audio_chunk"] = "audio_chunk"
    data: str = Field(..., description="Base64 encoded audio data")


class EndTurnMessage(BaseModel):
    """Signal end of speaking turn"""
    type: Literal["end_turn"] = "end_turn"
    data: Optional[Any] = None


class TranscriptMessage(BaseModel):
    """Transcript result to client"""
    type: Literal["transcript"] = "transcript"
    data: str = Field(..., description="Transcribed text")


class AIResponseMessage(BaseModel):
    """AI text response to client"""
    type: Literal["ai_response"] = "ai_response"
    data: str = Field(..., description="AI's response text")


class AIAudioMessage(BaseModel):
    """AI audio response to client"""
    type: Literal["ai_audio"] = "ai_audio"
    data: str = Field(..., description="Base64 encoded audio")


class SessionEndMessage(BaseModel):
    """Session end notification"""
    type: Literal["session_end"] = "session_end"
    data: Dict[str, Any] = Field(..., description="Final assessment data")
