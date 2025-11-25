from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    Configuration settings for the code clone detection module.
    """
    model_config = SettingsConfigDict(env_prefix='CODE_CLONE_')

    DATABASE_URL: str = "sqlite+aiosqlite:///./code_clone_detection.db"
    ARTIFACT_STORE_URI: str = "./artifact_store"


settings = Settings()
