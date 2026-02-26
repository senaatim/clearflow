import uuid
from datetime import datetime
from sqlalchemy import String, DateTime, Text, ForeignKey, Float, JSON, Enum as SQLEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base
import enum


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


class Recommendation(Base):
    __tablename__ = "recommendations"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    portfolio_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("portfolios.id", ondelete="SET NULL"), nullable=True)

    type: Mapped[RecommendationType] = mapped_column(SQLEnum(RecommendationType), nullable=False)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    details: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    confidence_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    potential_impact: Mapped[float | None] = mapped_column(Float, nullable=True)
    priority: Mapped[RecommendationPriority] = mapped_column(
        SQLEnum(RecommendationPriority),
        default=RecommendationPriority.medium
    )
    status: Mapped[RecommendationStatus] = mapped_column(
        SQLEnum(RecommendationStatus),
        default=RecommendationStatus.pending
    )

    expires_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    acted_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="recommendations")
    trade_requests: Mapped[list["TradeRequest"]] = relationship("TradeRequest", back_populates="recommendation")

    def __repr__(self) -> str:
        return f"<Recommendation {self.type.value}: {self.title}>"
