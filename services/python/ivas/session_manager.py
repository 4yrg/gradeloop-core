"""
IVAS Session Manager - Manages WebSocket connections and viva sessions
Handles real-time voice streaming for viva assessments
"""

from typing import Dict, List, Any, Optional, Callable
from dataclasses import dataclass, field
from datetime import datetime
import asyncio
import logging
import json
import base64
import urllib.parse

from fastapi import WebSocket, WebSocketDisconnect

from assessment import AdaptiveAssessmentEngine, Concept

logger = logging.getLogger(__name__)


@dataclass
class ConversationTurn:
    """A single turn in the viva conversation"""
    speaker: str  # "AI" or "STUDENT"
    text: str
    timestamp: str
    audio_duration: Optional[float] = None
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "speaker": self.speaker,
            "text": self.text,
            "timestamp": self.timestamp,
            "audio_duration": self.audio_duration,
        }


@dataclass
class VivaSession:
    """Represents an active viva session"""
    session_id: str
    student_id: str
    assignment_id: str
    code: str
    topic: str
    websocket: Optional[WebSocket] = None
    conversation_history: List[ConversationTurn] = field(default_factory=list)
    start_time: str = field(default_factory=lambda: datetime.utcnow().isoformat())
    status: str = "active"  # active, paused, completed, error
    current_question: Optional[str] = None
    current_concept: str = ""  # Track current concept being assessed
    assessment_scores: List[Dict[str, Any]] = field(default_factory=list)
    audio_chunks: List[bytes] = field(default_factory=list)  # Store chunks as list to preserve WebM structure
    assessment_engine: Optional[AdaptiveAssessmentEngine] = field(default=None)
    
    def __post_init__(self):
        """Initialize assessment engine after creation"""
        if self.assessment_engine is None:
            self.assessment_engine = AdaptiveAssessmentEngine()
            # Initialize with concepts from the topic
            concepts = self._extract_concepts_from_topic()
            self.assessment_engine.start_session(concepts)
    
    def _extract_concepts_from_topic(self) -> List[Concept]:
        """Extract concepts from the topic for assessment"""
        # Default concepts based on common programming topics
        topic_concepts = {
            "recursion": [
                Concept("recursion_basics", 0.3),
                Concept("base_case", 0.4),
                Concept("recursive_call", 0.5),
                Concept("stack_overflow", 0.6),
                Concept("recursion_vs_iteration", 0.5),
            ],
            "data structures": [
                Concept("arrays", 0.3),
                Concept("linked_lists", 0.5),
                Concept("trees", 0.6),
                Concept("hash_tables", 0.6),
            ],
            "algorithms": [
                Concept("sorting", 0.4),
                Concept("searching", 0.3),
                Concept("time_complexity", 0.6),
                Concept("space_complexity", 0.6),
            ],
            "python functions": [
                Concept("function_definition", 0.3),
                Concept("parameters_arguments", 0.4),
                Concept("return_values", 0.4),
                Concept("scope", 0.5),
            ],
        }
        
        # Find matching concepts based on topic keywords
        topic_lower = self.topic.lower()
        for key, concepts in topic_concepts.items():
            if key in topic_lower:
                return concepts
        
        # Default generic concepts
        return [
            Concept("understanding", 0.4),
            Concept("application", 0.5),
            Concept("explanation", 0.4),
        ]
    
    def add_turn(self, speaker: str, text: str, audio_duration: float = None):
        """Add a conversation turn"""
        turn = ConversationTurn(
            speaker=speaker,
            text=text,
            timestamp=datetime.utcnow().isoformat(),
            audio_duration=audio_duration
        )
        self.conversation_history.append(turn)
        logger.info(f"Session {self.session_id}: Added turn - {speaker}: {text[:50]}...")
    
    def process_student_response(
        self,
        question: str,
        response: str,
        llm_assessment: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Process a student response through the adaptive assessment engine.
        
        Returns adaptive assessment results including next difficulty, 
        concept mastery, ability estimates, etc.
        """
        if self.assessment_engine is None:
            return {}
        
        # Use current concept or extract from topic
        concept = self.current_concept or "understanding"
        
        result = self.assessment_engine.process_response(
            question=question,
            response=response,
            concept=concept,
            assessment=llm_assessment
        )
        
        # Store assessment result
        self.assessment_scores.append(result)
        
        return result
    
    def get_next_difficulty(self) -> str:
        """Get recommended difficulty for next question"""
        if self.assessment_engine and self.assessment_scores:
            return self.assessment_scores[-1].get("next_difficulty", "same")
        return "same"
    
    def should_end_session(self) -> bool:
        """Check if session should end based on adaptive assessment"""
        if self.assessment_engine:
            return self.assessment_engine.should_end_session()
        return len(self.conversation_history) >= 14  # 7 Q&A pairs
    
    def get_final_assessment(self, detailed_responses: List[Dict] = None) -> Dict[str, Any]:
        """
        Get final adaptive assessment for the session.
        
        Args:
            detailed_responses: Optional list of response assessments with rubric scores
        
        Returns:
            Dict with comprehensive assessment including score breakdown
        """
        if self.assessment_engine:
            return self.assessment_engine.generate_final_assessment(detailed_responses)
        return {
            "overall_score": 70,
            "grade": "C",
            "competency_level": "INTERMEDIATE",
            "score_breakdown": {}
        }
    
    def get_history_for_llm(self) -> List[Dict[str, str]]:
        """Get conversation history in LLM format"""
        return [
            {
                "role": "assistant" if turn.speaker == "AI" else "user",
                "content": turn.text
            }
            for turn in self.conversation_history
        ]
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "session_id": self.session_id,
            "student_id": self.student_id,
            "assignment_id": self.assignment_id,
            "topic": self.topic,
            "start_time": self.start_time,
            "status": self.status,
            "turns_count": len(self.conversation_history),
            "conversation_history": [turn.to_dict() for turn in self.conversation_history],
            "adaptive_assessment": self.assessment_scores[-1] if self.assessment_scores else None,
        }



class SessionManager:
    """
    Manages active WebSocket connections and viva sessions.
    Handles connection lifecycle, message routing, and session state.
    """
    
    def __init__(self):
        self.active_sessions: Dict[str, VivaSession] = {}
        self.session_locks: Dict[str, asyncio.Lock] = {}
        logger.info("SessionManager initialized")
    
    async def connect(
        self,
        session_id: str,
        websocket: WebSocket,
        student_id: str = "unknown",
        assignment_id: str = "unknown",
        code: str = "",
        topic: str = "programming"
    ) -> VivaSession:
        """
        Accept a new WebSocket connection and create a viva session.
        
        Args:
            session_id: Unique session identifier
            websocket: WebSocket connection
            student_id: Student's ID
            assignment_id: Assignment being assessed
            code: Student's code submission
            topic: Topic being assessed
        
        Returns:
            The created VivaSession
        """
        await websocket.accept()
        
        # Create or resume session
        if session_id in self.active_sessions:
            session = self.active_sessions[session_id]
            session.websocket = websocket
            session.status = "active"
            logger.info(f"Resumed session: {session_id}")
        else:
            # Decode URL-encoded code parameter
            decoded_code = urllib.parse.unquote(code) if code else ""
            session = VivaSession(
                session_id=session_id,
                student_id=student_id,
                assignment_id=assignment_id,
                code=decoded_code,
                topic=topic,
                websocket=websocket
            )
            self.active_sessions[session_id] = session
            self.session_locks[session_id] = asyncio.Lock()
            logger.info(f"Created new session: {session_id}")
        
        # Send connection confirmation
        await self.send_message(session_id, {
            "type": "connection_established",
            "data": {
                "session_id": session_id,
                "status": "connected",
                "message": "WebSocket connection established. Ready for viva."
            }
        })
        
        return session
    
    def disconnect(self, session_id: str):
        """
        Handle WebSocket disconnection.
        Session is preserved for potential reconnection.
        """
        if session_id in self.active_sessions:
            session = self.active_sessions[session_id]
            session.websocket = None
            session.status = "disconnected"
            logger.info(f"Session disconnected: {session_id}")
    
    def end_session(self, session_id: str) -> Optional[VivaSession]:
        """
        End and remove a session completely.
        Returns the session data for final processing.
        """
        if session_id in self.active_sessions:
            session = self.active_sessions.pop(session_id)
            self.session_locks.pop(session_id, None)
            session.status = "completed"
            logger.info(f"Session ended: {session_id}")
            return session
        return None
    
    def get_session(self, session_id: str) -> Optional[VivaSession]:
        """Get a session by ID"""
        return self.active_sessions.get(session_id)
    
    async def send_message(self, session_id: str, message: Dict[str, Any]):
        """
        Send a message to a specific session's WebSocket.
        
        Args:
            session_id: Target session ID
            message: Message to send (will be JSON encoded)
        """
        session = self.active_sessions.get(session_id)
        if session and session.websocket:
            try:
                # Check if WebSocket is still open before sending
                if hasattr(session.websocket, 'client_state') and session.websocket.client_state.name != 'CONNECTED':
                    logger.warning(f"WebSocket not connected for {session_id}, state: {session.websocket.client_state.name}")
                    return
                    
                await session.websocket.send_json(message)
                logger.debug(f"Sent message to {session_id}: {message.get('type')}")
            except RuntimeError as e:
                # Handle "Cannot call send once a close message has been sent" silently
                if "close message" in str(e).lower():
                    logger.debug(f"WebSocket already closed for {session_id}, skipping message: {message.get('type')}")
                else:
                    logger.error(f"Runtime error sending to {session_id}: {e}")
                session.status = "error"
            except Exception as e:
                logger.error(f"Failed to send message to {session_id}: {e}")
                session.status = "error"
    
    async def send_transcript(self, session_id: str, transcript: str):
        """Send transcription result to client"""
        await self.send_message(session_id, {
            "type": "transcript",
            "data": transcript
        })
    
    async def send_ai_response(self, session_id: str, response: str):
        """Send AI text response to client"""
        await self.send_message(session_id, {
            "type": "ai_response",
            "data": response
        })
    
    async def send_ai_audio(self, session_id: str, audio_bytes: bytes):
        """Send AI audio response to client (base64 encoded)"""
        audio_base64 = base64.b64encode(audio_bytes).decode("utf-8")
        await self.send_message(session_id, {
            "type": "ai_audio",
            "data": audio_base64
        })
    
    async def send_assessment(self, session_id: str, assessment: Dict[str, Any]):
        """Send assessment feedback to client"""
        await self.send_message(session_id, {
            "type": "assessment",
            "data": assessment
        })
    
    async def send_session_end(self, session_id: str, final_assessment: Dict[str, Any]):
        """Send final assessment and end session signal"""
        await self.send_message(session_id, {
            "type": "session_end",
            "data": final_assessment
        })
    
    async def send_error(self, session_id: str, error: str):
        """Send error message to client"""
        await self.send_message(session_id, {
            "type": "error",
            "data": {"message": error}
        })
    
    def add_audio_chunk(self, session_id: str, audio_bytes: bytes):
        """Add audio chunk to session buffer (stored as list for WebM format)"""
        session = self.active_sessions.get(session_id)
        if session:
            session.audio_chunks.append(audio_bytes)
    
    def get_and_clear_audio_buffer(self, session_id: str) -> bytes:
        """Get accumulated audio chunks joined together and clear buffer"""
        session = self.active_sessions.get(session_id)
        if session:
            # Join all chunks - for WebM, chunks are already properly structured
            audio = b"".join(session.audio_chunks)
            session.audio_chunks = []
            return audio
        return b""
    
    def get_active_session_count(self) -> int:
        """Get count of active sessions"""
        return sum(
            1 for s in self.active_sessions.values() 
            if s.status == "active"
        )
    
    def get_all_sessions_info(self) -> List[Dict[str, Any]]:
        """Get info about all sessions"""
        return [
            {
                "session_id": s.session_id,
                "student_id": s.student_id,
                "status": s.status,
                "turns_count": len(s.conversation_history),
                "start_time": s.start_time,
            }
            for s in self.active_sessions.values()
        ]


# Global session manager instance
session_manager = SessionManager()
