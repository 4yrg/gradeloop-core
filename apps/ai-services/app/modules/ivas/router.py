"""
FastAPI router for IVAS endpoints.
Defines REST API routes and WebSocket endpoint.
"""

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.responses import JSONResponse
from typing import List
import logging
import json
import base64
from datetime import datetime
import asyncio

from .schemas import (
    StartVivaRequest,
    SessionResponse,
    VivaSessionDetail,
    SessionStatus,
    WSMessageType,
)
from .session_manager import get_session_manager, SessionState
from .services import ASRService, LLMService, get_tts_service, TTSEngine
from .config import IVASConfig

logger = logging.getLogger(__name__)

router = APIRouter(
    tags=["IVAS - Intelligent Viva Voce Assessment"],
)


# === REST Endpoints ===

@router.post("/sessions", response_model=SessionResponse, status_code=201)
async def create_viva_session(request: StartVivaRequest):
    """
    Create a new viva session.
    
    This initializes a session but does not start the conversation.
    Use the WebSocket endpoint to begin the actual viva.
    """
    # TODO: Implement in Step 8 (Database)
    logger.info(f"Creating viva session for student: {request.student_id}")
    
    return JSONResponse(
        status_code=501,
        content={"message": "Not implemented yet - coming in Step 8"}
    )


@router.get("/sessions/{session_id}", response_model=VivaSessionDetail)
async def get_viva_session(session_id: str):
    """
    Retrieve a viva session with full conversation and assessment.
    """
    # TODO: Implement in Step 8 (Database)
    logger.info(f"Fetching session: {session_id}")
    
    return JSONResponse(
        status_code=501,
        content={"message": "Not implemented yet - coming in Step 8"}
    )


@router.get("/sessions", response_model=List[SessionResponse])
async def list_viva_sessions(
    student_id: str = None,
    status: SessionStatus = None,
    limit: int = 50
):
    """
    List all viva sessions with optional filters.
    """
    # TODO: Implement in Step 8 (Database)
    logger.info("Listing viva sessions")
    
    return JSONResponse(
        status_code=501,
        content={"message": "Not implemented yet - coming in Step 8"}
    )


# === WebSocket Endpoint ===

@router.websocket("/ws/{session_id}")
async def viva_websocket(websocket: WebSocket, session_id: str):
    """
    WebSocket endpoint for real-time viva conversation.
    
    Handles bidirectional audio streaming:
    - Receives audio chunks from student
    - Processes: Audio → ASR → LLM → TTS → Audio back
    - Manages conversation state and history
    
    Message Protocol (JSON):
    
    Client → Server:
    {
        "type": "audio_chunk",
        "data": {
            "audio": "<base64-encoded audio bytes>",
            "format": "webm" | "wav" | "mp3",
            "is_final": false
        }
    }
    {
        "type": "session_start",
        "data": {
            "student_id": "CS2021001",
            "lab_assignment": "Lab description...",
            "student_code": "def foo():\n    pass"
        }
    }
    {
        "type": "session_end",
        "data": {}
    }
    
    Server → Client:
    {
        "type": "transcript",
        "data": {
            "text": "Student's transcribed speech",
            "timestamp": "2025-12-02T10:30:00Z"
        }
    }
    {
        "type": "ai_response",
        "data": {
            "text": "AI's question/response",
            "timestamp": "2025-12-02T10:30:01Z"
        }
    }
    {
        "type": "ai_audio",
        "data": {
            "audio": "<base64-encoded audio bytes>",
            "format": "wav",
            "timestamp": "2025-12-02T10:30:02Z"
        }
    }
    {
        "type": "error",
        "data": {
            "message": "Error description",
            "timestamp": "2025-12-02T10:30:00Z"
        }
    }
    """
    await websocket.accept()
    logger.info(f"🔌 WebSocket connected for session: {session_id}")
    
    # Initialize services (reuse instances for efficiency)
    asr_service: ASRService = None
    llm_service: LLMService = None
    tts_service = None
    
    # Session management
    session_manager = get_session_manager()
    session = None
    
    try:
        # Send connection confirmation
        await _send_ws_message(websocket, "connection", {
            "session_id": session_id,
            "status": "connected",
            "message": "WebSocket connected. Send session_start to begin."
        })
        
        # Main message loop
        while True:
            # Receive message from client
            raw_data = await websocket.receive_text()
            
            try:
                message = json.loads(raw_data)
                msg_type = message.get("type")
                msg_data = message.get("data", {})
                
                logger.debug(f"📩 Received {msg_type} message")
                
                # Handle different message types
                if msg_type == "session_start":
                    # Initialize session
                    student_id = msg_data.get("student_id", "unknown")
                    lab_assignment = msg_data.get("lab_assignment", "Default assignment")
                    student_code = msg_data.get("student_code", "# No code provided")
                    
                    # Create session
                    session = session_manager.create_session(
                        session_id=session_id,
                        websocket=websocket,
                        student_id=student_id,
                        lab_assignment=lab_assignment,
                        student_code=student_code
                    )
                    session.state = SessionState.ACTIVE
                    
                    # Initialize AI services (lazy loading)
                    if not asr_service:
                        logger.info("🎤 Initializing ASR service...")
                        asr_service = ASRService(
                            model_size=IVASConfig.ASR_MODEL_SIZE,
                            device=IVASConfig.ASR_DEVICE
                        )
                    
                    if not llm_service:
                        logger.info("🤖 Initializing LLM service...")
                        llm_service = LLMService(
                            model=IVASConfig.LLM_MODEL,
                            host=IVASConfig.LLM_HOST
                        )
                    
                    if not tts_service:
                        logger.info("🔊 Initializing TTS service (XTTS)...")
                        tts_service = get_tts_service(
                            TTSEngine.XTTS,
                            use_gpu=IVASConfig.TTS_USE_GPU
                        )
                    
                    await _send_ws_message(websocket, "session_started", {
                        "session_id": session_id,
                        "message": "Session started. You can now send audio."
                    })
                    
                    # Generate and send first AI question to start the viva
                    logger.info("🎯 Generating first question...")
                    first_question = await llm_service.generate_question(
                        conversation_history=[],
                        lab_assignment=lab_assignment,
                        student_code=student_code
                    )
                    
                    session.add_ai_message(first_question)
                    
                    # Send transcript of AI question
                    await _send_ws_message(websocket, WSMessageType.AI_RESPONSE.value, {
                        "text": first_question
                    })
                    
                    # Synthesize and send audio
                    logger.info("🔊 Synthesizing first question...")
                    ai_audio = await tts_service.synthesize(first_question)
                    ai_audio_b64 = base64.b64encode(ai_audio).decode('utf-8')
                    
                    await _send_ws_message(websocket, WSMessageType.AI_AUDIO.value, {
                        "audio": ai_audio_b64,
                        "format": "wav"
                    })
                    
                    logger.info("✅ First question sent to student")
                
                elif msg_type == "audio_chunk":
                    # Handle incoming audio chunk from student
                    if not session or not session.is_active():
                        await _send_ws_message(websocket, WSMessageType.ERROR.value, {
                            "message": "Session not started. Send session_start first."
                        })
                        continue
                    
                    # Decode audio from base64
                    audio_b64 = msg_data.get("audio", "")
                    is_final = msg_data.get("is_final", False)
                    
                    if not audio_b64:
                        logger.warning("Received empty audio chunk")
                        continue
                    
                    audio_bytes = base64.b64decode(audio_b64)
                    
                    # Add to buffer
                    session.audio_buffer.add_chunk(audio_bytes)
                    
                    # Process if final or buffer full
                    if is_final or session.audio_buffer.should_process():
                        logger.info("🎤 Processing audio buffer...")
                        
                        # Get combined audio
                        combined_audio = session.audio_buffer.get_combined_audio()
                        session.audio_buffer.clear()
                        
                        # Transcribe audio
                        logger.info("🎤 Transcribing student audio...")
                        transcript = await asr_service.transcribe(combined_audio)
                        
                        if not transcript or len(transcript.strip()) < 3:
                            logger.warning("Transcript too short, ignoring")
                            continue
                        
                        logger.info(f"📝 Transcript: {transcript}")
                        
                        # Send transcript back to client
                        await _send_ws_message(websocket, WSMessageType.TRANSCRIPT.value, {
                            "text": transcript
                        })
                        
                        # Add to conversation history
                        session.add_student_message(transcript)
                        
                        # Check if session should end
                        if session.should_end():
                            await _send_ws_message(websocket, WSMessageType.SESSION_END.value, {
                                "message": "Maximum turns reached. Viva session complete.",
                                "turn_count": session.turn_number
                            })
                            session_manager.remove_session(session_id)
                            break
                        
                        # Generate AI response
                        logger.info("🤖 Generating AI response...")
                        ai_response = await llm_service.generate_question(
                            conversation_history=session.get_conversation_history(),
                            lab_assignment=session.lab_assignment,
                            student_code=session.student_code
                        )
                        
                        logger.info(f"💬 AI Response: {ai_response}")
                        
                        # Add to conversation history
                        session.add_ai_message(ai_response)
                        
                        # Send AI response text
                        await _send_ws_message(websocket, WSMessageType.AI_RESPONSE.value, {
                            "text": ai_response
                        })
                        
                        # Synthesize AI response to audio
                        logger.info("🔊 Synthesizing AI response...")
                        ai_audio = await tts_service.synthesize(ai_response)
                        ai_audio_b64 = base64.b64encode(ai_audio).decode('utf-8')
                        
                        # Send AI audio
                        await _send_ws_message(websocket, WSMessageType.AI_AUDIO.value, {
                            "audio": ai_audio_b64,
                            "format": "wav"
                        })
                        
                        logger.info("✅ Full turn complete (ASR → LLM → TTS)")
                
                elif msg_type == "session_end":
                    # Client requested session end
                    logger.info(f"🛑 Session end requested by client: {session_id}")
                    
                    if session:
                        await _send_ws_message(websocket, WSMessageType.SESSION_END.value, {
                            "message": "Session ended by client.",
                            "turn_count": session.turn_number
                        })
                        session_manager.remove_session(session_id)
                    
                    break
                
                else:
                    logger.warning(f"Unknown message type: {msg_type}")
                    await _send_ws_message(websocket, WSMessageType.ERROR.value, {
                        "message": f"Unknown message type: {msg_type}"
                    })
            
            except json.JSONDecodeError as e:
                logger.error(f"Invalid JSON received: {e}")
                await _send_ws_message(websocket, WSMessageType.ERROR.value, {
                    "message": f"Invalid JSON format: {str(e)}"
                })
            
            except Exception as e:
                logger.error(f"Error processing message: {e}", exc_info=True)
                await _send_ws_message(websocket, WSMessageType.ERROR.value, {
                    "message": f"Processing error: {str(e)}"
                })
    
    except WebSocketDisconnect:
        logger.info(f"🔌 WebSocket disconnected for session: {session_id}")
        if session:
            session_manager.remove_session(session_id)
    
    except Exception as e:
        logger.error(f"❌ WebSocket error: {str(e)}", exc_info=True)
        try:
            await _send_ws_message(websocket, WSMessageType.ERROR.value, {
                "message": f"Server error: {str(e)}"
            })
            await websocket.close(code=1011, reason=str(e))
        except:
            pass
        
        if session:
            session_manager.remove_session(session_id)
    
    finally:
        logger.info(f"🧹 Cleaning up session: {session_id}")


async def _send_ws_message(websocket: WebSocket, msg_type: str, data: dict) -> None:
    """
    Helper to send WebSocket message with timestamp.
    
    Args:
        websocket: WebSocket connection
        msg_type: Message type (from WSMessageType)
        data: Message data payload
    """
    message = {
        "type": msg_type,
        "data": data,
        "timestamp": datetime.utcnow().isoformat() + "Z"
    }
    
    await websocket.send_json(message)
    logger.debug(f"📤 Sent {msg_type} message")


# === Health Check ===

@router.get("/health")
async def health_check():
    """Check if IVAS module is running"""
    return {
        "status": "healthy",
        "module": "ivas",
        "version": "0.1.0"
    }


@router.get("/health/services")
async def services_health_check():
    """
    Check health of all IVAS services (ASR, TTS, LLM).
    
    Use this before starting a viva session to ensure all components are ready.
    """
    from .config import ServiceHealthChecker
    
    results = await ServiceHealthChecker.check_all()
    
    # Return 200 if all healthy, 503 if any service is down
    status_code = 200 if results["overall"]["healthy"] else 503
    
    return JSONResponse(
        status_code=status_code,
        content=results
    )