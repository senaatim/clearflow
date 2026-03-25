from pathlib import Path
from pydantic_settings import BaseSettings
from functools import lru_cache

_ENV_FILE = str(Path(__file__).resolve().parent.parent / ".env")


class Settings(BaseSettings):
    app_name: str = "ClearFlow API"
    debug: bool = True
    api_prefix: str = "/api/v1"

    mongodb_url: str = "mongodb://localhost:27017"
    mongodb_db_name: str = "clearflow"

    secret_key: str = "your-super-secret-key-change-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 7

    cors_origins: list[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
        "http://localhost",
        "http://127.0.0.1",
        "https://clearflow.onrender.com",
        "https://clearflow-frontend.onrender.com",
    ]

    groq_api_key: str = ""

    class Config:
        env_file = _ENV_FILE
        env_file_encoding = "utf-8"


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
