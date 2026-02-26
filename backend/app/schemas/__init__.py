from app.schemas.user import (
    UserCreate,
    UserLogin,
    UserResponse,
    UserUpdate,
    TokenResponse,
    TokenRefresh,
)
from app.schemas.portfolio import (
    PortfolioCreate,
    PortfolioUpdate,
    PortfolioResponse,
    PortfolioWithAssets,
)
from app.schemas.asset import (
    AssetCreate,
    AssetUpdate,
    AssetResponse,
)
from app.schemas.recommendation import (
    RecommendationCreate,
    RecommendationResponse,
    RecommendationUpdate,
)
from app.schemas.common import (
    DashboardStats,
    RiskScore,
    TaxSummary,
    MarketTrend,
    Prediction,
)

__all__ = [
    "UserCreate",
    "UserLogin",
    "UserResponse",
    "UserUpdate",
    "TokenResponse",
    "TokenRefresh",
    "PortfolioCreate",
    "PortfolioUpdate",
    "PortfolioResponse",
    "PortfolioWithAssets",
    "AssetCreate",
    "AssetUpdate",
    "AssetResponse",
    "RecommendationCreate",
    "RecommendationResponse",
    "RecommendationUpdate",
    "DashboardStats",
    "RiskScore",
    "TaxSummary",
    "MarketTrend",
    "Prediction",
]
