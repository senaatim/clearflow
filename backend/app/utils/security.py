from datetime import datetime, timedelta
from typing import Optional
import uuid
from jose import JWTError, jwt
import bcrypt
from app.config import settings


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against a hash."""
    return bcrypt.checkpw(
        plain_password.encode("utf-8"),
        hashed_password.encode("utf-8"),
    )


def get_password_hash(password: str) -> str:
    """Hash a password."""
    return bcrypt.hashpw(
        password.encode("utf-8"),
        bcrypt.gensalt(),
    ).decode("utf-8")


_COMMON_PASSWORDS = {
    "password", "password1", "password123", "123456", "12345678", "123456789",
    "qwerty123", "qwerty", "abc123", "letmein", "welcome", "monkey", "dragon",
    "iloveyou", "sunshine", "princess", "football", "admin123", "admin",
    "passw0rd", "P@ssword", "P@ssw0rd", "Welcome1", "Test1234",
}

_SPECIAL_CHARS = set("!@#$%^&*()_+-=[]{}|;':\",./<>?\\`~")


def is_strong_password(password: str) -> tuple[bool, str]:
    """
    Validate password strength. Returns (is_valid, error_message).

    Rules:
    - Minimum 10 characters
    - At least one uppercase letter
    - At least one lowercase letter
    - At least one digit
    - At least one special character
    - Not a known common/weak password
    - No leading or trailing whitespace
    """
    if password != password.strip():
        return False, "Password must not start or end with spaces"
    if len(password) < 10:
        return False, "Password must be at least 10 characters long"
    if len(password) > 128:
        return False, "Password must not exceed 128 characters"
    if not any(c.isupper() for c in password):
        return False, "Password must contain at least one uppercase letter"
    if not any(c.islower() for c in password):
        return False, "Password must contain at least one lowercase letter"
    if not any(c.isdigit() for c in password):
        return False, "Password must contain at least one number"
    if not any(c in _SPECIAL_CHARS for c in password):
        return False, "Password must contain at least one special character (!@#$%^&* etc.)"
    if password.lower() in _COMMON_PASSWORDS:
        return False, "This password is too common. Please choose a more unique password"
    return True, ""


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create a JWT access token. Only embeds user ID — role is always fetched from DB."""
    # Strip everything except sub; add a unique jti for blacklisting
    to_encode = {
        "sub": data["sub"],
        "jti": str(uuid.uuid4()),
        "type": "access",
    }
    expire = datetime.utcnow() + (
        expires_delta if expires_delta
        else timedelta(minutes=settings.access_token_expire_minutes)
    )
    to_encode["exp"] = expire
    return jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)


def create_refresh_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create a JWT refresh token."""
    to_encode = {
        "sub": data["sub"],
        "jti": str(uuid.uuid4()),
        "type": "refresh",
    }
    expire = datetime.utcnow() + (
        expires_delta if expires_delta
        else timedelta(days=settings.refresh_token_expire_days)
    )
    to_encode["exp"] = expire
    return jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)


def decode_token(token: str) -> Optional[dict]:
    """Decode and verify a JWT token."""
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        return payload
    except JWTError:
        return None


def verify_access_token(token: str) -> Optional[str]:
    """Verify an access token and return the user ID."""
    payload = decode_token(token)
    if payload is None:
        return None
    if payload.get("type") != "access":
        return None
    return payload.get("sub")


def verify_refresh_token(token: str) -> Optional[str]:
    """Verify a refresh token and return the user ID."""
    payload = decode_token(token)
    if payload is None:
        return None
    if payload.get("type") != "refresh":
        return None
    return payload.get("sub")
