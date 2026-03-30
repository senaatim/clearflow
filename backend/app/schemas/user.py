import re
from pydantic import BaseModel, EmailStr, field_validator, model_validator
from datetime import datetime
from typing import Optional
from app.models.user import AccountStatus, KYCStatus, RiskTolerance

# Allowed characters in name fields: letters, spaces, hyphens, apostrophes
_NAME_PATTERN = re.compile(r"^[A-Za-z\s'\-]{2,50}$")
# Basic E.164-style phone: optional + then 7–15 digits
_PHONE_PATTERN = re.compile(r"^\+?[0-9]{7,15}$")
# Simple HTML tag detector for injection prevention
_HTML_PATTERN = re.compile(r"<[^>]+>")
# NIN and BVN: exactly 11 digits
_KYC_ID_PATTERN = re.compile(r"^\d{11}$")


def _sanitize_name(value: str, field: str) -> str:
    value = value.strip()
    if _HTML_PATTERN.search(value):
        raise ValueError(f"{field} must not contain HTML or script tags")
    if not _NAME_PATTERN.match(value):
        raise ValueError(
            f"{field} must be 2–50 characters and contain only letters, "
            "spaces, hyphens, or apostrophes"
        )
    return value


class UserCreate(BaseModel):
    email: EmailStr
    password: str
    first_name: str
    last_name: str
    nin: str

    @field_validator("email", mode="before")
    @classmethod
    def normalize_email(cls, v: str) -> str:
        return v.strip().lower()

    @field_validator("first_name", mode="before")
    @classmethod
    def validate_first_name(cls, v: str) -> str:
        return _sanitize_name(v, "First name")

    @field_validator("last_name", mode="before")
    @classmethod
    def validate_last_name(cls, v: str) -> str:
        return _sanitize_name(v, "Last name")

    @field_validator("nin", mode="before")
    @classmethod
    def validate_nin(cls, v: str) -> str:
        v = v.strip()
        if not _KYC_ID_PATTERN.match(v):
            raise ValueError("NIN must be exactly 11 digits")
        return v

    @field_validator("password", mode="before")
    @classmethod
    def validate_password_field(cls, v: str) -> str:
        # Import here to avoid circular import at module level
        from app.utils.security import is_strong_password
        valid, msg = is_strong_password(v)
        if not valid:
            raise ValueError(msg)
        return v


class UserLogin(BaseModel):
    email: EmailStr
    password: str

    @field_validator("email", mode="before")
    @classmethod
    def normalize_email(cls, v: str) -> str:
        return v.strip().lower()


class UserUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    avatar_url: Optional[str] = None
    risk_tolerance: Optional[RiskTolerance] = None
    investment_goal: Optional[str] = None

    @field_validator("first_name", mode="before")
    @classmethod
    def validate_first_name(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        return _sanitize_name(v, "First name")

    @field_validator("last_name", mode="before")
    @classmethod
    def validate_last_name(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        return _sanitize_name(v, "Last name")

    @field_validator("phone", mode="before")
    @classmethod
    def validate_phone(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        v = v.strip()
        if not _PHONE_PATTERN.match(v):
            raise ValueError("Phone must be 7–15 digits, optionally starting with +")
        return v

    @field_validator("investment_goal", mode="before")
    @classmethod
    def sanitize_investment_goal(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        v = v.strip()
        if _HTML_PATTERN.search(v):
            raise ValueError("Investment goal must not contain HTML or script tags")
        if len(v) > 500:
            raise ValueError("Investment goal must not exceed 500 characters")
        return v


class UserResponse(BaseModel):
    id: str
    email: str
    first_name: str
    last_name: str
    phone: Optional[str] = None
    avatar_url: Optional[str] = None
    risk_tolerance: RiskTolerance
    investment_goal: Optional[str] = None
    created_at: datetime
    is_verified: bool
    kyc_status: KYCStatus = KYCStatus.pending
    account_status: AccountStatus = AccountStatus.pending_review
    role: str = "user"

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    user: UserResponse
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class TokenRefresh(BaseModel):
    refresh_token: str


class PasswordChange(BaseModel):
    current_password: str
    new_password: str

    @field_validator("new_password", mode="before")
    @classmethod
    def validate_new_password(cls, v: str) -> str:
        from app.utils.security import is_strong_password
        valid, msg = is_strong_password(v)
        if not valid:
            raise ValueError(msg)
        return v
