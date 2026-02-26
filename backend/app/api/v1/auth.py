from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime
from collections import defaultdict
from time import time

from app.database import get_db
from app.models.user import User
from app.schemas.user import UserCreate, UserLogin, UserResponse, TokenResponse, TokenRefresh
from app.utils.security import (
    get_password_hash,
    verify_password,
    is_strong_password,
    create_access_token,
    create_refresh_token,
    verify_refresh_token,
    decode_token,
)
from app.api.deps import get_current_user, blacklist_token

router = APIRouter()
_bearer = HTTPBearer()

# ── Brute-force protection ────────────────────────────────────────────────────
# Maps IP → list of attempt timestamps (rolling window)
_login_attempts: dict[str, list[float]] = defaultdict(list)
_MAX_LOGIN_ATTEMPTS = 5
_LOGIN_WINDOW_SECONDS = 60

# Stricter limits for registration to prevent mass account creation
_register_attempts: dict[str, list[float]] = defaultdict(list)
_MAX_REGISTER_ATTEMPTS = 3
_REGISTER_WINDOW_SECONDS = 900  # 15 minutes


def _check_login_rate_limit(ip: str) -> None:
    now = time()
    attempts = _login_attempts[ip]
    # Purge attempts outside the rolling window
    _login_attempts[ip] = [t for t in attempts if now - t < _LOGIN_WINDOW_SECONDS]
    if len(_login_attempts[ip]) >= _MAX_LOGIN_ATTEMPTS:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many login attempts. Please wait 60 seconds and try again.",
        )
    _login_attempts[ip].append(now)


def _check_register_rate_limit(ip: str) -> None:
    now = time()
    attempts = _register_attempts[ip]
    # Purge attempts outside the rolling window
    _register_attempts[ip] = [t for t in attempts if now - t < _REGISTER_WINDOW_SECONDS]
    if len(_register_attempts[ip]) >= _MAX_REGISTER_ATTEMPTS:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many registration attempts. Please wait 15 minutes and try again.",
        )
    _register_attempts[ip].append(now)


# ── Routes ────────────────────────────────────────────────────────────────────

@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserCreate, request: Request, db: AsyncSession = Depends(get_db)):
    """Register a new user."""
    # Rate limit registration by IP (stricter than login)
    client_ip = request.client.host if request.client else "unknown"
    _check_register_rate_limit(client_ip)

    # Enforce password strength
    valid, error_msg = is_strong_password(user_data.password)
    if not valid:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=error_msg)

    # Check if email already exists
    result = await db.execute(select(User).where(User.email == user_data.email))
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    user = User(
        email=user_data.email,
        password_hash=get_password_hash(user_data.password),
        first_name=user_data.first_name,
        last_name=user_data.last_name,
    )

    db.add(user)
    await db.commit()
    await db.refresh(user)

    access_token = create_access_token(data={"sub": user.id})
    refresh_token = create_refresh_token(data={"sub": user.id})

    return TokenResponse(
        user=UserResponse.model_validate(user),
        access_token=access_token,
        refresh_token=refresh_token,
    )


@router.post("/login", response_model=TokenResponse)
async def login(credentials: UserLogin, request: Request, db: AsyncSession = Depends(get_db)):
    """Authenticate a user and return tokens."""
    client_ip = request.client.host if request.client else "unknown"
    _check_login_rate_limit(client_ip)

    result = await db.execute(select(User).where(User.email == credentials.email))
    user = result.scalar_one_or_none()

    # Intentionally identical error for wrong email or wrong password (prevents enumeration)
    if not user or not verify_password(credentials.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is disabled. Contact support.",
        )

    user.last_login = datetime.utcnow()
    await db.commit()

    access_token = create_access_token(data={"sub": user.id})
    refresh_token = create_refresh_token(data={"sub": user.id})

    return TokenResponse(
        user=UserResponse.model_validate(user),
        access_token=access_token,
        refresh_token=refresh_token,
    )


@router.post("/refresh")
async def refresh_token(token_data: TokenRefresh, db: AsyncSession = Depends(get_db)):
    """Issue a new access token using a valid refresh token."""
    user_id = verify_refresh_token(token_data.refresh_token)

    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token",
        )

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive",
        )

    access_token = create_access_token(data={"sub": user.id})
    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    """Get the currently authenticated user."""
    return UserResponse.model_validate(current_user)


@router.post("/logout")
async def logout(
    credentials: HTTPAuthorizationCredentials = Depends(_bearer),
    current_user: User = Depends(get_current_user),
):
    """
    Logout the current user by blacklisting their access token.
    The token cannot be used again even before its natural expiry.
    """
    payload = decode_token(credentials.credentials)
    jti = payload.get("jti") if payload else None
    if jti:
        blacklist_token(jti)
    return {"success": True, "message": "Logged out successfully"}
