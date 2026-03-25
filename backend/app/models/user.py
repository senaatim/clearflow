import uuid
import enum
from datetime import datetime
from typing import Optional
from beanie import Document, Indexed
from pydantic import Field
from pymongo import IndexModel, ASCENDING


class UserRole(str, enum.Enum):
    user = "user"
    broker = "broker"
    admin = "admin"


class KYCStatus(str, enum.Enum):
    pending = "pending"
    verified = "verified"
    rejected = "rejected"


class AccountStatus(str, enum.Enum):
    pending_review = "pending_review"
    approved = "approved"
    rejected = "rejected"


class RiskTolerance(str, enum.Enum):
    conservative = "conservative"
    moderate = "moderate"
    aggressive = "aggressive"


class User(Document):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: str
    password_hash: str
    first_name: str
    last_name: str
    phone: Optional[str] = None
    avatar_url: Optional[str] = None
    risk_tolerance: RiskTolerance = RiskTolerance.moderate
    investment_goal: Optional[str] = None

    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    last_login: Optional[datetime] = None

    # KYC fields — stored as HMAC-SHA256 hashes, never as plaintext
    nin_hash: Optional[str] = None
    bvn_hash: Optional[str] = None
    kyc_status: KYCStatus = KYCStatus.pending

    account_status: AccountStatus = AccountStatus.pending_review
    is_active: bool = False
    is_verified: bool = False
    role: UserRole = UserRole.user

    class Settings:
        name = "users"
        indexes = [
            IndexModel([("email", ASCENDING)], unique=True),
            IndexModel([("id", ASCENDING)], unique=True),
            IndexModel([("nin_hash", ASCENDING)], unique=True, sparse=True),
            IndexModel([("bvn_hash", ASCENDING)], unique=True, sparse=True),
        ]

    def __repr__(self) -> str:
        return f"<User {self.email}>"
