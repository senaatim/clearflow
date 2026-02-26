from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from app.models.portfolio import PortfolioType


class PortfolioCreate(BaseModel):
    name: str
    type: PortfolioType = PortfolioType.investment
    description: Optional[str] = None
    currency: str = "USD"


class PortfolioUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    target_allocation: Optional[dict] = None
    auto_rebalance: Optional[bool] = None
    rebalance_threshold: Optional[float] = None


class PortfolioResponse(BaseModel):
    id: str
    user_id: str
    name: str
    description: Optional[str] = None
    type: PortfolioType
    currency: str
    target_allocation: Optional[dict] = None
    auto_rebalance: bool
    rebalance_threshold: float
    created_at: datetime
    updated_at: datetime

    # Computed fields
    total_value: Optional[float] = None
    total_return: Optional[float] = None
    return_percentage: Optional[float] = None

    class Config:
        from_attributes = True


class AssetSummary(BaseModel):
    id: str
    symbol: str
    name: str
    asset_type: str
    category: str
    quantity: float
    average_cost: float
    current_price: Optional[float] = None
    current_value: float
    gain_loss: float
    gain_loss_percentage: float

    class Config:
        from_attributes = True


class PortfolioWithAssets(PortfolioResponse):
    assets: list[AssetSummary] = []


class AllocationItem(BaseModel):
    name: str
    type: str
    percentage: float
    value: float
    color: str


class PerformanceData(BaseModel):
    date: str
    value: float
    benchmark: Optional[float] = None
