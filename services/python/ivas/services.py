"""
IVAS Services - AI service implementations
Contains ASR, TTS, and LLM service classes
"""

from typing import Optional, List, Dict, Any
import logging
import tempfile
import os

from config import settings

logger = logging.getLogger(__name__)

# Lazy import for whisper to avoid startup delay
_whisper_model = None


class ASRService:
    """
    Automatic Speech Recognition Service using OpenAI Whisper.
    Provides accurate transcription of audio to text.
    """
    
    def __init__(self, model_size: str = None):
        """
        Initialize ASR service.
        
        Args:
            model_size: Whisper model size (tiny, base, small, medium, large)
        """
        self.model_size = model_size or settings.WHISPER_MODEL_SIZE
        self.model = None
        self._initialized = False
        logger.info(f"ASR Service created with model size: {self.model_size}")
    
    def initialize(self):
        """
        Initialize the Whisper model.
        Called lazily on first transcription request.
        """
        global _whisper_model
        
        if self._initialized and self.model is not None:
            return
        
        # Reuse global model if same size
        if _whisper_model is not None:
            self.model = _whisper_model
            self._initialized = True
            logger.info("ASR Service reusing existing model")
            return
        
        try:
            import whisper
            
            logger.info(f"Loading Whisper model: {self.model_size}...")
            self.model = whisper.load_model(self.model_size)
            _whisper_model = self.model
            self._initialized = True
            logger.info(f"Whisper model loaded successfully: {self.model_size}")
        except Exception as e:
            logger.error(f"Failed to initialize Whisper model: {e}")
            raise RuntimeError(f"ASR initialization failed: {e}")
    
    def transcribe(self, audio_bytes: bytes, language: str = "en") -> Dict[str, Any]:
        """
        Transcribe audio to text.
        
        Args:
            audio_bytes: Raw audio data (WAV, MP3, etc.)
            language: Expected language code (e.g., 'en', 'es', 'fr')
        
        Returns:
            Dict with transcript, confidence, duration, and language
        """
        self.initialize()
        
        if len(audio_bytes) == 0:
            return {
                "transcript": "",
                "confidence": 0.0,
                "duration": 0.0,
                "language": language,
            }
        
        # Save audio to temp file (whisper requires file path)
        temp_file = None
        try:
            temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=".wav")
            temp_file.write(audio_bytes)
            temp_file.close()
            
            logger.info(f"Transcribing {len(audio_bytes)} bytes of audio...")
            
            # Perform transcription using openai-whisper
            result = self.model.transcribe(
                temp_file.name,
                language=language,
                fp16=False,  # Use FP32 for CPU compatibility
            )
            
            transcript = result.get("text", "").strip()
            detected_language = result.get("language", language)
            
            # Calculate duration from segments if available
            segments = result.get("segments", [])
            duration = 0.0
            total_confidence = 0.0
            
            if segments:
                duration = segments[-1].get("end", 0.0) if segments else 0.0
                # Average no_speech_prob as inverse confidence
                for seg in segments:
                    total_confidence += (1.0 - seg.get("no_speech_prob", 0.5))
                avg_confidence = total_confidence / len(segments)
            else:
                avg_confidence = 0.5
            
            logger.info(f"Transcription complete: {len(transcript)} chars, {duration:.1f}s")
            
            return {
                "transcript": transcript,
                "confidence": round(avg_confidence, 3),
                "duration": round(duration, 2),
                "language": detected_language,
            }
            
        except Exception as e:
            logger.error(f"Transcription failed: {e}")
            raise RuntimeError(f"Transcription failed: {e}")
        finally:
            # Clean up temp file
            if temp_file and os.path.exists(temp_file.name):
                os.unlink(temp_file.name)
    
    @property
    def is_available(self) -> bool:
        """Check if ASR service is available"""
        try:
            import whisper
            return True
        except ImportError:
            return False


# Lazy import for TTS
_tts_initialized = False


class TTSService:
    """
    Text-to-Speech Service using Edge TTS (Microsoft Azure Neural Voices).
    Provides high-quality, natural-sounding speech synthesis.
    """
    
    # Voice mappings for different emotions/styles
    VOICE_STYLES = {
        "neutral": "en-US-AriaNeural",
        "friendly": "en-US-JennyNeural",
        "professional": "en-US-GuyNeural",
        "empathetic": "en-US-SaraNeural",
        "calm": "en-GB-SoniaNeural",
    }
    
    def __init__(self, model_name: str = None):
        """
        Initialize TTS service.
        
        Args:
            model_name: Voice model to use (default: en-US-AriaNeural)
        """
        self.model_name = model_name or settings.TTS_MODEL
        self._initialized = False
        logger.info(f"TTS Service created with voice: {self.model_name}")
    
    def initialize(self):
        """
        Initialize the TTS service.
        Called lazily on first synthesis request.
        """
        global _tts_initialized
        
        if self._initialized:
            return
        
        try:
            import edge_tts
            self._initialized = True
            _tts_initialized = True
            logger.info("TTS Service initialized successfully")
        except ImportError as e:
            logger.error(f"Failed to import edge_tts: {e}")
            raise RuntimeError("TTS initialization failed: edge-tts not installed")
    
    async def synthesize_async(
        self, 
        text: str, 
        emotion: str = "neutral",
        speed: float = 1.0,
        language: str = "en"
    ) -> bytes:
        """
        Synthesize speech from text asynchronously.
        
        Args:
            text: Text to synthesize
            emotion: Emotion/style of speech (neutral, friendly, professional, empathetic, calm)
            speed: Speech speed multiplier (0.5 to 2.0)
            language: Language code (used for voice selection)
        
        Returns:
            WAV audio bytes
        """
        self.initialize()
        
        import edge_tts
        import io
        
        # Select voice based on emotion
        voice = self.VOICE_STYLES.get(emotion, self.VOICE_STYLES["neutral"])
        
        # Adjust rate based on speed
        rate = f"{int((speed - 1) * 100):+d}%"
        
        logger.info(f"TTS synthesizing: '{text[:50]}...' with voice={voice}, rate={rate}")
        
        try:
            # Create communicator
            communicate = edge_tts.Communicate(text, voice, rate=rate)
            
            # Collect audio data
            audio_data = io.BytesIO()
            async for chunk in communicate.stream():
                if chunk["type"] == "audio":
                    audio_data.write(chunk["data"])
            
            audio_bytes = audio_data.getvalue()
            
            # Convert MP3 to WAV for consistent output format
            wav_bytes = self._mp3_to_wav(audio_bytes)
            
            logger.info(f"TTS synthesis complete: {len(wav_bytes)} bytes")
            return wav_bytes
            
        except Exception as e:
            logger.error(f"TTS synthesis failed: {e}")
            raise RuntimeError(f"TTS synthesis failed: {e}")
    
    def synthesize(
        self, 
        text: str, 
        emotion: str = "neutral",
        speed: float = 1.0,
        language: str = "en"
    ) -> bytes:
        """
        Synchronous wrapper for synthesize_async.
        
        Args:
            text: Text to synthesize
            emotion: Emotion/style of speech
            speed: Speech speed multiplier
            language: Language code
        
        Returns:
            WAV audio bytes
        """
        import asyncio
        
        try:
            loop = asyncio.get_event_loop()
        except RuntimeError:
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
        
        if loop.is_running():
            # If called from async context, create new loop in thread
            import concurrent.futures
            with concurrent.futures.ThreadPoolExecutor() as executor:
                future = executor.submit(
                    asyncio.run,
                    self.synthesize_async(text, emotion, speed, language)
                )
                return future.result()
        else:
            return loop.run_until_complete(
                self.synthesize_async(text, emotion, speed, language)
            )
    
    def _mp3_to_wav(self, mp3_bytes: bytes) -> bytes:
        """Convert MP3 audio to WAV format"""
        try:
            from pydub import AudioSegment
            import io
            
            # Load MP3
            audio = AudioSegment.from_mp3(io.BytesIO(mp3_bytes))
            
            # Convert to WAV
            wav_buffer = io.BytesIO()
            audio.export(wav_buffer, format="wav")
            return wav_buffer.getvalue()
            
        except Exception as e:
            logger.warning(f"MP3 to WAV conversion failed: {e}, returning MP3")
            return mp3_bytes
    
    def _create_empty_wav(self) -> bytes:
        """Create an empty but valid WAV file"""
        return bytes([
            0x52, 0x49, 0x46, 0x46,  # "RIFF"
            0x24, 0x00, 0x00, 0x00,  # File size
            0x57, 0x41, 0x56, 0x45,  # "WAVE"
            0x66, 0x6D, 0x74, 0x20,  # "fmt "
            0x10, 0x00, 0x00, 0x00,  # Chunk size
            0x01, 0x00,              # Audio format (PCM)
            0x01, 0x00,              # Channels (mono)
            0x80, 0x3E, 0x00, 0x00,  # Sample rate (16000)
            0x00, 0x7D, 0x00, 0x00,  # Byte rate
            0x02, 0x00,              # Block align
            0x10, 0x00,              # Bits per sample
            0x64, 0x61, 0x74, 0x61,  # "data"
            0x00, 0x00, 0x00, 0x00,  # Data size
        ])
    
    @property
    def is_available(self) -> bool:
        """Check if TTS service is available"""
        try:
            import edge_tts
            return True
        except ImportError:
            return False


class LLMService:
    """
    Large Language Model Service using Ollama with Llama 3.1.
    Will be fully implemented in Step 7.
    """
    
    def __init__(self, model: str = None):
        """
        Initialize LLM service.
        
        Args:
            model: Ollama model name
        """
        self.model = model or settings.OLLAMA_MODEL
        self.client = None
        self._initialized = False
        logger.info(f"LLM Service created with model: {self.model}")
    
    def initialize(self):
        """
        Initialize the Ollama client.
        Called lazily on first request.
        """
        if self._initialized:
            return
        
        # TODO: Implement in Step 7
        # import ollama
        # self.client = ollama.Client(host=settings.OLLAMA_HOST)
        
        self._initialized = True
        logger.info("LLM Service initialized (placeholder)")
    
    def generate_question(
        self,
        code: Optional[str] = None,
        topic: Optional[str] = None,
        difficulty: str = "medium",
        conversation_history: List[Dict[str, str]] = None,
    ) -> Dict[str, Any]:
        """
        Generate a Socratic question for viva assessment.
        
        Args:
            code: Student's code submission
            topic: Topic being assessed
            difficulty: Question difficulty level
            conversation_history: Previous conversation turns
        
        Returns:
            Dict with question and metadata
        """
        self.initialize()
        
        # TODO: Implement actual generation in Step 7
        logger.info(f"Question generation requested for topic: {topic}")
        
        return {
            "question": "Can you explain how your code handles edge cases?",
            "difficulty": difficulty,
            "topic": topic or "general programming",
            "follow_up_hints": [
                "Consider what happens with empty input",
                "Think about boundary conditions",
            ],
        }
    
    def assess_response(
        self,
        question: str,
        response: str,
        expected_concepts: List[str] = None,
        code_context: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Assess a student's response to a question.
        
        Args:
            question: The question that was asked
            response: Student's response
            expected_concepts: Concepts expected in the answer
            code_context: Relevant code for context
        
        Returns:
            Dict with assessment details
        """
        self.initialize()
        
        # TODO: Implement actual assessment in Step 7
        logger.info(f"Assessment requested for response: {response[:50]}...")
        
        return {
            "understanding_level": "partial",
            "clarity": "clear",
            "confidence_score": 0.7,
            "misconceptions": [],
            "strengths": ["Clear communication"],
            "areas_for_improvement": ["Could provide more specific examples"],
            "suggested_follow_up": "Can you elaborate on that with a specific example?",
        }
    
    @property
    def is_available(self) -> bool:
        """Check if LLM service is available"""
        return True  # Placeholder returns true


# Singleton instances for the services
asr_service = ASRService()
tts_service = TTSService()
llm_service = LLMService()
