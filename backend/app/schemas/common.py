from pydantic import BaseModel
from typing import Optional


class DashboardStats(BaseModel):
    total_portfolio_value: float
    total_returns: float
    return_percentage: float
    monthly_contribution: float
    next_contribution_date: Optional[str] = None
    risk_score: float
    risk_level: str
    monthly_change: float
    monthly_change_percentage: float


class RiskScore(BaseModel):
    overall: float
    diversification: float
    concentration: float
    position_size: float
    volatility: float
    correlation: float
    recommendation: str


class RiskBreakdown(BaseModel):
    factor: str
    score: float
    weight: float
    description: str


class TaxSummary(BaseModel):
    year: int
    total_realized_gains: float
    total_realized_losses: float
    net_gain_loss: float
    short_term_gains: float
    long_term_gains: float
    estimated_tax_liability: float


class TaxHarvestingOpportunity(BaseModel):
    asset_id: str
    symbol: str
    unrealized_loss: float
    potential_tax_savings: float
    suggested_replacement: Optional[str] = None
    wash_sale_risk: bool


class MarketTrend(BaseModel):
    symbol: str
    name: str
    direction: str  # 'bullish', 'bearish', 'neutral'
    change: float
    change_percent: float
    volume: int


class Prediction(BaseModel):
    symbol: str
    direction: str
    confidence: float
    target_price: float
    risk_level: str
    factors: list[str]
    generated_at: str


class SectorOutlook(BaseModel):
    sector: str
    sentiment: str
    strength: float
    trending_stocks: list[str]


class StressTestRequest(BaseModel):
    portfolio_id: str
    scenario: str  # 'recession', 'market_crash', 'inflation', 'interest_rate_hike'


class StressTestResult(BaseModel):
    scenario: str
    description: str
    portfolio_impact: float
    percentage_change: float
    affected_assets: list[dict]
