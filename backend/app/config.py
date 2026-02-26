from pathlib import Path
from pydantic_settings import BaseSettings
from functools import lru_cache

# Absolute path to .env so it's found regardless of the working directory
_ENV_FILE = str(Path(__file__).resolve().parent.parent / ".env")


class Settings(BaseSettings):
    # App settings
    app_name: str = "ClearFlow API"
    debug: bool = True
    api_prefix: str = "/api/v1"

    # Database
    database_url: str = "mysql+aiomysql://root:@localhost:3307/clearflow"

    # Security
    secret_key: str = "your-super-secret-key-change-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 7

    # CORS
    cors_origins: list[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
        "http://localhost",
        "http://127.0.0.1",
    ]

    # Gemini AI (optional - will use mock responses if not set)
    gemini_api_key: str = ""

    class Config:
        env_file = _ENV_FILE
        env_file_encoding = "utf-8"


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
