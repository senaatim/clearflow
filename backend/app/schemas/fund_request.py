from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from app.models.fund_request import FundingMethod, FundRequestStatus


class FundRequestCreate(BaseModel):
    amount: float
    method: FundingMethod
    user_notes: Optional[str] = None


class FundRequestReview(BaseModel):
    status: FundRequestStatus
    admin_notes: Optional[str] = None


class FundRequestResponse(BaseModel):
    id: str
    user_id: str
    amount: float
    method: FundingMethod
    status: FundRequestStatus
    user_notes: Optional[str] = None
    admin_notes: Optional[str] = None
    reviewed_by: Optional[str] = None
    created_at: datetime
    reviewed_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class FundRequestListResponse(BaseModel):
    requests: list[FundRequestResponse]
    total_count: int
    pending_count: int
