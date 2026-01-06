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
        
        # Clean text for TTS
        tts_text = _clean_text_for_tts(question)
        
        # Generate and send audio
        audio_bytes = await tts_service.synthesize_async(
            text=tts_text,
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
    4. Update adaptive assessment (BKT + IRT)
    5. Generate follow-up question based on adaptive difficulty
    6. Synthesize response audio (TTS)
    7. Send all results to client
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
        
        # Step 2: Assess the response using LLM
        logger.info(f"Assessing response for session {session_id}")
        llm_assessment = llm_service.assess_response(
            question=session.current_question or "Tell me about your code",
            response=student_text,
            code_context=session.code
        )
        
        # Step 3: Process through adaptive assessment engine (BKT + IRT)
        adaptive_result = session.process_student_response(
            question=session.current_question or "",
            response=student_text,
            llm_assessment=llm_assessment
        )
        
        # Combine LLM assessment with adaptive metrics
        combined_assessment = {
            # Map snake_case to camelCase for frontend
            "understandingLevel": llm_assessment.get("understanding_level", "partial"),
            "clarity": llm_assessment.get("clarity", "clear"),
            "confidenceScore": llm_assessment.get("confidence_score", 0.5),
            "misconceptions": llm_assessment.get("misconceptions", []),
            "strengths": llm_assessment.get("strengths", []),
            "areasForImprovement": llm_assessment.get("areas_for_improvement", []),
            "suggestedFollowUp": llm_assessment.get("suggested_follow_up", ""),
            
            "adaptive": {
                "questionNumber": adaptive_result.get("question_number", 0),
                "conceptMastery": adaptive_result.get("concept_mastery", 0),
                "abilityLevel": adaptive_result.get("ability_level", "INTERMEDIATE"),
                "abilityPercentile": adaptive_result.get("ability_percentile", 50),
                "questionsRemaining": adaptive_result.get("questions_remaining", 5),
            }
        }
        
        # Send assessment to client
        await session_manager.send_assessment(session_id, combined_assessment)
        
        # Step 4: Check if session should end
        if session.should_end_session():
            await _end_viva_session(session)
            return
        
        # Step 5: Get adaptive difficulty recommendation
        difficulty = adaptive_result.get("next_difficulty", "same")
        suggested_concept = adaptive_result.get("suggested_focus", "understanding")
        session.current_concept = suggested_concept
        
        logger.info(f"Adaptive recommendation: difficulty={difficulty}, focus={suggested_concept}")
        
        # Step 6: Generate follow-up question with adaptive difficulty
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
        
        # Send question text (with formatting for UI)
        await session_manager.send_ai_response(session_id, question)
        
        # Clean text for TTS (remove labels and markdown)
        tts_text = _clean_text_for_tts(question)
        
        # Generate and send audio
        audio_bytes = await tts_service.synthesize_async(
            text=tts_text,
            emotion="encouraging" if difficulty == "easier" else "neutral",
            speed=1.0
        )
        await session_manager.send_ai_audio(session_id, audio_bytes)
        
        logger.info(f"Sent follow-up question for session {session_id}")
        
    except Exception as e:
        logger.error(f"Failed to generate follow-up: {e}")
        await session_manager.send_error(session_id, "Failed to generate question")


async def _end_viva_session(session: VivaSession):
    """End the viva session and send final assessment with V2 evidence-based scoring"""
    session_id = session.session_id
    
    try:
        logger.info(f"Generating final assessment V2 for session {session_id}")
        
        # Step 1: Calculate scores from rubric-based assessments (Evidence-based!)
        # Collect all detailed response assessments if available
        detailed_responses = []
        for turn in session.conversation_history:
            if turn.get("role") == "student" and turn.get("assessment"):
                detailed_responses.append({
                    "question": turn.get("question", ""),
                    "response": turn.get("content", ""),
                    "rubric_scores": turn["assessment"].get("rubric_scores", {}),
                    "understanding_level": turn["assessment"].get("understanding_level", "partial"),
                    "evidence": turn["assessment"].get("evidence", {})
                })
        
        # Generate score breakdown using adaptive engine
        adaptive_assessment = session.get_final_assessment(detailed_responses)
        
        # Step 2: Generate LLM narrative with score context
        llm_assessment = llm_service.generate_final_assessment(
            code=session.code,
            conversation_history=session.get_history_for_llm(),
            score_breakdown=adaptive_assessment  # Pass calculated scores to LLM
        )
        
        # Step 3: Combine calculated scores + LLM narrative
        final_assessment = {
            # CALCULATED SCORES (accurate, transparent, evidence-based)
            "overallScore": llm_assessment.get("overall_score", adaptive_assessment.get("overall_score", 70)),
            "grade": llm_assessment.get("grade", adaptive_assessment.get("grade", "C")),
            "competencyLevel": llm_assessment.get("competency_level", adaptive_assessment.get("competency_level", "INTERMEDIATE")),
            
            # DETAILED SCORE BREAKDOWN (V2 - shows where every point came from)
            "scoreBreakdown": llm_assessment.get("score_breakdown", adaptive_assessment.get("score_breakdown", {})),
            
            # CONCEPT MASTERY (from BKT model)
            "conceptMastery": llm_assessment.get("concept_mastery", adaptive_assessment.get("concept_mastery", {})),
            
            # LLM-GENERATED NARRATIVE (specific, evidence-based)
            "overallSummary": llm_assessment.get("overall_summary", ""),
            "strengths": llm_assessment.get("strengths", []),
            "weaknesses": llm_assessment.get("weaknesses", []),
            "misconceptions": llm_assessment.get("misconceptions", []),
            "conceptAnalysis": llm_assessment.get("concept_analysis", []),
            "recommendations": llm_assessment.get("recommendations", []),
            "instructorComments": llm_assessment.get("instructor_comments", ""),
            "nextSteps": llm_assessment.get("next_steps", []),
            "positiveNote": llm_assessment.get("positive_note", ""),
            
            # METRICS
            "abilityTheta": adaptive_assessment.get("ability_theta", 0),
            "abilityPercentile": adaptive_assessment.get("ability_percentile", 50),
            "accuracyRate": llm_assessment.get("accuracy_rate", adaptive_assessment.get("accuracy_rate", 0)),
            "questionsAnswered": llm_assessment.get("questions_answered", adaptive_assessment.get("questions_answered", 0)),
            
            # SESSION METADATA
            "sessionId": session_id,
            "totalTurns": len(session.conversation_history),
            "durationMinutes": _calculate_session_duration(session),
        }
        
        # Step 4: VALIDATE assessment before sending (prevent contradictions!)
        from assessment import validate_assessment
        is_valid, errors = validate_assessment(final_assessment)
        
        if not is_valid:
            logger.error(f"Assessment validation failed for session {session_id}:")
            for error in errors:
                logger.error(f"  - {error}")
            
            # Add validation errors to response
            final_assessment["validation_errors"] = errors
            final_assessment["validation_status"] = "FAILED"
            
            # If critical errors, use fallback
            if any("score mismatch" in err.lower() or "contradictory" in err.lower() for err in errors):
                logger.warning("Using fallback assessment due to critical validation errors")
                # Use only calculated scores without LLM narrative
                final_assessment.update({
                    "overallScore": adaptive_assessment.get("overall_score", 70),
                    "grade": adaptive_assessment.get("grade", "C"),
                    "competencyLevel": adaptive_assessment.get("competency_level", "INTERMEDIATE"),
                    "instructorComments": "Assessment completed using rubric-based scoring. See detailed breakdown for your results.",
                })
        else:
            logger.info(f"Assessment validation passed for session {session_id}")
            final_assessment["validation_status"] = "PASSED"
        
        # Send final assessment
        await session_manager.send_session_end(session_id, final_assessment)
        
        # End session
        session_manager.end_session(session_id)
        
        logger.info(
            f"Viva session ended V2: {session_id}, "
            f"score: {final_assessment['overallScore']}/100, "
            f"grade: {final_assessment['grade']}, "
            f"level: {final_assessment['competencyLevel']}, "
            f"validation: {final_assessment['validation_status']}"
        )
        
    except Exception as e:
        logger.error(f"Failed to end session: {e}", exc_info=True)
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


def _clean_text_for_tts(text: str) -> str:
    """
    Clean text for Text-to-Speech engine.
    Removes:
    - Markup labels (Feedback:, Teach:, Question:)
    - Markdown artifacts (**bold**, *italic*)
    - Extra whitespace
    """
    import re
    
    # Remove labels (case insensitive)
    # Replaces "Label:" with just a slight pause or nothing
    clean_text = re.sub(r'(Feedback|Teach|Question):\s*', '', text, flags=re.IGNORECASE)
    
    # Remove markdown bold/italic markers but keep text
    clean_text = re.sub(r'\*\*|__', '', clean_text)
    clean_text = re.sub(r'\*|_', '', clean_text)
    
    # Remove code hacks
    clean_text = re.sub(r'`', '', clean_text)
    
    # Remove newlines for speech flow (replace with space)
    clean_text = clean_text.replace('\n', ' ')
    
    # Normalize whitespace
    clean_text = re.sub(r'\s+', ' ', clean_text).strip()
    
    return clean_text