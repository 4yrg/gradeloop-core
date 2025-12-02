"""
Business logic for IVAS module.
Contains service classes for ASR, TTS, LLM, and assessment logic.
"""

import logging
import io
import tempfile
import os
from typing import Optional, List
from pathlib import Path

logger = logging.getLogger(__name__)


class ASRService:
    """Automatic Speech Recognition service using Faster-Whisper"""
    
    def __init__(self, model_size: str = "base", device: str = "cpu"):
        """
        Initialize ASR service with Faster-Whisper model.
        
        Args:
            model_size: Whisper model size (tiny, base, small, medium, large)
            device: Device to run on ("cpu" or "cuda")
        """
        try:
            from faster_whisper import WhisperModel
            
            # Set model cache directory within ivas module
            models_dir = Path(__file__).parent / "models" / "whisper"
            models_dir.mkdir(parents=True, exist_ok=True)
            
            logger.info(f"Loading Faster-Whisper model: {model_size} on {device}")
            logger.info(f"Model cache directory: {models_dir}")
            
            # Initialize the Whisper model
            # Models will auto-download to models_dir on first run
            self.model = WhisperModel(
                model_size,
                device=device,
                compute_type="int8",  # Use int8 for better performance on CPU
                download_root=str(models_dir)
            )
            
            logger.info(f"ASRService initialized successfully with {model_size} model")
            
        except ImportError:
            logger.error("faster-whisper not installed. Run: pip install faster-whisper")
            raise
        except Exception as e:
            logger.error(f"Failed to initialize ASRService: {e}")
            raise
    
    async def transcribe(self, audio_bytes: bytes) -> str:
        """
        Transcribe audio to text.
        
        Args:
            audio_bytes: Raw audio data (supports WAV, MP3, WebM)
            
        Returns:
            Transcribed text
        """
        try:
            # Save audio bytes to temporary file
            # Faster-Whisper requires a file path, not bytes directly
            with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as temp_audio:
                temp_audio.write(audio_bytes)
                temp_audio_path = temp_audio.name
            
            try:
                # Transcribe audio
                logger.info(f"Transcribing audio file: {temp_audio_path}")
                segments, info = self.model.transcribe(
                    temp_audio_path,
                    beam_size=5,
                    language=None,  # Auto-detect language
                    vad_filter=True,  # Voice Activity Detection to filter silence
                )
                
                # Log detected language
                logger.info(f"Detected language: {info.language} (probability: {info.language_probability:.2f})")
                
                # Combine all segments into full transcription
                transcription = " ".join([segment.text for segment in segments])
                
                logger.info(f"Transcription completed: {transcription[:100]}...")
                return transcription.strip()
                
            finally:
                # Clean up temporary file
                if os.path.exists(temp_audio_path):
                    os.unlink(temp_audio_path)
                    
        except Exception as e:
            logger.error(f"Transcription failed: {e}")
            raise RuntimeError(f"ASR transcription error: {str(e)}")


class TTSService:
    """Text-to-Speech service using Piper TTS"""
    
    def __init__(self, voice_model: str = "en_US-lessac-medium"):
        """
        Initialize TTS service with Piper.
        
        Args:
            voice_model: Piper voice model name (e.g., "en_US-lessac-medium")
        """
        try:
            from piper import PiperVoice
            import wave
            
            # Set model cache directory within ivas module
            self.models_dir = Path(__file__).parent / "models" / "piper"
            self.models_dir.mkdir(parents=True, exist_ok=True)
            
            self.voice_model = voice_model
            self.model_path = self.models_dir / f"{voice_model}.onnx"
            self.config_path = self.models_dir / f"{voice_model}.onnx.json"
            
            logger.info(f"Initializing Piper TTS with voice model: {voice_model}")
            logger.info(f"Model cache directory: {self.models_dir}")
            
            # Check if model files exist
            if not self.model_path.exists() or not self.config_path.exists():
                logger.error(f"Model files not found at {self.model_path}")
                logger.info("Please download voice model files:")
                logger.info(f"  curl -L -o {self.model_path} https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/en/en_US/lessac/medium/en_US-lessac-medium.onnx")
                logger.info(f"  curl -L -o {self.config_path} https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/en/en_US/lessac/medium/en_US-lessac-medium.onnx.json")
                raise FileNotFoundError(f"Model files not found: {self.model_path}")
            
            logger.info(f"✅ Model files found: {self.model_path.name}")
            
            # Load the voice model
            logger.info("Loading Piper voice model...")
            self.voice = PiperVoice.load(str(self.model_path), config_path=str(self.config_path))
            
            logger.info("TTSService initialized successfully")
            
        except ImportError:
            logger.error("piper-tts not installed. Run: pip install piper-tts")
            raise
        except Exception as e:
            logger.error(f"Failed to initialize TTSService: {e}")
            raise
    
    async def synthesize(self, text: str) -> bytes:
        """
        Convert text to speech audio.
        
        Args:
            text: Text to convert
            
        Returns:
            Audio bytes (WAV format)
        """
        try:
            import wave
            import struct
            
            logger.info(f"Synthesizing text: {text[:50]}...")
            
            # Synthesize speech
            # PiperVoice.synthesize returns a generator of AudioChunk objects
            audio_chunks = []
            for audio_chunk in self.voice.synthesize(text):
                # AudioChunk has audio_int16_bytes property
                audio_chunks.append(audio_chunk.audio_int16_bytes)
            
            # Combine audio chunks and create WAV file
            with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as temp_output:
                temp_output_path = temp_output.name
            
            try:
                # Write WAV file
                with wave.open(temp_output_path, "wb") as wav_file:
                    # Set WAV parameters from voice config
                    wav_file.setnchannels(1)  # Mono
                    wav_file.setsampwidth(2)  # 16-bit
                    wav_file.setframerate(self.voice.config.sample_rate)
                    
                    # Write all audio chunks
                    for audio_bytes_chunk in audio_chunks:
                        wav_file.writeframes(audio_bytes_chunk)
                
                # Read the generated WAV file
                with open(temp_output_path, "rb") as f:
                    audio_bytes = f.read()
                
                logger.info(f"✅ Synthesized {len(audio_bytes)} bytes of audio")
                return audio_bytes
                
            finally:
                # Clean up temporary file
                if os.path.exists(temp_output_path):
                    os.unlink(temp_output_path)
                    
        except Exception as e:
            logger.error(f"Synthesis failed: {e}")
            raise RuntimeError(f"TTS synthesis error: {str(e)}")


class LLMService:
    """Large Language Model service using Ollama + Llama 3.1"""
    
    def __init__(self):
        # TODO: Implement in Step 4
        logger.info("LLMService initialized (placeholder)")
    
    async def generate_question(
        self,
        conversation_history: List[dict],
        lab_assignment: str,
        student_code: str
    ) -> str:
        """
        Generate next viva question based on conversation.
        
        Args:
            conversation_history: Previous turns
            lab_assignment: Lab description
            student_code: Student's code
            
        Returns:
            AI question text
        """
        # TODO: Implement in Step 4
        raise NotImplementedError("LLM not implemented yet - coming in Step 4")
    
    async def assess_response(
        self,
        student_response: str,
        conversation_history: List[dict]
    ) -> dict:
        """
        Assess student's response quality.
        
        Returns:
            {
                "understanding_level": "clear" | "partial" | "confused",
                "has_misconception": bool,
                "next_difficulty": "easier" | "same" | "harder"
            }
        """
        # TODO: Implement in Step 7
        raise NotImplementedError("Assessment not implemented yet - coming in Step 7")


class AdaptiveAssessmentEngine:
    """
    Core assessment logic for adaptive questioning.
    Manages difficulty adjustment and final evaluation.
    """
    
    def __init__(self):
        self.llm_service = LLMService()
        logger.info("AdaptiveAssessmentEngine initialized")
    
    async def determine_next_question_difficulty(
        self,
        conversation_history: List[dict]
    ) -> str:
        """
        Decide if next question should be easier, same, or harder.
        
        Returns:
            "easier" | "same" | "harder"
        """
        # TODO: Implement in Step 7
        return "same"
    
    async def generate_final_assessment(
        self,
        conversation_history: List[dict],
        lab_assignment: str,
        student_code: str
    ) -> dict:
        """
        Generate comprehensive assessment after viva ends.
        
        Returns:
            {
                "overall_score": int,
                "competency_level": str,
                "misconceptions": List[str],
                "strengths": str,
                "weaknesses": str,
                "full_analysis": str
            }
        """
        # TODO: Implement in Step 7
        raise NotImplementedError("Final assessment not implemented yet - coming in Step 7")