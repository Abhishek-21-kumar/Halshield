"""
HalShield — Pydantic request / response schemas for all API endpoints.
"""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field


# ═══════════════════════════════════════════════════════════
# Auth Schemas
# ═══════════════════════════════════════════════════════════

class RegisterRequest(BaseModel):
    email: str = Field(..., min_length=5, examples=["user@example.com"])
    password: str = Field(..., min_length=6, examples=["securepassword"])
    name: str = Field(default="User", examples=["John Doe"])


class LoginRequest(BaseModel):
    email: str = Field(..., examples=["user@example.com"])
    password: str = Field(..., examples=["securepassword"])


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: int
    email: str
    name: str


# ═══════════════════════════════════════════════════════════
# Analysis Schemas
# ═══════════════════════════════════════════════════════════

class AnalyzeRequest(BaseModel):
    question: str = Field(..., min_length=1, examples=["Who founded Tesla?"])
    answer: str = Field(..., min_length=1, examples=["Tesla was founded in 2001 by Elon Musk."])
    model: str = Field(default="GPT", examples=["GPT", "Gemini", "Llama", "Mistral"])
    document_id: Optional[int] = None  # If user uploaded a doc for RAG


class ClaimResult(BaseModel):
    index: int
    text: str
    label: str  # "SUPPORTED", "HALLUCINATED", "UNCERTAIN"
    hallucination_score: float
    color: str  # "green", "red", "yellow"
    evidence: list[dict] = []
    explanation: str = ""
    nli_scores: Optional[dict] = None


class CorrectedAnswer(BaseModel):
    original: str
    corrected: str
    changes: list[dict] = []


class AnalyzeResponse(BaseModel):
    analysis_id: int
    overall_score: float
    risk_level: str  # "low", "medium", "high"
    claims: list[ClaimResult]
    evidence_sources: list[dict] = []
    rag_chunks: list[dict] = []
    corrected_answer: Optional[CorrectedAnswer] = None
    model_used: str
    detection_mode: str = "NLI + RAG"
    num_claims: int
    num_hallucinated: int
    num_supported: int
    num_uncertain: int
    timestamp: str


# ═══════════════════════════════════════════════════════════
# Document Upload Schemas
# ═══════════════════════════════════════════════════════════

class DocumentUploadResponse(BaseModel):
    document_id: int
    filename: str
    chunk_count: int
    status: str
    message: str


# ═══════════════════════════════════════════════════════════
# History / Dashboard Schemas
# ═══════════════════════════════════════════════════════════

class HistoryItem(BaseModel):
    id: int
    question: str
    answer: str
    model_used: str
    overall_score: float
    risk_level: str
    num_claims: int
    num_hallucinated: int
    created_at: str


class DashboardData(BaseModel):
    total_analyses: int
    total_hallucinations: int
    total_documents: int
    average_score: float
    model_breakdown: list[dict]
    risk_distribution: dict
    recent_analyses: list[HistoryItem]
    timeline: list[dict]


# ═══════════════════════════════════════════════════════════
# Health
# ═══════════════════════════════════════════════════════════

class HealthResponse(BaseModel):
    status: str = "healthy"
    version: str = "2.0.0"
    models_loaded: bool
    database_connected: bool


# ═══════════════════════════════════════════════════════════
# Settings Schemas
# ═══════════════════════════════════════════════════════════

class SettingsResponse(BaseModel):
    hallucination_threshold: float
    medium_threshold: float
    nli_model: str
    embedding_model: str
    chunk_size: int
    chunk_overlap: int
    top_k_results: int
    available_models: list[str]


class SettingsUpdateRequest(BaseModel):
    hallucination_threshold: Optional[float] = None
    medium_threshold: Optional[float] = None
    chunk_size: Optional[int] = None
    chunk_overlap: Optional[int] = None
    top_k_results: Optional[int] = None

