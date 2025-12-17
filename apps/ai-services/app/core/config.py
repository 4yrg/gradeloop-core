"""
Configuration settings for AI Services
"""
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    PROJECT_NAME: str = "AI Services API"
    API_V1_STR: str = "/api/v1"
    
    # ML Model paths (for future use)
    MODEL_PATH_UNIXCODER: str = ""
    MODEL_PATH_CODELIAMA: str = ""
    
    class Config:
        case_sensitive = True


settings = Settings()
