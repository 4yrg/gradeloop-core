"""
Utility functions for IVAS module.
"""

import logging
from datetime import datetime
import uuid

logger = logging.getLogger(__name__)


def generate_session_id() -> str:
    """Generate unique session ID"""
    return f"ivas_{datetime.utcnow().strftime('%Y%m%d')}_{uuid.uuid4().hex[:8]}"


def estimate_audio_duration(audio_bytes: bytes, sample_rate: int = 16000) -> float:
    """
    Estimate duration of audio in seconds.
    
    Args:
        audio_bytes: Raw audio data
        sample_rate: Audio sample rate (default 16kHz)
        
    Returns:
        Duration in seconds
    """
    # Assuming 16-bit PCM mono audio
    num_samples = len(audio_bytes) // 2  # 2 bytes per sample
    duration = num_samples / sample_rate
    return duration


def format_conversation_for_llm(conversation_history: list) -> str:
    """
    Format conversation history into string for LLM prompt.
    
    Args:
        conversation_history: List of {speaker, transcript} dicts
        
    Returns:
        Formatted conversation string
    """
    formatted = []
    for turn in conversation_history:
        speaker = turn.get("speaker", "unknown")
        transcript = turn.get("transcript", "")
        formatted.append(f"{speaker.upper()}: {transcript}")
    
    return "\n".join(formatted)


def validate_audio_format(audio_bytes: bytes) -> bool:
    """
    Basic validation of audio data.
    
    Returns:
        True if audio appears valid, False otherwise
    """
    if len(audio_bytes) < 100:  # Too short
        logger.warning("Audio data too short")
        return False
    
    # Check for WAV header (basic check)
    if audio_bytes[:4] == b'RIFF' and audio_bytes[8:12] == b'WAVE':
        return True
    
    # Check for raw PCM (no header, harder to validate)
    # Just check if it's not empty
    return len(audio_bytes) > 0