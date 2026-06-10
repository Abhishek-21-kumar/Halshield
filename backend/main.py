"""
HalShield — FastAPI Application Entry Point.
LLM Hallucination Detection and RAG-Based Fact Verification Platform.
"""
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import settings
from database.models import init_db
from routes.auth_routes import router as auth_router
from routes.analysis_routes import router as analysis_router
from routes.health_routes import router as health_router

# ─── App Setup ─────────────────────────────────────────────
app = FastAPI(
    title="HalShield API",
    description="LLM Hallucination Detection and RAG-Based Fact Verification Platform",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# ─── CORS ──────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Register Routers ─────────────────────────────────────
app.include_router(auth_router)
app.include_router(analysis_router)
app.include_router(health_router)


# ─── Startup Event ────────────────────────────────────────
@app.on_event("startup")
def on_startup():
    """Initialize database tables on startup."""
    init_db()
    print("=" * 44)
    print("    HalShield API Server Started")
    print("    Docs: http://localhost:8000/docs")
    print("=" * 44)


# ─── Root Redirect ─────────────────────────────────────────
@app.get("/", tags=["System"])
def root():
    """API root — redirect to documentation."""
    return {
        "name": "HalShield API",
        "version": "2.0.0",
        "status": "running",
        "docs": "/docs",
    }


# ─── Entry Point ──────────────────────────────────────────
if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=True,
    )
