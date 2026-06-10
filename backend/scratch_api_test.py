import sys
import os

# Add the current directory to sys.path
sys.path.append(os.path.abspath(os.path.dirname(__file__)))

from fastapi.testclient import TestClient
from main import app
from database.models import SessionLocal, User

client = TestClient(app)

# Helper to get user and token
db = SessionLocal()
user = db.query(User).first()
if not user:
    print("No user found in DB. Creating a test user...")
    from auth.jwt_handler import get_password_hash
    user = User(email="test@example.com", name="Test User", hashed_password=get_password_hash("password"))
    db.add(user)
    db.commit()
    db.refresh(user)

from auth.jwt_handler import create_access_token
token = create_access_token({"user_id": user.id})
headers = {"Authorization": f"Bearer {token}"}

try:
    print("Sending POST request to /api/analyze...")
    response = client.post(
        "/api/analyze",
        headers=headers,
        json={
            "question": "What is the capital of France?",
            "answer": "The capital of France is Rome.",
            "model": "GPT",
            "document_id": None
        }
    )
    print("Response Status Code:", response.status_code)
    print("Response JSON:", response.json() if response.status_code == 200 else response.text)
except Exception as e:
    import traceback
    traceback.print_exc()
finally:
    db.close()
