"""
Session Manager for IVAS WebSocket connections.
Manages active sessions, conversation history, and session lifecycle.
"""

from typing import Dict, List, Optional
from datetime import datetime
from fastapi import WebSocket
import logging
import asyncio
from enum import Enum

logger = logging.getLogger(__name__)


class SessionState(str, Enum):
    """WebSocket session states"""
    CONNECTING = "connecting"
    ACTIVE = "active"
    ENDING = "ending"
    ENDED = "ended"


class AudioBuffer:
    """Buffer for incoming audio chunks"""
    
    def __init__(self, max_duration_ms: int = 3000):
        """
        Initialize audio buffer.
        
        Args:
            max_duration_ms: Maximum buffer duration before force processing (default: 3 seconds)
        """
        self.chunks: List[bytes] = []
        self.max_duration_ms = max_duration_ms
        self.start_time: Optional[float] = None
        self.total_bytes = 0
    
    def add_chunk(self, audio_bytes: bytes) -> None:
        """Add audio chunk to buffer"""
        if not self.chunks:
            self.start_time = asyncio.get_event_loop().time()
        
        self.chunks.append(audio_bytes)
        self.total_bytes += len(audio_bytes)
        logger.debug(f"Added audio chunk: {len(audio_bytes)} bytes, total: {self.total_bytes} bytes")
    
    def should_process(self) -> bool:
        """Check if buffer should be processed (timeout or size threshold)"""
        if not self.chunks:
            return False
        
        # Check duration timeout
        if self.start_time:
            elapsed_ms = (asyncio.get_event_loop().time() - self.start_time) * 1000
            if elapsed_ms >= self.max_duration_ms:
                logger.debug(f"Buffer timeout reached: {elapsed_ms:.0f}ms")
                return True
        
        # Check size threshold (e.g., 500KB ~ 5-10 seconds of audio)
        if self.total_bytes >= 500_000:
            logger.debug(f"Buffer size threshold reached: {self.total_bytes} bytes")
            return True
        
        return False
    
    def get_combined_audio(self) -> bytes:
        """Get all buffered audio as single bytes object"""
        combined = b''.join(self.chunks)
        logger.info(f"Combined {len(self.chunks)} chunks into {len(combined)} bytes")
        return combined
    
    def clear(self) -> None:
        """Clear the buffer"""
        self.chunks.clear()
        self.start_time = None
        self.total_bytes = 0


class VivaSession:
    """
    Represents a single viva session.
    Tracks conversation history, session state, and WebSocket connection.
    """
    
    def __init__(
        self,
        session_id: str,
        websocket: WebSocket,
        student_id: str,
        lab_assignment: str,
        student_code: str
    ):
        self.session_id = session_id
        self.websocket = websocket
        self.student_id = student_id
        self.lab_assignment = lab_assignment
        self.student_code = student_code
        
        # Session state
        self.state = SessionState.CONNECTING
        self.started_at = datetime.utcnow()
        self.ended_at: Optional[datetime] = None
        
        # Conversation history for LLM context
        # Format: [{"role": "user"/"assistant", "content": str}, ...]
        self.conversation_history: List[Dict[str, str]] = []
        
        # Audio buffer for incoming chunks
        self.audio_buffer = AudioBuffer()
        
        # Turn counter
        self.turn_number = 0
        
        logger.info(f"Created session {session_id} for student {student_id}")
    
    def add_student_message(self, transcript: str) -> None:
        """Add student's transcribed speech to conversation history"""
        self.conversation_history.append({
            "role": "user",
            "content": transcript
        })
        self.turn_number += 1
        logger.debug(f"Session {self.session_id}: Added student message (turn {self.turn_number})")
    
    def add_ai_message(self, response: str) -> None:
        """Add AI's response to conversation history"""
        self.conversation_history.append({
            "role": "assistant",
            "content": response
        })
        logger.debug(f"Session {self.session_id}: Added AI message")
    
    def get_conversation_history(self) -> List[Dict[str, str]]:
        """Get full conversation history for LLM context"""
        return self.conversation_history
    
    def is_active(self) -> bool:
        """Check if session is active"""
        return self.state == SessionState.ACTIVE
    
    def should_end(self) -> bool:
        """Check if session should end (based on turn count or time)"""
        from .config import IVASConfig
        
        # End if max turns reached
        if self.turn_number >= IVASConfig.MAX_CONVERSATION_TURNS:
            logger.info(f"Session {self.session_id} reached max turns ({self.turn_number})")
            return True
        
        # End if session duration exceeds limit (e.g., 30 minutes)
        duration_minutes = (datetime.utcnow() - self.started_at).total_seconds() / 60
        if duration_minutes >= 30:
            logger.info(f"Session {self.session_id} exceeded time limit ({duration_minutes:.1f} min)")
            return True
        
        return False
    
    def end_session(self) -> None:
        """Mark session as ended"""
        self.state = SessionState.ENDED
        self.ended_at = datetime.utcnow()
        duration = (self.ended_at - self.started_at).total_seconds()
        logger.info(f"Session {self.session_id} ended after {duration:.1f}s, {self.turn_number} turns")


class SessionManager:
    """
    Manages all active viva sessions.
    Singleton pattern - one manager per application.
    """
    
    def __init__(self):
        # Active sessions: session_id -> VivaSession
        self.sessions: Dict[str, VivaSession] = {}
        logger.info("SessionManager initialized")
    
    def create_session(
        self,
        session_id: str,
        websocket: WebSocket,
        student_id: str,
        lab_assignment: str = "Default lab assignment",
        student_code: str = "# No code provided"
    ) -> VivaSession:
        """
        Create and register a new session.
        
        Args:
            session_id: Unique session identifier
            websocket: WebSocket connection
            student_id: Student identifier
            lab_assignment: Lab assignment description
            student_code: Student's code submission
            
        Returns:
            Created VivaSession instance
        """
        if session_id in self.sessions:
            logger.warning(f"Session {session_id} already exists, replacing")
            # Clean up old session
            old_session = self.sessions[session_id]
            old_session.end_session()
        
        session = VivaSession(
            session_id=session_id,
            websocket=websocket,
            student_id=student_id,
            lab_assignment=lab_assignment,
            student_code=student_code
        )
        
        self.sessions[session_id] = session
        logger.info(f"Registered session {session_id} (total active: {len(self.sessions)})")
        
        return session
    
    def get_session(self, session_id: str) -> Optional[VivaSession]:
        """Get session by ID"""
        return self.sessions.get(session_id)
    
    def remove_session(self, session_id: str) -> None:
        """Remove and cleanup session"""
        if session_id in self.sessions:
            session = self.sessions[session_id]
            session.end_session()
            del self.sessions[session_id]
            logger.info(f"Removed session {session_id} (remaining: {len(self.sessions)})")
        else:
            logger.warning(f"Attempted to remove non-existent session: {session_id}")
    
    def get_active_count(self) -> int:
        """Get number of active sessions"""
        return len([s for s in self.sessions.values() if s.is_active()])
    
    def cleanup_inactive(self) -> int:
        """Remove all inactive sessions, return count removed"""
        inactive_ids = [
            sid for sid, session in self.sessions.items()
            if session.state == SessionState.ENDED
        ]
        
        for sid in inactive_ids:
            self.remove_session(sid)
        
        if inactive_ids:
            logger.info(f"Cleaned up {len(inactive_ids)} inactive sessions")
        
        return len(inactive_ids)


# Global singleton instance
_session_manager: Optional[SessionManager] = None


def get_session_manager() -> SessionManager:
    """Get global SessionManager instance (singleton)"""
    global _session_manager
    if _session_manager is None:
        _session_manager = SessionManager()
    return _session_manager
