from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field
from typing import Literal

class Settings(BaseSettings):
    """
    Configuration settings for the code clone detection module.
    Reads from environment variables with prefix 'CODE_CLONE_'.
    """
    model_config = SettingsConfigDict(env_prefix='CODE_CLONE_')

    # Database settings
    DATABASE_URL: str = "sqlite+aiosqlite:///./code_clone_detection.db"

    # Artifact storage settings
    STORAGE_TYPE: Literal['local', 's3'] = "local"
    ARTIFACT_STORE_URI: str = "./artifact_store" # For local storage

    # S3 specific settings (used if STORAGE_TYPE is 's3')
    S3_ENDPOINT_URL: str | None = None
    S3_ACCESS_KEY_ID: str | None = None
    S3_SECRET_ACCESS_KEY: str | None = None
    S3_BUCKET_NAME: str = "code-clone-submissions"


settings = Settings()
