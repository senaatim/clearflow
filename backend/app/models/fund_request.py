import uuid
import enum
from datetime import datetime
from typing import Optional
from beanie import Document
from pydantic import Field
from pymongo import IndexModel, ASCENDING


class FundingMethod(str, enum.Enum):
    bank = "bank"
    card = "card"
    mobile_money = "mobile_money"


class FundRequestStatus(str, enum.Enum):
    pending = "pending"
    approved = "approved"
    rejected = "rejected"
    canceled = "canceled"


class FundRequest(Document):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str

    amount: float
    method: FundingMethod
    status: FundRequestStatus = FundRequestStatus.pending

    user_notes: Optional[str] = None
    admin_notes: Optional[str] = None
    reviewed_by: Optional[str] = None

    created_at: datetime = Field(default_factory=datetime.utcnow)
    reviewed_at: Optional[datetime] = None

    class Settings:
        name = "fund_requests"
        indexes = [
            IndexModel([("id", ASCENDING)], unique=True),
            IndexModel([("user_id", ASCENDING)]),
        ]

    def __repr__(self) -> str:
        return f"<FundRequest {self.amount} - {self.status.value}>"
