"""
HalShield — Configuration management.
Loads from .env with sensible defaults for all services.
"""
import os
import json
from pydantic import field_validator
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

load_dotenv()


class Settings(BaseSettings):
    # ─── Server ────────────────────────────────────────────
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    FRONTEND_URL: str = ""
    CORS_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
        "http://localhost:3000",
        "http://localhost:3001",
    ]

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, v):
        if isinstance(v, str):
            if v.startswith("[") and v.endswith("]"):
                try:
                    return json.loads(v)
                except Exception:
                    pass
            return [origin.strip() for origin in v.split(",") if origin.strip()]
        return v

    # ─── JWT Authentication ────────────────────────────────
    JWT_SECRET_KEY: str = "halshield-super-secret-change-in-production-2024"
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours

    # ─── API Keys (optional — for external LLM features) ──
    OPENAI_API_KEY: str = ""
    HUGGINGFACE_API_KEY: str = ""

    # ─── NLI Models ────────────────────────────────────────
    NLI_MODEL: str = "cross-encoder/nli-deberta-v3-base"
    EMBEDDING_MODEL: str = "all-MiniLM-L6-v2"
    LLM_MODEL: str = "gpt-3.5-turbo"
    NUM_SAMPLES: int = 3

    # ─── Thresholds ────────────────────────────────────────
    HALLUCINATION_THRESHOLD: float = 0.6
    MEDIUM_THRESHOLD: float = 0.3

    # ─── Database ──────────────────────────────────────────
    DATABASE_URL: str = "sqlite:///./halshield.db"

    # ─── FAISS Vector Store ────────────────────────────────
    FAISS_INDEX_PATH: str = "./vectorstore"

    # ─── File Uploads ──────────────────────────────────────
    UPLOAD_DIR: str = "./uploads"
    MAX_UPLOAD_SIZE_MB: int = 50

    # ─── RAG Settings ──────────────────────────────────────
    CHUNK_SIZE: int = 500
    CHUNK_OVERLAP: int = 100
    TOP_K_RESULTS: int = 5

    # ─── Available NLI Models ──────────────────────────────
    AVAILABLE_NLI_MODELS: list[str] = [
        "cross-encoder/nli-deberta-v3-base",
        "facebook/bart-large-mnli",
        "roberta-large-mnli",
    ]

    class Config:
        env_file = ".env"


settings = Settings()

if settings.FRONTEND_URL and settings.FRONTEND_URL not in settings.CORS_ORIGINS:
    settings.CORS_ORIGINS.append(settings.FRONTEND_URL.rstrip("/"))

# Ensure directories exist
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
os.makedirs(settings.FAISS_INDEX_PATH, exist_ok=True)
