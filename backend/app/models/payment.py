import uuid
import enum
from datetime import datetime
from typing import Optional
from beanie import Document
from pydantic import Field
from pymongo import IndexModel, ASCENDING


class PaymentStatus(str, enum.Enum):
    pending = "pending"
    completed = "completed"
    failed = "failed"
    refunded = "refunded"


class PaymentMethod(str, enum.Enum):
    card = "card"
    bank_transfer = "bank_transfer"
    mobile_money = "mobile_money"


class Payment(Document):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    subscription_id: str

    amount: float
    currency: str = "USD"
    payment_method: PaymentMethod = PaymentMethod.card
    status: PaymentStatus = PaymentStatus.pending

    description: Optional[str] = None

    stripe_payment_intent_id: Optional[str] = None
    stripe_charge_id: Optional[str] = None

    created_at: datetime = Field(default_factory=datetime.utcnow)
    completed_at: Optional[datetime] = None

    class Settings:
        name = "payments"
        indexes = [
            IndexModel([("user_id", ASCENDING)]),
        ]

    def __repr__(self) -> str:
        return f"<Payment {self.amount} {self.currency} - {self.status.value}>"
