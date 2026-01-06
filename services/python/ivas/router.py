"""
IVAS Router - API endpoints for viva assessment AI services
Includes REST endpoints and WebSocket for real-time voice streaming
"""

from fastapi import APIRouter, HTTPException, UploadFile, File, WebSocket, WebSocketDisconnect, Query
from fastapi.responses import Response
import logging
import json
import base64
import asyncio
from typing import Optional

from schemas import (
    TranscribeResponse,
    SynthesizeRequest,
    GenerateQuestionRequest,
    GenerateQuestionResponse,
    AssessResponseRequest,
    AssessResponseResponse,
    HealthCheckResponse,
)
from services import ASRService, TTSService, LLMService
from session_manager import session_manager, VivaSession

router = APIRouter()
logger = logging.getLogger(__name__)

# Initialize services (lazy loading - models loaded on first use)
asr_service = ASRService()
tts_service = TTSService()
llm_service = LLMService()


@router.get("/health")
async def health_check():
    """
    Health check endpoint for IVAS AI services.
    Returns status of all AI service components including WebSocket.
    """
    return {
        "status": "healthy",
        "services": {
            "asr": {"status": "available" if asr_service.is_available else "unavailable", "model": f"whisper-{asr_service.model_size}"},
            "tts": {"status": "available" if tts_service.is_available else "unavailable", "model": "edge-tts"},
            "llm": {"status": "available" if llm_service.is_available else "unavailable", "model": llm_service.model},
            "websocket": {"status": "available", "active_sessions": session_manager.get_active_session_count()},
        },
    }


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
    
    try:
        # Use LLM service to generate question
        result = llm_service.generate_question(
            code=request.code,
            topic=request.topic,
            difficulty=request.difficulty or "medium",
            conversation_history=request.conversation_history
        )
        
        return GenerateQuestionResponse(
            question=result["question"],
            difficulty=result["difficulty"],
            topic=result["topic"],
            follow_up_hints=result.get("follow_up_hints", []),
        )
    except RuntimeError as e:
        logger.error(f"Question generation error: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Question generation failed: {str(e)}"
        )
    except Exception as e:
        logger.error(f"Unexpected question generation error: {e}")
        raise HTTPException(
            status_code=500,
            detail="An unexpected error occurred during question generation."
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
    
    try:
        # Use LLM service to assess response
        result = llm_service.assess_response(
            question=request.question,
            response=request.response,
            expected_concepts=request.expected_concepts,
            code_context=request.code_context
        )
        
        return AssessResponseResponse(
            understanding_level=result["understanding_level"],
            clarity=result["clarity"],
            confidence_score=result["confidence_score"],
            misconceptions=result.get("misconceptions", []),
            strengths=result.get("strengths", []),
            areas_for_improvement=result.get("areas_for_improvement", []),
            suggested_follow_up=result.get("suggested_follow_up", ""),
        )
    except RuntimeError as e:
        logger.error(f"Assessment error: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Response assessment failed: {str(e)}"
        )
    except Exception as e:
        logger.error(f"Unexpected assessment error: {e}")
        raise HTTPException(
            status_code=500,
            detail="An unexpected error occurred during response assessment."
        )

# =============================================================================
# WebSocket Endpoints for Real-Time Voice Streaming
# =============================================================================

@router.websocket("/ws/{session_id}")
async def websocket_endpoint(
    websocket: WebSocket,
    session_id: str,
    student_id: str = Query(default="unknown"),
    assignment_id: str = Query(default="unknown"),
    code: str = Query(default=""),
    topic: str = Query(default="programming")
):
    """
    WebSocket endpoint for real-time viva voice streaming.
    
    Flow:
    1. Client connects with session parameters
    2. Server sends initial greeting question
    3. Client streams audio chunks
    4. On end_turn, server processes: Audio → ASR → LLM → TTS
    5. Server sends back transcript, AI response, and audio
    6. Repeat until session ends
    
    Message Protocol:
    
    Client → Server:
        {"type": "audio_chunk", "data": "<base64 encoded audio>"}
        {"type": "end_turn"}
        {"type": "request_question", "data": {"difficulty": "medium"}}
        {"type": "end_session"}
    
    Server → Client:
        {"type": "connection_established", "data": {...}}
        {"type": "transcript", "data": "Student said..."}
        {"type": "ai_response", "data": "Can you explain..."}
        {"type": "ai_audio", "data": "<base64 encoded wav>"}
        {"type": "assessment", "data": {...}}
        {"type": "session_end", "data": {"overall_score": 85, ...}}
        {"type": "error", "data": {"message": "..."}}
    """
    session = None
    
    try:
        # Create session and accept connection
        session = await session_manager.connect(
            session_id=session_id,
            websocket=websocket,
            student_id=student_id,
            assignment_id=assignment_id,
            code=code,
            topic=topic
        )
        
        logger.info(f"WebSocket connected: session={session_id}, student={student_id}")
        
        # Generate and send initial question
        await _send_initial_question(session)
        
        # Main message loop
        while True:
            try:
                # Receive message (can be text JSON or binary audio)
                message = await websocket.receive()
                
                if message["type"] == "websocket.disconnect":
                    break
                
                if "text" in message:
                    # JSON message
                    await _handle_json_message(session, message["text"])
                elif "bytes" in message:
                    # Binary audio data
                    await _handle_audio_data(session, message["bytes"])
                    
            except WebSocketDisconnect:
                logger.info(f"WebSocket disconnected: session={session_id}")
                break
            except json.JSONDecodeError as e:
                logger.error(f"Invalid JSON message: {e}")
                await session_manager.send_error(session_id, "Invalid message format")
            except Exception as e:
                logger.error(f"Error processing message: {e}")
                await session_manager.send_error(session_id, str(e))
    
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
    finally:
        if session:
            session_manager.disconnect(session_id)
            logger.info(f"Session cleanup: {session_id}")


async def _send_initial_question(session: VivaSession):
    """Generate and send the initial viva question"""
    try:
        # Generate initial question
        result = llm_service.generate_question(
            code=session.code,
            topic=session.topic,
            difficulty="medium"
        )
        
        question = result["question"]
        session.current_question = question
        session.add_turn("AI", question)
        
        # Send question text
        await session_manager.send_ai_response(session.session_id, question)
        
        # Generate and send audio
        audio_bytes = await tts_service.synthesize_async(
            text=question,
            emotion="friendly",
            speed=1.0
        )
        await session_manager.send_ai_audio(session.session_id, audio_bytes)
        
        logger.info(f"Sent initial question for session {session.session_id}")
        
    except Exception as e:
        logger.error(f"Failed to send initial question: {e}")
        await session_manager.send_error(
            session.session_id, 
            "Failed to generate initial question"
        )


async def _handle_json_message(session: VivaSession, text: str):
    """Handle JSON text messages from client"""
    data = json.loads(text)
    msg_type = data.get("type")
    
    if msg_type == "audio_chunk":
        # Base64 encoded audio chunk
        audio_b64 = data.get("data", "")
        if audio_b64:
            audio_bytes = base64.b64decode(audio_b64)
            session_manager.add_audio_chunk(session.session_id, audio_bytes)
            
    elif msg_type == "end_turn":
        # Process accumulated audio and generate response
        await _process_student_turn(session)
        
    elif msg_type == "request_question":
        # Client explicitly requests a new question
        difficulty = data.get("data", {}).get("difficulty", "medium")
        await _generate_follow_up_question(session, difficulty)
        
    elif msg_type == "end_session":
        # End the viva session
        await _end_viva_session(session)
        
    else:
        logger.warning(f"Unknown message type: {msg_type}")


async def _handle_audio_data(session: VivaSession, audio_bytes: bytes):
    """Handle raw binary audio data"""
    session_manager.add_audio_chunk(session.session_id, audio_bytes)


async def _process_student_turn(session: VivaSession):
    """
    Process a complete student turn:
    1. Get accumulated audio
    2. Transcribe to text (ASR)
    3. Assess the response (LLM)
    4. Generate follow-up question (LLM)
    5. Synthesize response audio (TTS)
    6. Send all results to client
    """
    session_id = session.session_id
    
    # Get accumulated audio
    audio_bytes = session_manager.get_and_clear_audio_buffer(session_id)
    
    if len(audio_bytes) == 0:
        await session_manager.send_error(session_id, "No audio received")
        return
    
    try:
        # Step 1: Transcribe audio to text
        logger.info(f"Transcribing {len(audio_bytes)} bytes for session {session_id}")
        transcription = asr_service.transcribe(audio_bytes)
        student_text = transcription["transcript"]
        
        if not student_text.strip():
            await session_manager.send_error(session_id, "Could not understand audio")
            return
        
        # Send transcript to client
        await session_manager.send_transcript(session_id, student_text)
        
        # Add to conversation history
        session.add_turn("STUDENT", student_text, transcription.get("duration"))
        
        # Step 2: Assess the response
        logger.info(f"Assessing response for session {session_id}")
        assessment = llm_service.assess_response(
            question=session.current_question or "Tell me about your code",
            response=student_text,
            code_context=session.code
        )
        
        # Store assessment
        session.assessment_scores.append(assessment)
        
        # Send assessment to client
        await session_manager.send_assessment(session_id, assessment)
        
        # Step 3: Generate follow-up question based on assessment
        understanding = assessment.get("understanding_level", "partial")
        
        # Adjust difficulty based on understanding
        if understanding in ["excellent", "good"]:
            difficulty = "harder"
        elif understanding in ["minimal", "none"]:
            difficulty = "easier"
        else:
            difficulty = "same"
        
        # Generate follow-up
        await _generate_follow_up_question(session, difficulty)
        
    except Exception as e:
        logger.error(f"Error processing student turn: {e}")
        await session_manager.send_error(session_id, f"Processing error: {str(e)}")


async def _generate_follow_up_question(session: VivaSession, difficulty: str = "medium"):
    """Generate and send a follow-up question"""
    session_id = session.session_id
    
    try:
        # Generate question with conversation context
        result = llm_service.generate_question(
            code=session.code,
            topic=session.topic,
            difficulty=difficulty,
            conversation_history=session.get_history_for_llm()
        )
        
        question = result["question"]
        session.current_question = question
        session.add_turn("AI", question)
        
        # Send question text
        await session_manager.send_ai_response(session_id, question)
        
        # Generate and send audio
        audio_bytes = await tts_service.synthesize_async(
            text=question,
            emotion="encouraging" if difficulty == "easier" else "neutral",
            speed=1.0
        )
        await session_manager.send_ai_audio(session_id, audio_bytes)
        
        logger.info(f"Sent follow-up question for session {session_id}")
        
    except Exception as e:
        logger.error(f"Failed to generate follow-up: {e}")
        await session_manager.send_error(session_id, "Failed to generate question")


async def _end_viva_session(session: VivaSession):
    """End the viva session and send final assessment"""
    session_id = session.session_id
    
    try:
        # Generate final assessment
        logger.info(f"Generating final assessment for session {session_id}")
        
        final_assessment = llm_service.generate_final_assessment(
            code=session.code,
            conversation_history=session.get_history_for_llm()
        )
        
        # Add session metadata
        final_assessment["session_id"] = session_id
        final_assessment["total_turns"] = len(session.conversation_history)
        final_assessment["duration_minutes"] = _calculate_session_duration(session)
        
        # Send final assessment
        await session_manager.send_session_end(session_id, final_assessment)
        
        # End session
        session_manager.end_session(session_id)
        
        logger.info(f"Viva session ended: {session_id}, score: {final_assessment.get('overall_score')}")
        
    except Exception as e:
        logger.error(f"Failed to end session: {e}")
        await session_manager.send_error(session_id, "Failed to generate final assessment")


def _calculate_session_duration(session: VivaSession) -> float:
    """Calculate session duration in minutes"""
    from datetime import datetime
    
    try:
        start = datetime.fromisoformat(session.start_time)
        now = datetime.utcnow()
        duration = (now - start).total_seconds() / 60
        return round(duration, 2)
    except Exception:
        return 0.0


# =============================================================================
# Session Management Endpoints
# =============================================================================

@router.get("/sessions")
async def list_sessions():
    """List all active viva sessions"""
    return {
        "active_count": session_manager.get_active_session_count(),
        "sessions": session_manager.get_all_sessions_info()
    }


@router.get("/sessions/{session_id}")
async def get_session(session_id: str):
    """Get details of a specific session"""
    session = session_manager.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session.to_dict()


@router.delete("/sessions/{session_id}")
async def delete_session(session_id: str):
    """Force end and delete a session"""
    session = session_manager.end_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return {"message": f"Session {session_id} ended", "turns": len(session.conversation_history)}