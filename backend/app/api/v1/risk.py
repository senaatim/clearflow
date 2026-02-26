from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional

from app.database import get_db
from app.models.user import User
from app.models.portfolio import Portfolio
from app.schemas.common import RiskScore, StressTestRequest, StressTestResult
from app.api.deps import get_current_user
from app.ml.risk_scorer import RiskScorer

router = APIRouter()


@router.get("/score", response_model=RiskScore)
async def get_risk_score(
    portfolio_id: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get portfolio risk score."""
    if portfolio_id:
        result = await db.execute(
            select(Portfolio).where(
                Portfolio.id == portfolio_id,
                Portfolio.user_id == current_user.id,
            )
        )
        portfolio = result.scalar_one_or_none()

        if not portfolio:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Portfolio not found",
            )

        await db.refresh(portfolio, ["assets"])
    else:
        # Get all portfolios
        result = await db.execute(
            select(Portfolio).where(Portfolio.user_id == current_user.id)
        )
        portfolios = result.scalars().all()

        if not portfolios:
            # Return default risk score if no portfolios
            return RiskScore(
                overall=5.0,
                diversification=5.0,
                concentration=5.0,
                position_size=5.0,
                volatility=5.0,
                correlation=5.0,
                recommendation="Create a portfolio to get personalized risk analysis.",
            )

        # Combine all portfolio assets
        all_assets = []
        for p in portfolios:
            await db.refresh(p, ["assets"])
            all_assets.extend(p.assets)

        # Create a mock portfolio object for scoring
        class CombinedPortfolio:
            def __init__(self, assets):
                self.assets = assets

        portfolio = CombinedPortfolio(all_assets)

    # Calculate risk score
    scorer = RiskScorer()
    risk_score = scorer.calculate_portfolio_risk(portfolio)

    return risk_score


@router.get("/volatility")
async def get_volatility(
    portfolio_id: Optional[str] = None,
    period: str = "3m",
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get portfolio volatility analysis."""
    import random
    from datetime import datetime, timedelta

    periods = {"1m": 30, "3m": 90, "6m": 180, "1y": 365}
    days = periods.get(period, 90)

    # Generate mock volatility data
    data = []
    base_vol = random.uniform(0.1, 0.25)
    benchmark_vol = random.uniform(0.12, 0.20)

    for i in range(days // 7):  # Weekly data
        date = datetime.now() - timedelta(days=(days - i * 7))
        vol = base_vol + random.uniform(-0.05, 0.05)
        bench = benchmark_vol + random.uniform(-0.03, 0.03)

        data.append({
            "date": date.strftime("%Y-%m-%d"),
            "volatility": round(max(0.05, vol), 4),
            "benchmark": round(max(0.05, bench), 4),
        })

    current_vol = data[-1]["volatility"] if data else 0.15

    return {
        "current_volatility": round(current_vol, 4),
        "average_volatility": round(sum(d["volatility"] for d in data) / len(data) if data else 0.15, 4),
        "max_volatility": round(max(d["volatility"] for d in data) if data else 0.25, 4),
        "min_volatility": round(min(d["volatility"] for d in data) if data else 0.08, 4),
        "trend": "increasing" if current_vol > 0.15 else "decreasing",
        "data": data,
    }


@router.post("/stress-test", response_model=StressTestResult)
async def run_stress_test(
    request: StressTestRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Run a portfolio stress test."""
    result = await db.execute(
        select(Portfolio).where(
            Portfolio.id == request.portfolio_id,
            Portfolio.user_id == current_user.id,
        )
    )
    portfolio = result.scalar_one_or_none()

    if not portfolio:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Portfolio not found",
        )

    await db.refresh(portfolio, ["assets"])

    # Scenario impacts (percentage drop)
    scenarios = {
        "recession": {
            "description": "Economic recession with 20-30% market decline",
            "impact_range": (-0.30, -0.20),
        },
        "market_crash": {
            "description": "Severe market crash like 2008 (40-50% decline)",
            "impact_range": (-0.50, -0.40),
        },
        "inflation": {
            "description": "High inflation environment (10-15% decline)",
            "impact_range": (-0.15, -0.10),
        },
        "interest_rate_hike": {
            "description": "Sharp interest rate increase (15-25% decline)",
            "impact_range": (-0.25, -0.15),
        },
    }

    scenario_data = scenarios.get(request.scenario, scenarios["recession"])
    import random

    # Calculate impact
    total_value = sum(asset.current_value for asset in portfolio.assets)
    impact_percent = random.uniform(*scenario_data["impact_range"])
    portfolio_impact = total_value * impact_percent

    # Calculate per-asset impact
    affected_assets = []
    for asset in portfolio.assets:
        # Different asset types affected differently
        asset_impact_multiplier = {
            "stock": 1.2,
            "etf": 1.0,
            "bond": 0.3,
            "crypto": 1.5,
            "reit": 1.1,
        }.get(asset.asset_type.value, 1.0)

        asset_impact = asset.current_value * impact_percent * asset_impact_multiplier
        affected_assets.append({
            "symbol": asset.symbol,
            "impact": round(asset_impact, 2),
        })

    return StressTestResult(
        scenario=request.scenario,
        description=scenario_data["description"],
        portfolio_impact=round(portfolio_impact, 2),
        percentage_change=round(impact_percent * 100, 2),
        affected_assets=affected_assets,
    )


@router.get("/alerts")
async def get_risk_alerts(
    portfolio_id: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get risk alerts for portfolio."""
    # Generate mock alerts
    alerts = [
        {
            "id": "alert-1",
            "type": "concentration",
            "severity": "warning",
            "title": "High Sector Concentration",
            "description": "Technology sector allocation exceeds 35% of portfolio",
            "recommendation": "Consider rebalancing to reduce tech exposure",
            "created_at": "2026-02-02T10:30:00Z",
        },
        {
            "id": "alert-2",
            "type": "volatility",
            "severity": "info",
            "title": "Increased Market Volatility",
            "description": "VIX index has risen 15% in the past week",
            "recommendation": "Monitor positions closely; consider protective puts",
            "created_at": "2026-02-01T14:20:00Z",
        },
        {
            "id": "alert-3",
            "type": "correlation",
            "severity": "low",
            "title": "High Asset Correlation",
            "description": "Several holdings show correlation > 0.8",
            "recommendation": "Diversify into uncorrelated asset classes",
            "created_at": "2026-01-30T09:15:00Z",
        },
    ]

    return {"alerts": alerts, "total": len(alerts)}
