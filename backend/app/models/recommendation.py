import uuid
import enum
from datetime import datetime
from typing import Optional
from beanie import Document
from pydantic import Field
from pymongo import IndexModel, ASCENDING


class RecommendationType(str, enum.Enum):
    rebalance = "rebalance"
    buy = "buy"
    sell = "sell"
    tax_harvest = "tax_harvest"
    risk_alert = "risk_alert"
    opportunity = "opportunity"


class RecommendationPriority(str, enum.Enum):
    low = "low"
    medium = "medium"
    high = "high"
    critical = "critical"


class RecommendationStatus(str, enum.Enum):
    pending = "pending"
    viewed = "viewed"
    accepted = "accepted"
    dismissed = "dismissed"


class Recommendation(Document):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    portfolio_id: Optional[str] = None

    type: RecommendationType
    title: str
    description: str
    details: Optional[dict] = None

    confidence_score: Optional[float] = None
    potential_impact: Optional[float] = None
    priority: RecommendationPriority = RecommendationPriority.medium
    status: RecommendationStatus = RecommendationStatus.pending

    expires_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    acted_at: Optional[datetime] = None

    class Settings:
        name = "recommendations"
        indexes = [
            IndexModel([("user_id", ASCENDING)]),
        ]

    def __repr__(self) -> str:
        return f"<Recommendation {self.type.value}: {self.title}>"
