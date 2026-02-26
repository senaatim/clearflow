from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from app.models.asset import AssetType


class AssetCreate(BaseModel):
    symbol: str
    name: str
    asset_type: AssetType
    category: str
    quantity: float
    average_cost: float


class AssetUpdate(BaseModel):
    quantity: Optional[float] = None
    average_cost: Optional[float] = None


class AssetResponse(BaseModel):
    id: str
    portfolio_id: str
    symbol: str
    name: str
    asset_type: AssetType
    category: str
    quantity: float
    average_cost: float
    current_price: Optional[float] = None
    last_price_update: Optional[datetime] = None
    current_value: float
    cost_basis: float
    gain_loss: float
    gain_loss_percentage: float
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
