"""
HalShield — Health check route.
"""
from fastapi import APIRouter
from models.schemas import HealthResponse

router = APIRouter(tags=["System"])


@router.get("/health", response_model=HealthResponse)
def health_check():
    """System health check endpoint."""
    return HealthResponse(
        status="healthy",
        version="2.0.0",
        models_loaded=True,
        database_connected=True,
    )
