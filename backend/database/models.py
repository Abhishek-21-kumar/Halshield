"""
HalShield — SQLite database models.
Defines User, AnalysisRecord, and Document tables.
"""
import datetime
from sqlalchemy import (
    create_engine, Column, Integer, String, Float,
    Text, DateTime, JSON, ForeignKey, Boolean,
)
from sqlalchemy.orm import declarative_base, sessionmaker, relationship
from config import settings

# Handle dialect prefix & connect args for PostgreSQL vs SQLite
db_url = settings.DATABASE_URL
if db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql://", 1)

connect_args = {"check_same_thread": False} if db_url.startswith("sqlite") else {}

engine = create_engine(
    db_url,
    connect_args=connect_args,
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class User(Base):
    """Registered user account."""
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    name = Column(String(255), nullable=False, default="User")
    hashed_password = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    analyses = relationship("AnalysisRecord", back_populates="user")
    documents = relationship("Document", back_populates="user")


class AnalysisRecord(Base):
    """Single hallucination analysis run."""
    __tablename__ = "analysis_history"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    question = Column(Text, nullable=False)
    answer = Column(Text, nullable=False)
    model_used = Column(String(50), default="GPT")
    overall_score = Column(Float, default=0.0)
    risk_level = Column(String(20), default="low")
    detection_mode = Column(String(50), default="combined")
    num_claims = Column(Integer, default=0)
    num_hallucinated = Column(Integer, default=0)
    num_supported = Column(Integer, default=0)
    num_uncertain = Column(Integer, default=0)
    results_json = Column(JSON, nullable=True)
    corrected_answer = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="analyses")


class Document(Base):
    """Uploaded document for RAG retrieval."""
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    filename = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_size = Column(Integer, default=0)
    chunk_count = Column(Integer, default=0)
    status = Column(String(20), default="processed")  # processing, processed, error
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="documents")


def init_db():
    """Create all tables."""
    Base.metadata.create_all(bind=engine)


def get_db():
    """Yield a database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
