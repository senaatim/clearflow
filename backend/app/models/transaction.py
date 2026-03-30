import uuid
import enum
from datetime import datetime
from typing import Optional
from beanie import Document
from pydantic import Field
from pymongo import IndexModel, ASCENDING


class TransactionType(str, enum.Enum):
    buy = "buy"
    sell = "sell"
    dividend = "dividend"
    deposit = "deposit"
    withdrawal = "withdrawal"


class Transaction(Document):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    portfolio_id: str
    asset_id: Optional[str] = None

    type: TransactionType
    symbol: Optional[str] = None
    quantity: Optional[float] = None
    price: Optional[float] = None
    total_amount: float
    fees: float = 0
    notes: Optional[str] = None

    executed_at: datetime
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "transactions"
        indexes = [
            IndexModel([("portfolio_id", ASCENDING)]),
        ]

    def __repr__(self) -> str:
        return f"<Transaction {self.type.value} {self.total_amount}>"
