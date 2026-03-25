import uuid
import enum
from datetime import datetime
from typing import Optional
from beanie import Document
from pydantic import Field
from pymongo import IndexModel, ASCENDING


class PortfolioType(str, enum.Enum):
    investment = "investment"
    retirement = "retirement"
    savings = "savings"


class Portfolio(Document):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str

    name: str
    description: Optional[str] = None
    type: PortfolioType = PortfolioType.investment
    currency: str = "USD"

    target_allocation: Optional[dict] = None
    auto_rebalance: bool = False
    rebalance_threshold: float = 5.0

    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "portfolios"
        indexes = [
            IndexModel([("id", ASCENDING)], unique=True),
            IndexModel([("user_id", ASCENDING)]),
        ]

    def __repr__(self) -> str:
        return f"<Portfolio {self.name}>"
