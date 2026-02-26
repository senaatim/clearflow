import uuid
from datetime import datetime
from sqlalchemy import String, DateTime, Float, ForeignKey, Text, Enum as SQLEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base
import enum


class TradeAction(str, enum.Enum):
    buy = "buy"
    sell = "sell"
    rebalance = "rebalance"


class OrderType(str, enum.Enum):
    market = "market"
    limit = "limit"


class TradeRequestStatus(str, enum.Enum):
    pending = "pending"
    confirmed = "confirmed"
    executed = "executed"
    rejected = "rejected"
    canceled = "canceled"


class RiskLevel(str, enum.Enum):
    low = "low"
    medium = "medium"
    high = "high"


class GrowthOutlook(str, enum.Enum):
    short_term = "short_term"
    long_term = "long_term"


class TradeRequest(Base):
    __tablename__ = "trade_requests"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    recommendation_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("recommendations.id", ondelete="SET NULL"), nullable=True)
    portfolio_id: Mapped[str] = mapped_column(String(36), ForeignKey("portfolios.id", ondelete="CASCADE"), nullable=False)

    # Trade details
    action: Mapped[TradeAction] = mapped_column(SQLEnum(TradeAction), nullable=False)
    symbol: Mapped[str] = mapped_column(String(20), nullable=False)
    company_name: Mapped[str | None] = mapped_column(String(200), nullable=True)
    quantity: Mapped[float] = mapped_column(Float, nullable=False)
    order_type: Mapped[OrderType] = mapped_column(SQLEnum(OrderType), default=OrderType.market)
    limit_price: Mapped[float | None] = mapped_column(Float, nullable=True)
    estimated_price: Mapped[float | None] = mapped_column(Float, nullable=True)
    estimated_total: Mapped[float | None] = mapped_column(Float, nullable=True)

    # Risk and analysis
    risk_level: Mapped[RiskLevel | None] = mapped_column(SQLEnum(RiskLevel), nullable=True)
    growth_outlook: Mapped[GrowthOutlook | None] = mapped_column(SQLEnum(GrowthOutlook), nullable=True)
    ai_reasoning: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Status tracking
    status: Mapped[TradeRequestStatus] = mapped_column(SQLEnum(TradeRequestStatus), default=TradeRequestStatus.pending)
    broker_notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Execution details
    executed_price: Mapped[float | None] = mapped_column(Float, nullable=True)
    executed_quantity: Mapped[float | None] = mapped_column(Float, nullable=True)
    execution_fees: Mapped[float | None] = mapped_column(Float, nullable=True)
    executed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    # User notes
    user_notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="trade_requests")
    recommendation: Mapped["Recommendation"] = relationship("Recommendation", back_populates="trade_requests")
    portfolio: Mapped["Portfolio"] = relationship("Portfolio", back_populates="trade_requests")

    def __repr__(self) -> str:
        return f"<TradeRequest {self.action.value} {self.quantity} {self.symbol} - {self.status.value}>"
