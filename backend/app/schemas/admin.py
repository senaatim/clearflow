from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class AdminStatsResponse(BaseModel):
    total_users: int
    active_users: int
    pending_reviews: int
    pending_deposits: int
    pending_trades: int
    total_aum: float
    total_deposits_today: int


class AdminUserResponse(BaseModel):
    id: str
    email: str
    first_name: str
    last_name: str
    phone: Optional[str] = None
    role: str
    is_active: bool
    is_verified: bool
    account_status: str = "pending_review"
    created_at: datetime
    last_login: Optional[datetime] = None

    class Config:
        from_attributes = True


class AdminUserListResponse(BaseModel):
    users: list[AdminUserResponse]
    total_count: int


class AdminUserUpdate(BaseModel):
    is_active: Optional[bool] = None
    role: Optional[str] = None


class AccountReviewRequest(BaseModel):
    action: str  # "approve" or "reject"
    notes: Optional[str] = None


class TradeExecuteRequest(BaseModel):
    executed_price: float
    executed_quantity: Optional[float] = None
    execution_fees: float = 0.0
    broker_notes: Optional[str] = None


class TradeRejectRequest(BaseModel):
    broker_notes: Optional[str] = None


class AdminFundRequestResponse(BaseModel):
    id: str
    user_id: str
    user_name: str
    user_email: str
    amount: float
    method: str
    status: str
    user_notes: Optional[str] = None
    admin_notes: Optional[str] = None
    reviewed_by: Optional[str] = None
    created_at: datetime
    reviewed_at: Optional[datetime] = None


class AdminFundRequestListResponse(BaseModel):
    requests: list[AdminFundRequestResponse]
    total_count: int
    pending_count: int


class AdminTradeResponse(BaseModel):
    id: str
    user_id: str
    user_name: str
    user_email: str
    portfolio_id: str
    action: str
    symbol: str
    company_name: Optional[str] = None
    quantity: float
    order_type: str
    estimated_price: Optional[float] = None
    estimated_total: Optional[float] = None
    status: str
    broker_notes: Optional[str] = None
    executed_price: Optional[float] = None
    executed_quantity: Optional[float] = None
    execution_fees: Optional[float] = None
    created_at: datetime
    executed_at: Optional[datetime] = None


class AdminTradeListResponse(BaseModel):
    trades: list[AdminTradeResponse]
    total_count: int
    pending_count: int


class AdminPortfolioResponse(BaseModel):
    id: str
    user_id: str
    user_name: str
    user_email: str
    name: str
    type: str
    currency: str
    total_value: Optional[float] = None
    created_at: datetime


class AdminPortfolioListResponse(BaseModel):
    portfolios: list[AdminPortfolioResponse]
    total_count: int


class AdminTransactionResponse(BaseModel):
    id: str
    portfolio_id: str
    user_name: str
    type: str
    symbol: Optional[str] = None
    quantity: Optional[float] = None
    price: Optional[float] = None
    total_amount: float
    executed_at: datetime

    class Config:
        from_attributes = True


class AdminTransactionListResponse(BaseModel):
    transactions: list[AdminTransactionResponse]
    total_count: int
