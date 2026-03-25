import uuid
import enum
from datetime import datetime
from typing import Optional
from beanie import Document
from pydantic import Field
from pymongo import IndexModel, ASCENDING


class AssetType(str, enum.Enum):
    stock = "stock"
    etf = "etf"
    bond = "bond"
    crypto = "crypto"
    reit = "reit"


class Asset(Document):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    portfolio_id: str

    symbol: str
    name: str
    asset_type: AssetType
    category: str

    quantity: float
    average_cost: float
    current_price: Optional[float] = None
    last_price_update: Optional[datetime] = None

    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "assets"
        indexes = [
            IndexModel([("id", ASCENDING)], unique=True),
            IndexModel([("portfolio_id", ASCENDING)]),
        ]

    @property
    def current_value(self) -> float:
        if self.current_price:
            return self.quantity * self.current_price
        return self.quantity * self.average_cost

    @property
    def cost_basis(self) -> float:
        return self.quantity * self.average_cost

    @property
    def gain_loss(self) -> float:
        return self.current_value - self.cost_basis

    @property
    def gain_loss_percentage(self) -> float:
        if self.cost_basis == 0:
            return 0
        return (self.gain_loss / self.cost_basis) * 100

    def __repr__(self) -> str:
        return f"<Asset {self.symbol}>"
