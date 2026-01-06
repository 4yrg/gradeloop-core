"""
Configuration settings for IVAS AI Services
"""

from typing import List
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables"""
    
    # Server settings
    HOST: str = "0.0.0.0"
    PORT: int = 8085
    DEBUG: bool = True
    
    # CORS settings
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:8000",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:8000",
    ]
    
    # IVAS Spring Boot Backend URL
    IVAS_BACKEND_URL: str = "http://localhost:8084"
    
    # Ollama settings (for LLM)
    OLLAMA_HOST: str = "http://localhost:11434"
    OLLAMA_MODEL: str = "llama3.1:8b"
    
    # ASR settings (Whisper)
    WHISPER_MODEL_SIZE: str = "base"
    WHISPER_DEVICE: str = "cpu"
    WHISPER_COMPUTE_TYPE: str = "int8"
    
    # TTS settings (Coqui)
    TTS_MODEL: str = "tts_models/multilingual/multi-dataset/xtts_v2"
    
    # Audio settings
    AUDIO_SAMPLE_RATE: int = 16000
    MAX_AUDIO_DURATION: int = 30  # seconds
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True


# Create settings instance
settings = Settings()
