from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "AI Services (CIPAS)"
    API_V1_STR: str = "/api/v1"
    
    # Model Paths
    MODEL_PATH_UNIXCODER: str
    MODEL_PATH_CODELIAMA: str

    model_config = SettingsConfigDict(env_file=".env")

settings = Settings()