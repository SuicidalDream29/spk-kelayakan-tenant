from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import OAuth2PasswordRequestForm
from jose import jwt
import bcrypt
from pydantic import BaseModel
from ..config import settings
from ..deps import get_current_user

router = APIRouter()

class Token(BaseModel):
    access_token: str
    token_type: str

def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode(), hashed.encode())

def hash_password(plain: str) -> str:
    return bcrypt.hashpw(plain.encode(), bcrypt.gensalt()).decode()

def create_token(username: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(hours=settings.token_expire_hours)
    return jwt.encode(
        {"sub": username, "exp": expire},
        settings.secret_key,
        algorithm="HS256"
    )

@router.post("/login", response_model=Token)
def login(form: OAuth2PasswordRequestForm = Depends()):
    if form.username != settings.admin_username:
        raise HTTPException(status_code=401, detail="Username atau password salah")
    if not verify_password(form.password, settings.admin_password_hash):
        raise HTTPException(status_code=401, detail="Username atau password salah")
    return {"access_token": create_token(form.username), "token_type": "bearer"}

@router.get("/me")
def me(username: str = Depends(get_current_user)):
    return {"username": username}
