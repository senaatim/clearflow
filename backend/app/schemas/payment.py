from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from app.models.payment import PaymentStatus, PaymentMethod


class PaymentIntentCreate(BaseModel):
    tier: str
    billing_period: str = "monthly"  # "monthly" or "yearly"


class PaymentIntentResponse(BaseModel):
    client_secret: str
    payment_intent_id: str
    amount: float
    currency: str


class PaymentConfirm(BaseModel):
    payment_intent_id: str


class PaymentResponse(BaseModel):
    id: str
    user_id: str
    subscription_id: str
    amount: float
    currency: str
    payment_method: PaymentMethod
    status: PaymentStatus
    description: Optional[str] = None
    created_at: datetime
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class PaymentHistoryResponse(BaseModel):
    payments: list[PaymentResponse]
    total_count: int
    total_amount: float
