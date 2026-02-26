from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from app.models.subscription import SubscriptionTier, SubscriptionStatus


class SubscriptionCreate(BaseModel):
    tier: SubscriptionTier
    billing_period: str = "monthly"  # "monthly" or "yearly"


class SubscriptionUpgrade(BaseModel):
    tier: SubscriptionTier


class SubscriptionResponse(BaseModel):
    id: str
    user_id: str
    tier: SubscriptionTier
    status: SubscriptionStatus
    current_period_start: datetime
    current_period_end: datetime
    canceled_at: Optional[datetime] = None
    cancel_at_period_end: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class SubscriptionWithFeatures(SubscriptionResponse):
    features: list[str]
    tier_name: str
    can_upgrade: bool
    can_downgrade: bool


class TierFeature(BaseModel):
    name: str
    description: str
    included: bool


class TierInfo(BaseModel):
    tier: SubscriptionTier
    name: str
    description: str
    monthly_price: float  # In dollars
    yearly_price: float  # In dollars
    features: list[TierFeature]
    popular: bool = False


class TiersResponse(BaseModel):
    tiers: list[TierInfo]


class SubscriptionInvoice(BaseModel):
    id: str
    amount: float
    currency: str
    status: str
    description: str
    created_at: datetime


class InvoicesResponse(BaseModel):
    invoices: list[SubscriptionInvoice]
    total_count: int
