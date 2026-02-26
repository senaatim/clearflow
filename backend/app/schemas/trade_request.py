from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from app.models.trade_request import TradeAction, OrderType, TradeRequestStatus, RiskLevel, GrowthOutlook


class TradeRequestCreate(BaseModel):
    portfolio_id: str
    recommendation_id: Optional[str] = None
    action: TradeAction
    symbol: str
    company_name: Optional[str] = None
    quantity: float
    order_type: OrderType = OrderType.market
    limit_price: Optional[float] = None
    estimated_price: Optional[float] = None
    risk_level: Optional[RiskLevel] = None
    growth_outlook: Optional[GrowthOutlook] = None
    ai_reasoning: Optional[str] = None
    user_notes: Optional[str] = None


class TradeRequestUpdate(BaseModel):
    status: Optional[TradeRequestStatus] = None
    broker_notes: Optional[str] = None
    executed_price: Optional[float] = None
    executed_quantity: Optional[float] = None
    execution_fees: Optional[float] = None


class TradeRequestResponse(BaseModel):
    id: str
    user_id: str
    recommendation_id: Optional[str] = None
    portfolio_id: str
    action: TradeAction
    symbol: str
    company_name: Optional[str] = None
    quantity: float
    order_type: OrderType
    limit_price: Optional[float] = None
    estimated_price: Optional[float] = None
    estimated_total: Optional[float] = None
    risk_level: Optional[RiskLevel] = None
    growth_outlook: Optional[GrowthOutlook] = None
    ai_reasoning: Optional[str] = None
    status: TradeRequestStatus
    broker_notes: Optional[str] = None
    executed_price: Optional[float] = None
    executed_quantity: Optional[float] = None
    execution_fees: Optional[float] = None
    executed_at: Optional[datetime] = None
    user_notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class TradeRequestListResponse(BaseModel):
    trades: list[TradeRequestResponse]
    total_count: int
    pending_count: int
    executed_count: int


class BrokerExecutionRequest(BaseModel):
    recommendation_id: str
    portfolio_id: str
    quantity: float
    order_type: OrderType = OrderType.market
    limit_price: Optional[float] = None
    user_notes: Optional[str] = None
