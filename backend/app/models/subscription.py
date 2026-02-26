import uuid
from datetime import datetime
from sqlalchemy import String, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base
import enum


class SubscriptionTier(str, enum.Enum):
    basic = "basic"
    pro = "pro"
    premium = "premium"


class SubscriptionStatus(str, enum.Enum):
    active = "active"
    canceled = "canceled"
    expired = "expired"
    trial = "trial"
    pending = "pending"


class Subscription(Base):
    __tablename__ = "subscriptions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)

    tier: Mapped[SubscriptionTier] = mapped_column(SQLEnum(SubscriptionTier), nullable=False, default=SubscriptionTier.basic)
    status: Mapped[SubscriptionStatus] = mapped_column(SQLEnum(SubscriptionStatus), nullable=False, default=SubscriptionStatus.pending)

    # Mock Stripe fields (for future integration)
    stripe_customer_id: Mapped[str | None] = mapped_column(String(100), nullable=True)
    stripe_subscription_id: Mapped[str | None] = mapped_column(String(100), nullable=True)

    # Billing period
    current_period_start: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)
    current_period_end: Mapped[datetime] = mapped_column(DateTime, nullable=False)

    # Cancellation
    canceled_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    cancel_at_period_end: Mapped[bool] = mapped_column(default=False)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="subscription")
    payments: Mapped[list["Payment"]] = relationship("Payment", back_populates="subscription", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<Subscription {self.tier.value} - {self.status.value}>"

    @property
    def is_active(self) -> bool:
        return self.status == SubscriptionStatus.active and datetime.utcnow() < self.current_period_end


# Tier feature definitions
TIER_FEATURES = {
    SubscriptionTier.basic: [
        "portfolio_tracking",
        "basic_recommendations",
        "basic_analytics",
        "market_summaries",
    ],
    SubscriptionTier.pro: [
        "portfolio_tracking",
        "basic_recommendations",
        "basic_analytics",
        "market_summaries",
        "advanced_analytics",
        "tax_optimization",
        "downloadable_reports",
        "weekly_digest",
    ],
    SubscriptionTier.premium: [
        "portfolio_tracking",
        "basic_recommendations",
        "basic_analytics",
        "market_summaries",
        "advanced_analytics",
        "tax_optimization",
        "downloadable_reports",
        "weekly_digest",
        "broker_execution",
        "robo_advisor",
        "api_access",
        "priority_support",
    ],
}


# Tier pricing (in cents for accuracy)
TIER_PRICING = {
    SubscriptionTier.basic: {
        "monthly": 999,  # $9.99
        "yearly": 9900,  # $99.00
        "name": "Basic",
        "description": "Essential tools for getting started with smart investing",
    },
    SubscriptionTier.pro: {
        "monthly": 2999,  # $29.99
        "yearly": 29900,  # $299.00
        "name": "Pro",
        "description": "Advanced analytics and tax optimization for serious investors",
    },
    SubscriptionTier.premium: {
        "monthly": 7999,  # $79.99
        "yearly": 79900,  # $799.00
        "name": "Premium",
        "description": "Full-service investment intelligence with broker execution",
    },
}


def tier_has_feature(tier: SubscriptionTier, feature: str) -> bool:
    """Check if a subscription tier has access to a specific feature."""
    return feature in TIER_FEATURES.get(tier, [])
