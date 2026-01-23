"""
ASR (Automatic Speech Recognition) Service using OpenAI Whisper
"""
import os
import tempfile
from typing import Optional
import whisper
import torch


class ASRService:
    """Service for transcribing audio to text using Whisper"""
    
    def __init__(self, model_size: str = "base"):
        """
        Initialize the ASR service with Whisper model
        
        Args:
            model_size: Size of Whisper model (tiny, base, small, medium, large)
                       base is recommended for good balance of speed and accuracy
        """
        self.model_size = model_size
        print(f"Loading Whisper model '{model_size}'... This may take a moment...")
        
        # Load model for CPU (macOS)
        self.device = "cpu"
        self.model = whisper.load_model(model_size, device=self.device)
        
        print(f"✓ ASR Service initialized with Whisper {model_size} model on {self.device}")
    
    def transcribe(self, audio_bytes: bytes) -> str:
        """
        Transcribe audio bytes to text
        
        Args:
            audio_bytes: Raw audio file bytes (WAV, MP3, etc.)
            
        Returns:
            Transcribed text
            
        Raises:
            Exception: If transcription fails
        """
        temp_file_path = None
        try:
            # Create temporary file for audio
            with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as temp_file:
                temp_file.write(audio_bytes)
                temp_file_path = temp_file.name
            
            # Transcribe using Whisper
            result = self.model.transcribe(
                temp_file_path,
                language="en",
                fp16=False  # Use FP32 for CPU
            )
            
            transcript = result["text"].strip()
            
            # Handle empty transcription
            if not transcript:
                return "[No speech detected]"
            
            return transcript
            
        except Exception as e:
            print(f"Error during transcription: {e}")
            raise Exception(f"Transcription failed: {str(e)}")
        
        finally:
            # Clean up temporary file
            if temp_file_path and os.path.exists(temp_file_path):
                try:
                    os.unlink(temp_file_path)
                except:
                    pass
    
    def transcribe_file(self, file_path: str) -> str:
        """
        Transcribe an audio file directly
        
        Args:
            file_path: Path to audio file
            
        Returns:
            Transcribed text
        """
        with open(file_path, 'rb') as f:
            audio_bytes = f.read()
        return self.transcribe(audio_bytes)
