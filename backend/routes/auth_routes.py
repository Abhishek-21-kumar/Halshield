"""
HalShield — Authentication routes.
POST /register  — create a new user account
POST /login     — authenticate and return a JWT
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database.models import get_db, User
from auth.password import hash_password, verify_password
from auth.jwt_handler import create_access_token
from models.schemas import RegisterRequest, LoginRequest, AuthResponse

router = APIRouter(prefix="/api", tags=["Authentication"])


@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
def register(req: RegisterRequest, db: Session = Depends(get_db)):
    """Register a new user account."""
    # Check if email already exists
    existing = db.query(User).filter(User.email == req.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists",
        )

    # Create user
    user = User(
        email=req.email,
        name=req.name,
        hashed_password=hash_password(req.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Generate token
    token = create_access_token({"user_id": user.id, "email": user.email})

    return AuthResponse(
        access_token=token,
        user_id=user.id,
        email=user.email,
        name=user.name,
    )


@router.post("/login", response_model=AuthResponse)
def login(req: LoginRequest, db: Session = Depends(get_db)):
    """Authenticate user and return JWT token."""
    user = db.query(User).filter(User.email == req.email).first()
    if not user or not verify_password(req.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    token = create_access_token({"user_id": user.id, "email": user.email})

    return AuthResponse(
        access_token=token,
        user_id=user.id,
        email=user.email,
        name=user.name,
    )
