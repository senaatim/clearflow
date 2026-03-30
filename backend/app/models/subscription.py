import uuid
import enum
from datetime import datetime
from typing import Optional
from beanie import Document
from pydantic import Field
from pymongo import IndexModel, ASCENDING


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


class Subscription(Document):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str

    tier: SubscriptionTier = SubscriptionTier.basic
    status: SubscriptionStatus = SubscriptionStatus.pending

    stripe_customer_id: Optional[str] = None
    stripe_subscription_id: Optional[str] = None

    current_period_start: datetime = Field(default_factory=datetime.utcnow)
    current_period_end: datetime

    canceled_at: Optional[datetime] = None
    cancel_at_period_end: bool = False

    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "subscriptions"
        indexes = [
            IndexModel([("user_id", ASCENDING)], unique=True),
        ]

    def __repr__(self) -> str:
        return f"<Subscription {self.tier.value} - {self.status.value}>"

    @property
    def is_active(self) -> bool:
        return self.status == SubscriptionStatus.active and datetime.utcnow() < self.current_period_end


TIER_FEATURES = {
    SubscriptionTier.basic: [
        "news_feed",
        "basic_screener",
        "health_cards",
    ],
    SubscriptionTier.pro: [
        "news_feed",
        "basic_screener",
        "health_cards",
        "full_screener",
        "portfolio_tracking",
        "basic_recommendations",
        "basic_analytics",
        "market_summaries",
        "portfolio_builder",
        "behaviour_tools",
        "earnings_decoder",
        "ngx_module",
    ],
    SubscriptionTier.premium: [
        "news_feed",
        "basic_screener",
        "health_cards",
        "full_screener",
        "portfolio_tracking",
        "basic_recommendations",
        "basic_analytics",
        "market_summaries",
        "portfolio_builder",
        "behaviour_tools",
        "earnings_decoder",
        "ngx_module",
        "dcf_models",
        "macro_dashboard",
        "full_portfolio_analytics",
        "priority_alerts",
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

# Prices stored in kobo (1 NGN = 100 kobo)
TIER_PRICING = {
    SubscriptionTier.basic: {
        "monthly": 0,
        "yearly": 0,
        "name": "Free",
        "description": "News feed, basic screener & Company Health Cards to get you started",
    },
    SubscriptionTier.pro: {
        "monthly": 1000000,   # ₦10,000
        "yearly": 9600000,    # ₦96,000 (20% off)
        "name": "ClearFlow Pro",
        "description": "Full screener, Portfolio Builder, Earnings Decoder & NGX module",
    },
    SubscriptionTier.premium: {
        "monthly": 2000000,   # ₦20,000
        "yearly": 19200000,   # ₦192,000 (20% off)
        "name": "ClearFlow Premium",
        "description": "DCF models, Macro Dashboard, full Portfolio Analytics & priority alerts",
    },
}


def tier_has_feature(tier: SubscriptionTier, feature: str) -> bool:
    return feature in TIER_FEATURES.get(tier, [])
