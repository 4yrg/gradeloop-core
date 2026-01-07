"""
IVAS - Interactive Voice Assessment System
A FastAPI-based voice viva assessment system using Whisper, Coqui TTS, and Ollama
"""
import os
import uuid
from typing import Dict, Optional
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, UploadFile, File, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from dotenv import load_dotenv

from models import (
    StartVivaRequest,
    VivaQuestion,
    AnswerResponse,
    AssessmentResult,
    FinalReport,
    VivaSession,
    ConversationEntry,
    HealthResponse
)
from services.llm_service import LLMService
from services.asr_service import ASRService
from services.tts_service import TTSService
from services.adaptive_service import AdaptiveQuestionService

# Load environment variables
load_dotenv()

# Global service instances
llm_service: Optional[LLMService] = None
asr_service: Optional[ASRService] = None
tts_service: Optional[TTSService] = None

# In-memory session storage
sessions: Dict[str, VivaSession] = {}
# Store adaptive service per session
adaptive_services: Dict[str, AdaptiveQuestionService] = {}


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifecycle manager for FastAPI app - initialize services on startup"""
    global llm_service, asr_service, tts_service
    
    print("\n" + "="*60)
    print("🚀 Starting IVAS - Interactive Voice Assessment System")
    print("="*60 + "\n")
    
    try:
        # Initialize services
        print("Initializing services...")
        
        # LLM Service (Ollama)
        ollama_model = os.getenv("OLLAMA_MODEL", "llama3.1:8b")
        llm_service = LLMService(model_name=ollama_model)
        
        # ASR Service (Whisper)
        whisper_model = os.getenv("WHISPER_MODEL_SIZE", "base")
        asr_service = ASRService(model_size=whisper_model)
        
        # TTS Service (Coqui)
        tts_model = os.getenv("TTS_MODEL")
        tts_service = TTSService(model_name=tts_model)
        
        print("\n" + "="*60)
        print("✓ All services initialized successfully!")
        print("✓ IVAS is ready to conduct viva assessments")
        print("="*60 + "\n")
        
    except Exception as e:
        print(f"\n❌ Error initializing services: {e}")
        print("Please ensure:")
        print("  1. Ollama is running: ollama serve")
        print("  2. Required model is available: ollama pull llama3.1:8b")
        print("  3. All dependencies are installed: pip install -r requirements.txt")
        raise
    
    yield
    
    # Cleanup on shutdown
    print("\n👋 Shutting down IVAS...")


# Create FastAPI app
app = FastAPI(
    title="IVAS - Interactive Voice Assessment System",
    description="Voice-based viva assessment system using AI",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS
allowed_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Check if the service is healthy and all components are running"""
    services_status = {
        "llm": llm_service is not None,
        "asr": asr_service is not None,
        "tts": tts_service is not None,
        "active_sessions": len(sessions)
    }
    
    return HealthResponse(
        status="healthy" if all([llm_service, asr_service, tts_service]) else "degraded",
        services=services_status
    )


@app.post("/viva/start")
async def start_viva(request: StartVivaRequest) -> dict:
    """
    Start a new viva assessment session
    
    Returns:
        - session_id: Unique identifier for this viva session
        - question: The first question (text)
        - question_audio: Audio of the question (hex-encoded bytes)
    """
    try:
        # Generate unique session ID
        session_id = str(uuid.uuid4())
        
        print(f"\n📝 Starting new viva session: {session_id}")
        print(f"   Student: {request.student_id}")
        print(f"   Assignment: {request.assignment_title}")
        
        # Initialize adaptive question service for this session
        adaptive_service = AdaptiveQuestionService(llm_service=llm_service)
        adaptive_service.initialize_question_bank(
            assignment_description=request.assignment_description,
            student_code=request.student_code
        )
        adaptive_services[session_id] = adaptive_service
        
        # Select first question using adaptive algorithm
        print("   Selecting first question...")
        first_q = adaptive_service.select_next_question([])
        
        if not first_q:
            raise HTTPException(status_code=500, detail="No questions available for this assignment")
        
        first_question = first_q.text
        question_difficulty = first_q.difficulty
        
        print(f"   Q1: {first_question} (difficulty: {question_difficulty:.2f})")
        
        # Convert question to speech
        print("   Synthesizing question audio...")
        question_audio_bytes = tts_service.synthesize(first_question)
        question_audio_hex = question_audio_bytes.hex()
        
        # Create session
        session = VivaSession(
            session_id=session_id,
            student_id=request.student_id,
            assignment_title=request.assignment_title,
            assignment_description=request.assignment_description,
            student_code=request.student_code,
            current_question=1,
            current_question_text=first_question,
            current_question_difficulty=question_difficulty,
            conversation_history=[],
            student_theta=0.0,
            is_complete=False
        )
        
        sessions[session_id] = session
        
        print(f"   ✓ Session created successfully\n")
        
        return {
            "session_id": session_id,
            "question": VivaQuestion(
                question_number=1,
                question_text=first_question
            ),
            "question_audio": question_audio_hex
        }
        
    except Exception as e:
        print(f"❌ Error starting viva: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to start viva: {str(e)}")


@app.post("/viva/answer", response_model=AnswerResponse)
async def submit_answer(
    session_id: str = Query(..., description="The viva session ID"),
    question_number: int = Query(..., description="The question number being answered"),
    audio: UploadFile = File(..., description="Audio file with the student's answer")
) -> AnswerResponse:
    """
    Submit an answer to a question (as audio) and get the next question or final report
    
    After 5 questions, returns final assessment report instead of next question.
    """
    try:
        # Validate session exists
        if session_id not in sessions:
            raise HTTPException(status_code=404, detail="Session not found")
        
        session = sessions[session_id]
        adaptive_service = adaptive_services.get(session_id)
        
        if not adaptive_service:
            raise HTTPException(status_code=500, detail="Adaptive service not found for session")
        
        print(f"\n🎤 Processing answer for session: {session_id}")
        print(f"   Question {question_number}")
        
        # Validate question number
        if question_number != session.current_question:
            raise HTTPException(
                status_code=400,
                detail=f"Expected answer for question {session.current_question}, got {question_number}"
            )
        
        # Read audio data
        audio_bytes = await audio.read()
        print(f"   Received audio: {len(audio_bytes)} bytes")
        
        # Transcribe audio to text
        print("   Transcribing audio...")
        transcript = asr_service.transcribe(audio_bytes)
        print(f"   Transcript: {transcript}")
        
        # Assess the answer using LLM
        print("   Assessing answer...")
        raw_assessment = llm_service.assess_answer(
            question=session.current_question_text,
            answer=transcript
        )
        
        # Adjust score based on question difficulty (IRT)
        adjusted_score = adaptive_service.get_adjusted_score(
            raw_score=raw_assessment['score'],
            question_difficulty=session.current_question_difficulty
        )
        
        # Generate feedback for the student
        print("   Generating feedback...")
        feedback = adaptive_service.generate_feedback(
            question=session.current_question_text,
            answer=transcript,
            score=adjusted_score,
            understanding_level=raw_assessment['understanding_level']
        )
        print(f"   Feedback: {feedback[:50]}...")
        
        assessment = {
            'understanding_level': raw_assessment['understanding_level'],
            'score': adjusted_score,
            'feedback': feedback
        }
        
        print(f"   Assessment: {assessment['understanding_level']} (Raw: {raw_assessment['score']}, Adjusted: {adjusted_score}/100)")
        
        # Store in conversation history
        conversation_entry = ConversationEntry(
            question_number=question_number,
            question_text=session.current_question_text,
            answer_text=transcript,
            understanding_level=assessment['understanding_level'],
            score=assessment['score']
        )
        session.conversation_history.append(conversation_entry)
        
        # Update student theta
        session.student_theta = adaptive_service.student_theta
        
        # Print diagnostics
        diagnostics = adaptive_service.get_diagnostics()
        print(f"   Student ability (θ): {diagnostics['student_theta']}")
        print(f"   Topic knowledge: {diagnostics['topic_knowledge']}")
        
        # Check if viva is complete (5 questions done)
        if session.current_question >= 5:
            print("   Viva complete! Generating final report...")
            
            # Generate final report
            report_data = llm_service.generate_final_report(
                conversation_history=session.conversation_history,
                student_id=session.student_id,
                assignment_title=session.assignment_title
            )
            report_data['session_id'] = session_id
            
            final_report = FinalReport(**report_data)
            session.is_complete = True
            
            # Cleanup adaptive service
            del adaptive_services[session_id]
            
            print(f"   Final Score: {final_report.total_score}/100")
            print(f"   Competency: {final_report.competency_level}")
            print(f"   ✓ Assessment complete!\n")
            
            return AnswerResponse(
                is_complete=True,
                transcript=transcript,
                assessment=AssessmentResult(**assessment),
                next_question=None,
                question_audio=None,
                final_report=final_report
            )
        
        # Select next question using adaptive algorithm
        print(f"   Selecting question {session.current_question + 1} adaptively...")
        next_q = adaptive_service.select_next_question(session.conversation_history)
        
        if not next_q:
            # Fallback if no questions available
            raise HTTPException(status_code=500, detail="No more questions available")
        
        next_question_text = next_q.text
        next_question_difficulty = next_q.difficulty
        
        print(f"   Q{session.current_question + 1}: {next_question_text} (difficulty: {next_question_difficulty:.2f})")
        
        # Convert to speech
        print("   Synthesizing question audio...")
        next_audio_bytes = tts_service.synthesize(next_question_text)
        next_audio_hex = next_audio_bytes.hex()
        
        # Update session
        session.current_question += 1
        session.current_question_text = next_question_text
        session.current_question_difficulty = next_question_difficulty
        
        print(f"   ✓ Ready for question {session.current_question}\n")
        
        return AnswerResponse(
            is_complete=False,
            transcript=transcript,
            assessment=AssessmentResult(**assessment),
            next_question=VivaQuestion(
                question_number=session.current_question,
                question_text=next_question_text
            ),
            question_audio=next_audio_hex,
            final_report=None
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error processing answer: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to process answer: {str(e)}")


@app.get("/viva/session/{session_id}")
async def get_session(session_id: str) -> dict:
    """
    Get details of a viva session (for debugging/monitoring)
    """
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    
    session = sessions[session_id]
    return {
        "session_id": session.session_id,
        "student_id": session.student_id,
        "assignment_title": session.assignment_title,
        "current_question": session.current_question,
        "is_complete": session.is_complete,
        "questions_answered": len(session.conversation_history),
        "conversation_history": [
            {
                "question_number": entry.question_number,
                "question": entry.question_text,
                "answer": entry.answer_text,
                "score": entry.score,
                "level": entry.understanding_level
            }
            for entry in session.conversation_history
        ]
    }


@app.delete("/viva/session/{session_id}")
async def delete_session(session_id: str) -> dict:
    """Delete a session (cleanup)"""
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    
    del sessions[session_id]
    return {"message": "Session deleted successfully"}


@app.get("/")
async def root():
    """Root endpoint with API information"""
    return {
        "name": "IVAS - Interactive Voice Assessment System",
        "version": "1.0.0",
        "status": "operational",
        "endpoints": {
            "health": "/health",
            "start_viva": "POST /viva/start",
            "submit_answer": "POST /viva/answer",
            "get_session": "GET /viva/session/{session_id}",
            "docs": "/docs"
        }
    }


if __name__ == "__main__":
    import uvicorn
    
    host = os.getenv("API_HOST", "0.0.0.0")
    port = int(os.getenv("API_PORT", "8085"))
    
    print(f"\n🌟 Starting IVAS server on {host}:{port}")
    print(f"📚 API Documentation: http://{host}:{port}/docs\n")
    
    uvicorn.run(
        "main:app",
        host=host,
        port=port,
        reload=True,
        log_level="info"
    )
