"""
Configuration for IVAS (Interactive Viva Assessment System)
"""

import os
from enum import Enum


class Environment(Enum):
    """Deployment environment"""
    DEVELOPMENT = "development"
    PRODUCTION = "production"


class IVASConfig:
    """
    Central configuration for IVAS system.
    
    Environment-based settings:
    - DEVELOPMENT: Fast Piper TTS (0.1-0.2s response)
    - PRODUCTION: Natural XTTS TTS with GPU (0.5-1s response)
    """
    
    # Environment (set via IVAS_ENV environment variable)
    ENVIRONMENT = Environment(os.getenv("IVAS_ENV", "development"))
    
    # ASR Configuration
    ASR_MODEL_SIZE = os.getenv("ASR_MODEL_SIZE", "base")  # tiny, base, small, medium, large
    ASR_DEVICE = os.getenv("ASR_DEVICE", "cpu")  # cpu or cuda
    
    # TTS Configuration
    # In development: Use fast Piper TTS (instant response)
    # In production: Use natural XTTS with GPU (requires GPU server)
    TTS_ENGINE = "piper" if ENVIRONMENT == Environment.DEVELOPMENT else "xtts"
    TTS_USE_GPU = os.getenv("TTS_USE_GPU", "false").lower() == "true"
    
    # Piper TTS settings
    PIPER_VOICE_MODEL = os.getenv("PIPER_VOICE_MODEL", "en_US-lessac-medium")
    
    # XTTS settings
    XTTS_LANGUAGE = os.getenv("XTTS_LANGUAGE", "en")
    XTTS_REFERENCE_VOICE = os.getenv("XTTS_REFERENCE_VOICE", None)  # Path to reference audio
    
    # LLM Configuration (Ollama)
    LLM_MODEL = os.getenv("LLM_MODEL", "llama3.1:8b")
    LLM_HOST = os.getenv("LLM_HOST", "http://localhost:11434")
    LLM_TIMEOUT = int(os.getenv("LLM_TIMEOUT", "30"))
    
    # Assessment Configuration
    MAX_CONVERSATION_TURNS = int(os.getenv("MAX_CONVERSATION_TURNS", "10"))
    MIN_CONVERSATION_TURNS = int(os.getenv("MIN_CONVERSATION_TURNS", "5"))
    
    # Performance thresholds
    MAX_RESPONSE_TIME_MS = 2000 if ENVIRONMENT == Environment.DEVELOPMENT else 1500
    
    @classmethod
    def is_development(cls) -> bool:
        """Check if running in development mode"""
        return cls.ENVIRONMENT == Environment.DEVELOPMENT
    
    @classmethod
    def is_production(cls) -> bool:
        """Check if running in production mode"""
        return cls.ENVIRONMENT == Environment.PRODUCTION
    
    @classmethod
    def get_tts_engine(cls) -> str:
        """Get configured TTS engine"""
        return cls.TTS_ENGINE
    
    @classmethod
    def summary(cls) -> str:
        """Get configuration summary"""
        import torch
        
        gpu_info = "None"
        if torch.cuda.is_available():
            gpu_info = f"NVIDIA CUDA ({torch.cuda.get_device_name(0)})"
        elif torch.backends.mps.is_available():
            gpu_info = "Apple Silicon MPS (limited XTTS support)"
        
        return f"""
IVAS Configuration:
  Environment: {cls.ENVIRONMENT.value}
  
  Hardware:
    GPU: {gpu_info}
    
  ASR (Speech Recognition):
    Model: Faster-Whisper {cls.ASR_MODEL_SIZE}
    Device: {cls.ASR_DEVICE}
    Speed: Real-time (~1x audio duration)
  
  TTS (Speech Synthesis):
    Engine: XTTS v2 (Natural Voice)
    Device: {'NVIDIA GPU' if torch.cuda.is_available() else 'CPU (Development)'}
    Expected Speed:
      • With NVIDIA GPU: 0.5-1 second ✅ Real-time ready
      • With CPU: 3-6 seconds ⚠️ Development only
      • With Apple MPS: Not supported (falls back to CPU)
  
  LLM (AI Assessor):
    Model: {cls.LLM_MODEL}
    Host: {cls.LLM_HOST}
  
  Performance Target:
    Max Response Time: {cls.MAX_RESPONSE_TIME_MS}ms
    
  🚀 Production Deployment:
     For real-time conversation, deploy on cloud server with NVIDIA GPU:
     • AWS EC2 (g4dn instances)
     • Google Cloud (T4 or A10 GPUs)
     • Azure (NC-series VMs)
"""


# Example usage:
if __name__ == "__main__":
    print(IVASConfig.summary())
