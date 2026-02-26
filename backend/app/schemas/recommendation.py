from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from app.models.recommendation import (
    RecommendationType,
    RecommendationPriority,
    RecommendationStatus,
)


class RecommendationCreate(BaseModel):
    portfolio_id: Optional[str] = None
    type: RecommendationType
    title: str
    description: str
    details: Optional[dict] = None
    confidence_score: Optional[float] = None
    potential_impact: Optional[float] = None
    priority: RecommendationPriority = RecommendationPriority.medium


class RecommendationUpdate(BaseModel):
    status: Optional[RecommendationStatus] = None


class RecommendationResponse(BaseModel):
    id: str
    user_id: str
    portfolio_id: Optional[str] = None
    type: RecommendationType
    title: str
    description: str
    details: Optional[dict] = None
    confidence_score: Optional[float] = None
    potential_impact: Optional[float] = None
    priority: RecommendationPriority
    status: RecommendationStatus
    expires_at: Optional[datetime] = None
    created_at: datetime
    acted_at: Optional[datetime] = None

    class Config:
        from_attributes = True
