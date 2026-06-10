"""
HalShield — Analysis routes.
POST /analyze           — run hallucination detection
POST /upload-document   — upload PDF for RAG
GET  /history           — user's analysis history
GET  /dashboard-data    — aggregated analytics
"""
import os
import json
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from sqlalchemy import func

from database.models import get_db, User, AnalysisRecord, Document
from auth.jwt_handler import get_current_user
from models.schemas import (
    AnalyzeRequest, AnalyzeResponse, DocumentUploadResponse,
    HistoryItem, DashboardData, SettingsResponse, SettingsUpdateRequest,
)
from services.hallucination_service import HallucinationDetector
from services.rag_service import RAGService
from config import settings

router = APIRouter(prefix="/api", tags=["Analysis"])

# Lazily initialized singletons
_detector: HallucinationDetector | None = None
_rag: RAGService | None = None


def get_detector() -> HallucinationDetector:
    global _detector
    if _detector is None:
        _detector = HallucinationDetector()
    return _detector


def get_rag() -> RAGService:
    global _rag
    if _rag is None:
        _rag = RAGService()
    return _rag


# ═══════════════════════════════════════════════════════════
# POST /analyze
# ═══════════════════════════════════════════════════════════
@router.post("/analyze", response_model=AnalyzeResponse)
def analyze(
    req: AnalyzeRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Run hallucination detection on the provided question + answer pair."""
    detector = get_detector()
    rag = get_rag()

    # Retrieve evidence from FAISS if documents have been uploaded
    evidence_chunks = []
    rag_chunks = []
    try:
        evidence_chunks = rag.retrieve(req.answer, top_k=settings.TOP_K_RESULTS)
        rag_chunks = [
            {"text": c["text"], "source": c.get("source", "uploaded document"), "score": c.get("score", 0.0)}
            for c in evidence_chunks
        ]
    except Exception:
        pass  # No documents indexed yet — proceed without RAG evidence

    # Build context from retrieved evidence
    context = "\n".join([c["text"] for c in evidence_chunks]) if evidence_chunks else ""

    # Run hallucination detection
    result = detector.detect(
        question=req.question,
        answer=req.answer,
        context=context,
        model_name=req.model,
    )

    if not result:
        raise HTTPException(
            status_code=500,
            detail="Hallucination detection engine failed to generate a result."
        )

    # Safely extract corrected answer text
    corrected_answer_val = result.get("corrected_answer")
    corrected_text = ""
    if isinstance(corrected_answer_val, dict):
        corrected_text = corrected_answer_val.get("corrected", "")
    elif isinstance(corrected_answer_val, str):
        corrected_text = corrected_answer_val

    # Save to database
    record = AnalysisRecord(
        user_id=user.id,
        question=req.question,
        answer=req.answer,
        model_used=req.model,
        overall_score=result.get("overall_score", 0.0),
        risk_level=result.get("risk_level", "low"),
        detection_mode="NLI + RAG",
        num_claims=result.get("num_claims", 0),
        num_hallucinated=result.get("num_hallucinated", 0),
        num_supported=result.get("num_supported", 0),
        num_uncertain=result.get("num_uncertain", 0),
        results_json=result,
        corrected_answer=corrected_text,
    )
    db.add(record)
    db.commit()
    db.refresh(record)

    return AnalyzeResponse(
        analysis_id=record.id,
        overall_score=result["overall_score"],
        risk_level=result["risk_level"],
        claims=result["claims"],
        evidence_sources=[{"text": c["text"], "source": c.get("source", "")} for c in evidence_chunks[:5]],
        rag_chunks=rag_chunks,
        corrected_answer=result.get("corrected_answer"),
        model_used=req.model,
        num_claims=result["num_claims"],
        num_hallucinated=result["num_hallucinated"],
        num_supported=result["num_supported"],
        num_uncertain=result["num_uncertain"],
        timestamp=datetime.utcnow().isoformat(),
    )


# ═══════════════════════════════════════════════════════════
# POST /upload-document
# ═══════════════════════════════════════════════════════════
@router.post("/upload-document", response_model=DocumentUploadResponse)
async def upload_document(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Upload a PDF/TXT/DOCX document for RAG-based evidence retrieval."""
    # Validate file type
    allowed_types = {".pdf", ".txt", ".docx"}
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in allowed_types:
        raise HTTPException(status_code=400, detail=f"Unsupported file type: {ext}")

    # Save file
    file_path = os.path.join(settings.UPLOAD_DIR, f"{user.id}_{file.filename}")
    content = await file.read()

    if len(content) > settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024:
        raise HTTPException(status_code=413, detail="File too large")

    with open(file_path, "wb") as f:
        f.write(content)

    # Process with RAG service
    rag = get_rag()
    try:
        chunk_count = rag.index_document(file_path, source=file.filename)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Document processing failed: {str(e)}")

    # Save to database
    doc = Document(
        user_id=user.id,
        filename=file.filename,
        file_path=file_path,
        file_size=len(content),
        chunk_count=chunk_count,
        status="processed",
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)

    return DocumentUploadResponse(
        document_id=doc.id,
        filename=file.filename,
        chunk_count=chunk_count,
        status="processed",
        message=f"Document processed successfully. {chunk_count} chunks indexed.",
    )


# ═══════════════════════════════════════════════════════════
# GET /history
# ═══════════════════════════════════════════════════════════
@router.get("/history")
def get_history(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Get the current user's analysis history."""
    records = (
        db.query(AnalysisRecord)
        .filter(AnalysisRecord.user_id == user.id)
        .order_by(AnalysisRecord.created_at.desc())
        .limit(50)
        .all()
    )
    return [
        HistoryItem(
            id=r.id,
            question=r.question[:100],
            answer=r.answer[:100],
            model_used=r.model_used or "GPT",
            overall_score=r.overall_score,
            risk_level=r.risk_level,
            num_claims=r.num_claims,
            num_hallucinated=r.num_hallucinated,
            created_at=r.created_at.isoformat() if r.created_at else "",
        )
        for r in records
    ]


# ═══════════════════════════════════════════════════════════
# GET /dashboard-data
# ═══════════════════════════════════════════════════════════
@router.get("/dashboard-data", response_model=DashboardData)
def get_dashboard(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Get aggregated analytics for the dashboard."""
    # Basic counts
    total_analyses = db.query(AnalysisRecord).filter(AnalysisRecord.user_id == user.id).count()
    total_docs = db.query(Document).filter(Document.user_id == user.id).count()

    # Aggregates
    stats = (
        db.query(
            func.sum(AnalysisRecord.num_hallucinated),
            func.avg(AnalysisRecord.overall_score),
        )
        .filter(AnalysisRecord.user_id == user.id)
        .first()
    )
    total_hallucinations = int(stats[0] or 0)
    average_score = round(float(stats[1] or 0), 3)

    # Model breakdown
    model_counts = (
        db.query(AnalysisRecord.model_used, func.count(AnalysisRecord.id))
        .filter(AnalysisRecord.user_id == user.id)
        .group_by(AnalysisRecord.model_used)
        .all()
    )
    model_breakdown = [{"model": m or "GPT", "count": c} for m, c in model_counts]

    # Risk distribution
    risk_counts = (
        db.query(AnalysisRecord.risk_level, func.count(AnalysisRecord.id))
        .filter(AnalysisRecord.user_id == user.id)
        .group_by(AnalysisRecord.risk_level)
        .all()
    )
    risk_distribution = {r: c for r, c in risk_counts}

    # Recent analyses
    recent = (
        db.query(AnalysisRecord)
        .filter(AnalysisRecord.user_id == user.id)
        .order_by(AnalysisRecord.created_at.desc())
        .limit(10)
        .all()
    )
    recent_items = [
        HistoryItem(
            id=r.id,
            question=r.question[:80],
            answer=r.answer[:80],
            model_used=r.model_used or "GPT",
            overall_score=r.overall_score,
            risk_level=r.risk_level,
            num_claims=r.num_claims,
            num_hallucinated=r.num_hallucinated,
            created_at=r.created_at.isoformat() if r.created_at else "",
        )
        for r in recent
    ]

    # Timeline (last 7 analyses as data points)
    timeline = [
        {"date": r.created_at.strftime("%m/%d") if r.created_at else "", "score": r.overall_score}
        for r in reversed(recent[:7])
    ]

    return DashboardData(
        total_analyses=total_analyses,
        total_hallucinations=total_hallucinations,
        total_documents=total_docs,
        average_score=average_score,
        model_breakdown=model_breakdown,
        risk_distribution=risk_distribution,
        recent_analyses=recent_items,
        timeline=timeline,
    )


# ═══════════════════════════════════════════════════════════
# GET /api/analysis/{record_id}
# ═══════════════════════════════════════════════════════════
@router.get("/analysis/{record_id}")
def get_analysis_record(
    record_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Retrieve a specific historical analysis record."""
    record = (
        db.query(AnalysisRecord)
        .filter(AnalysisRecord.id == record_id, AnalysisRecord.user_id == user.id)
        .first()
    )
    if not record:
        raise HTTPException(status_code=404, detail="Analysis record not found")
    return record.results_json


# ═══════════════════════════════════════════════════════════
# GET /api/settings
# ═══════════════════════════════════════════════════════════
@router.get("/settings", response_model=SettingsResponse)
def get_settings(
    user: User = Depends(get_current_user),
):
    """Get the current service settings and configurations."""
    return SettingsResponse(
        hallucination_threshold=settings.HALLUCINATION_THRESHOLD,
        medium_threshold=settings.MEDIUM_THRESHOLD,
        nli_model=settings.NLI_MODEL,
        embedding_model=settings.EMBEDDING_MODEL,
        chunk_size=settings.CHUNK_SIZE,
        chunk_overlap=settings.CHUNK_OVERLAP,
        top_k_results=settings.TOP_K_RESULTS,
        available_models=settings.AVAILABLE_NLI_MODELS,
    )


# ═══════════════════════════════════════════════════════════
# POST /api/settings
# ═══════════════════════════════════════════════════════════
@router.post("/settings", response_model=SettingsResponse)
def update_settings(
    req: SettingsUpdateRequest,
    user: User = Depends(get_current_user),
):
    """Update configurable settings thresholds and retrieval values."""
    if req.hallucination_threshold is not None:
        settings.HALLUCINATION_THRESHOLD = req.hallucination_threshold
    if req.medium_threshold is not None:
        settings.MEDIUM_THRESHOLD = req.medium_threshold
    if req.chunk_size is not None:
        settings.CHUNK_SIZE = req.chunk_size
    if req.chunk_overlap is not None:
        settings.CHUNK_OVERLAP = req.chunk_overlap
    if req.top_k_results is not None:
        settings.TOP_K_RESULTS = req.top_k_results
        
    return SettingsResponse(
        hallucination_threshold=settings.HALLUCINATION_THRESHOLD,
        medium_threshold=settings.MEDIUM_THRESHOLD,
        nli_model=settings.NLI_MODEL,
        embedding_model=settings.EMBEDDING_MODEL,
        chunk_size=settings.CHUNK_SIZE,
        chunk_overlap=settings.CHUNK_OVERLAP,
        top_k_results=settings.TOP_K_RESULTS,
        available_models=settings.AVAILABLE_NLI_MODELS,
    )


# ═══════════════════════════════════════════════════════════
# DELETE /api/settings/reset
# ═══════════════════════════════════════════════════════════
@router.delete("/settings/reset")
def reset_database(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Purge user analysis history and reset FAISS vector indices."""
    try:
        # 1. Clear database entries
        db.query(AnalysisRecord).filter(AnalysisRecord.user_id == user.id).delete()
        db.query(Document).filter(Document.user_id == user.id).delete()
        db.commit()
        
        # 2. Reset RAG FAISS store
        rag = get_rag()
        rag.clear()
        
        return {"status": "success", "message": "History and vectorstore cleared successfully."}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database purge failed: {str(e)}")

