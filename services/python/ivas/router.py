"""
IVAS Router - API endpoints for viva assessment AI services
"""

from fastapi import APIRouter, HTTPException, UploadFile, File
from fastapi.responses import Response
import logging

from schemas import (
    TranscribeResponse,
    SynthesizeRequest,
    GenerateQuestionRequest,
    GenerateQuestionResponse,
    AssessResponseRequest,
    AssessResponseResponse,
    HealthCheckResponse,
)
from services import ASRService, TTSService

router = APIRouter()
logger = logging.getLogger(__name__)

# Initialize services (lazy loading - models loaded on first use)
asr_service = ASRService()
tts_service = TTSService()


@router.get("/health", response_model=HealthCheckResponse)
async def health_check():
    """
    Health check endpoint for IVAS AI services.
    Returns status of all AI service components.
    """
    return HealthCheckResponse(
        status="healthy",
        services={
            "asr": {"status": "available" if asr_service.is_available else "unavailable", "model": f"whisper-{asr_service.model_size}"},
            "tts": {"status": "available" if tts_service.is_available else "unavailable", "model": "edge-tts"},
            "llm": {"status": "available", "model": "llama3.1:8b"},
        },
    )


@router.post("/transcribe", response_model=TranscribeResponse)
async def transcribe_audio(file: UploadFile = File(...)):
    """
    Transcribe audio file to text using Whisper ASR.
    
    Args:
        file: Audio file (WAV, MP3, etc.)
    
    Returns:
        Transcription text and metadata
    """
    # Validate file type
    if file.content_type and not file.content_type.startswith("audio/"):
        raise HTTPException(
            status_code=400,
            detail="Invalid file type. Please upload an audio file."
        )
    
    # Read file content
    audio_bytes = await file.read()
    
    if len(audio_bytes) == 0:
        raise HTTPException(
            status_code=400,
            detail="Empty audio file provided."
        )
    
    try:
        # Use ASR service to transcribe
        result = asr_service.transcribe(audio_bytes)
        
        return TranscribeResponse(
            transcript=result["transcript"],
            confidence=result["confidence"],
            duration=result["duration"],
            language=result["language"],
        )
    except RuntimeError as e:
        logger.error(f"Transcription error: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Transcription failed: {str(e)}"
        )
    except Exception as e:
        logger.error(f"Unexpected transcription error: {e}")
        raise HTTPException(
            status_code=500,
            detail="An unexpected error occurred during transcription."
        )


@router.post("/synthesize")
async def synthesize_speech(request: SynthesizeRequest):
    """
    Synthesize speech from text using Edge TTS.
    
    Args:
        request: Text to synthesize and voice settings
    
    Returns:
        Audio file (WAV format)
    """
    if not request.text or len(request.text.strip()) == 0:
        raise HTTPException(
            status_code=400,
            detail="Text cannot be empty."
        )
    
    # Validate speed parameter
    speed = request.speed if request.speed else 1.0
    if speed < 0.5 or speed > 2.0:
        raise HTTPException(
            status_code=400,
            detail="Speed must be between 0.5 and 2.0"
        )
    
    try:
        # Use TTS service to synthesize speech
        audio_bytes = await tts_service.synthesize_async(
            text=request.text,
            emotion=request.emotion or "neutral",
            speed=speed,
            language=request.language or "en"
        )
        
        return Response(
            content=audio_bytes,
            media_type="audio/wav",
            headers={
                "Content-Disposition": "attachment; filename=speech.wav"
            }
        )
    except RuntimeError as e:
        logger.error(f"TTS synthesis error: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Speech synthesis failed: {str(e)}"
        )
    except Exception as e:
        logger.error(f"Unexpected TTS error: {e}")
        raise HTTPException(
            status_code=500,
            detail="An unexpected error occurred during speech synthesis."
        )


@router.post("/generate-question", response_model=GenerateQuestionResponse)
async def generate_question(request: GenerateQuestionRequest):
    """
    Generate a Socratic question based on student's code and conversation history.
    
    Args:
        request: Code context, topic, and conversation history
    
    Returns:
        Generated question and metadata
    """
    if not request.code and not request.topic:
        raise HTTPException(
            status_code=400,
            detail="Either code or topic must be provided."
        )
    
    # TODO: Implement actual LLM generation in Step 7
    # For now, return a placeholder response
    return GenerateQuestionResponse(
        question="Can you explain how your code handles edge cases?",
        difficulty="medium",
        topic=request.topic or "general programming",
        follow_up_hints=[
            "Consider what happens with empty input",
            "Think about boundary conditions",
        ],
    )


@router.post("/assess-response", response_model=AssessResponseResponse)
async def assess_response(request: AssessResponseRequest):
    """
    Assess student's response to a question.
    
    Args:
        request: Question, student response, and context
    
    Returns:
        Assessment with understanding level and feedback
    """
    if not request.question or not request.response:
        raise HTTPException(
            status_code=400,
            detail="Both question and response must be provided."
        )
    
    # TODO: Implement actual assessment in Step 7
    # For now, return a placeholder response
    return AssessResponseResponse(
        understanding_level="partial",
        clarity="clear",
        confidence_score=0.7,
        misconceptions=[],
        strengths=["Clear communication"],
        areas_for_improvement=["Could provide more specific examples"],
        suggested_follow_up="Can you elaborate on that with a specific example?",
    )
