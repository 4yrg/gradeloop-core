from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    PROJECT_NAME: str = "AI Services Microservice"
    API_V1_STR: str = "/api/v1"

    # Placeholder for future model paths
    # MODEL_PATH_UNIXCODER: str = "./models/unixcoder"

    class Config:
        env_file = ".env"


settings = Settings()