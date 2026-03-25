import uuid
import enum
from datetime import datetime
from typing import Optional
from beanie import Document
from pydantic import Field
from pymongo import IndexModel, ASCENDING


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


class TradeRequest(Document):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    recommendation_id: Optional[str] = None
    portfolio_id: str

    action: TradeAction
    symbol: str
    company_name: Optional[str] = None
    quantity: float
    order_type: OrderType = OrderType.market
    limit_price: Optional[float] = None
    estimated_price: Optional[float] = None
    estimated_total: Optional[float] = None

    risk_level: Optional[RiskLevel] = None
    growth_outlook: Optional[GrowthOutlook] = None
    ai_reasoning: Optional[str] = None

    status: TradeRequestStatus = TradeRequestStatus.pending
    broker_notes: Optional[str] = None

    executed_price: Optional[float] = None
    executed_quantity: Optional[float] = None
    execution_fees: Optional[float] = None
    executed_at: Optional[datetime] = None

    user_notes: Optional[str] = None

    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "trade_requests"
        indexes = [
            IndexModel([("id", ASCENDING)], unique=True),
            IndexModel([("user_id", ASCENDING)]),
        ]

    def __repr__(self) -> str:
        return f"<TradeRequest {self.action.value} {self.quantity} {self.symbol} - {self.status.value}>"
