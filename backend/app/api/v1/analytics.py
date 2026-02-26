from fastapi import APIRouter, Depends
from typing import Optional
import random
from datetime import datetime

from app.models.user import User
from app.schemas.common import MarketTrend, Prediction, SectorOutlook
from app.api.deps import get_current_user

router = APIRouter()


# Mock market data
SECTORS = ["Technology", "Healthcare", "Finance", "Energy", "Consumer", "Industrial"]
SYMBOLS = {
    "Technology": ["AAPL", "MSFT", "GOOGL", "NVDA", "META"],
    "Healthcare": ["JNJ", "PFE", "UNH", "ABBV", "MRK"],
    "Finance": ["JPM", "BAC", "GS", "V", "MA"],
    "Energy": ["XOM", "CVX", "COP", "SLB", "EOG"],
    "Consumer": ["AMZN", "WMT", "COST", "PG", "KO"],
    "Industrial": ["CAT", "DE", "HON", "UPS", "MMM"],
}


@router.get("/market-trends", response_model=list[MarketTrend])
async def get_market_trends(
    sectors: Optional[str] = None,
    period: str = "1d",
    current_user: User = Depends(get_current_user),
):
    """Get market trend data."""
    selected_sectors = sectors.split(",") if sectors else SECTORS
    trends = []

    for sector in selected_sectors:
        if sector in SYMBOLS:
            for symbol in SYMBOLS[sector][:3]:  # Top 3 per sector
                change = random.uniform(-5, 8)
                trends.append(MarketTrend(
                    symbol=symbol,
                    name=f"{symbol} Inc.",
                    direction="bullish" if change > 1 else "bearish" if change < -1 else "neutral",
                    change=round(change, 2),
                    change_percent=round(change, 2),
                    volume=random.randint(1000000, 50000000),
                ))

    return trends


@router.get("/predictions", response_model=list[Prediction])
async def get_predictions(
    symbols: Optional[str] = None,
    current_user: User = Depends(get_current_user),
):
    """Get market predictions for symbols."""
    symbol_list = symbols.split(",") if symbols else ["AAPL", "MSFT", "GOOGL", "AMZN", "NVDA"]
    predictions = []

    for symbol in symbol_list:
        base_price = random.uniform(100, 500)
        direction = random.choice(["bullish", "bearish", "neutral"])
        confidence = random.uniform(0.6, 0.95)

        target_multiplier = {
            "bullish": random.uniform(1.05, 1.20),
            "bearish": random.uniform(0.85, 0.95),
            "neutral": random.uniform(0.98, 1.02),
        }[direction]

        predictions.append(Prediction(
            symbol=symbol,
            direction=direction,
            confidence=round(confidence, 2),
            target_price=round(base_price * target_multiplier, 2),
            risk_level="low" if confidence > 0.8 else "medium" if confidence > 0.65 else "high",
            factors=[
                "Historical momentum analysis",
                "Technical indicator signals",
                "Market sentiment analysis",
                "Sector trend correlation",
            ],
            generated_at=datetime.utcnow().isoformat(),
        ))

    return predictions


@router.get("/sentiment", response_model=SectorOutlook)
async def get_sentiment(
    sector: Optional[str] = "Technology",
    current_user: User = Depends(get_current_user),
):
    """Get market sentiment for a sector."""
    sentiment = random.choice(["positive", "neutral", "negative"])
    strength = random.uniform(0.4, 0.9)

    return SectorOutlook(
        sector=sector,
        sentiment=sentiment,
        strength=round(strength, 2),
        trending_stocks=SYMBOLS.get(sector, ["AAPL", "MSFT", "GOOGL"])[:5],
    )


@router.get("/correlations")
async def get_correlations(
    portfolio_id: Optional[str] = None,
    current_user: User = Depends(get_current_user),
):
    """Get portfolio asset correlations."""
    # Generate mock correlation matrix
    assets = ["AAPL", "MSFT", "GOOGL", "AMZN", "NVDA"]
    correlations = {}

    for asset1 in assets:
        correlations[asset1] = {}
        for asset2 in assets:
            if asset1 == asset2:
                correlations[asset1][asset2] = 1.0
            else:
                # Random correlation between -0.5 and 0.9
                correlations[asset1][asset2] = round(random.uniform(-0.3, 0.9), 2)

    return {
        "assets": assets,
        "matrix": correlations,
        "high_correlations": [
            {"pair": ["AAPL", "MSFT"], "correlation": 0.85},
            {"pair": ["GOOGL", "META"], "correlation": 0.78},
        ],
        "recommendations": [
            "Consider diversifying away from highly correlated tech stocks",
            "Adding bonds could reduce overall portfolio correlation",
        ],
    }
