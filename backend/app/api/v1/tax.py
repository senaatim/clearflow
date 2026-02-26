from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional
from datetime import datetime
import random

from app.database import get_db
from app.models.user import User
from app.models.portfolio import Portfolio
from app.schemas.common import TaxSummary, TaxHarvestingOpportunity
from app.api.deps import get_current_user
from app.ml.tax_optimizer import TaxOptimizer

router = APIRouter()


@router.get("/summary", response_model=TaxSummary)
async def get_tax_summary(
    year: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get tax summary for the year."""
    if year is None:
        year = datetime.now().year

    # Generate mock tax data
    realized_gains = random.uniform(5000, 25000)
    realized_losses = random.uniform(1000, 8000)
    short_term = realized_gains * random.uniform(0.2, 0.4)
    long_term = realized_gains - short_term

    # Estimate tax (simplified)
    short_term_tax_rate = 0.32  # Ordinary income rate
    long_term_tax_rate = 0.15  # Capital gains rate

    estimated_tax = (
        short_term * short_term_tax_rate +
        long_term * long_term_tax_rate -
        min(realized_losses, 3000) * short_term_tax_rate  # Loss offset
    )

    return TaxSummary(
        year=year,
        total_realized_gains=round(realized_gains, 2),
        total_realized_losses=round(-realized_losses, 2),
        net_gain_loss=round(realized_gains - realized_losses, 2),
        short_term_gains=round(short_term, 2),
        long_term_gains=round(long_term, 2),
        estimated_tax_liability=round(max(0, estimated_tax), 2),
    )


@router.get("/harvesting", response_model=list[TaxHarvestingOpportunity])
async def get_harvesting_opportunities(
    portfolio_id: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get tax-loss harvesting opportunities."""
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
        assets = portfolio.assets
    else:
        # Get all user's assets
        result = await db.execute(
            select(Portfolio).where(Portfolio.user_id == current_user.id)
        )
        portfolios = result.scalars().all()

        assets = []
        for p in portfolios:
            await db.refresh(p, ["assets"])
            assets.extend(p.assets)

    # Find assets with unrealized losses
    optimizer = TaxOptimizer()
    opportunities = optimizer.find_harvesting_opportunities(assets)

    return opportunities


@router.get("/gains-losses")
async def get_gains_losses(
    year: Optional[int] = None,
    portfolio_id: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get detailed realized gains and losses."""
    if year is None:
        year = datetime.now().year

    # Generate mock transaction data
    transactions = [
        {
            "id": "tx-1",
            "date": f"{year}-01-15",
            "symbol": "AAPL",
            "type": "sell",
            "quantity": 10,
            "proceeds": 1850.00,
            "cost_basis": 1500.00,
            "gain_loss": 350.00,
            "term": "long",
        },
        {
            "id": "tx-2",
            "date": f"{year}-03-22",
            "symbol": "TSLA",
            "type": "sell",
            "quantity": 5,
            "proceeds": 900.00,
            "cost_basis": 1200.00,
            "gain_loss": -300.00,
            "term": "short",
        },
        {
            "id": "tx-3",
            "date": f"{year}-06-10",
            "symbol": "MSFT",
            "type": "sell",
            "quantity": 15,
            "proceeds": 5250.00,
            "cost_basis": 4500.00,
            "gain_loss": 750.00,
            "term": "long",
        },
        {
            "id": "tx-4",
            "date": f"{year}-09-05",
            "symbol": "NVDA",
            "type": "sell",
            "quantity": 8,
            "proceeds": 3800.00,
            "cost_basis": 3200.00,
            "gain_loss": 600.00,
            "term": "short",
        },
    ]

    # Calculate totals
    total_gains = sum(t["gain_loss"] for t in transactions if t["gain_loss"] > 0)
    total_losses = sum(t["gain_loss"] for t in transactions if t["gain_loss"] < 0)
    short_term = sum(t["gain_loss"] for t in transactions if t["term"] == "short")
    long_term = sum(t["gain_loss"] for t in transactions if t["term"] == "long")

    return {
        "year": year,
        "transactions": transactions,
        "summary": {
            "total_gains": round(total_gains, 2),
            "total_losses": round(total_losses, 2),
            "net": round(total_gains + total_losses, 2),
            "short_term_net": round(short_term, 2),
            "long_term_net": round(long_term, 2),
        },
    }


@router.post("/calculate")
async def calculate_tax_impact(
    transactions: list[dict],
    current_user: User = Depends(get_current_user),
):
    """Calculate tax impact of proposed transactions."""
    total_gain_loss = 0
    short_term = 0
    long_term = 0

    for tx in transactions:
        gain_loss = tx.get("proceeds", 0) - tx.get("cost_basis", 0)
        total_gain_loss += gain_loss

        if tx.get("term") == "short":
            short_term += gain_loss
        else:
            long_term += gain_loss

    # Calculate estimated tax
    short_term_tax = short_term * 0.32 if short_term > 0 else 0
    long_term_tax = long_term * 0.15 if long_term > 0 else 0

    # Loss offset (up to $3000)
    loss_offset = min(abs(min(0, total_gain_loss)), 3000) * 0.32 if total_gain_loss < 0 else 0

    return {
        "total_gain_loss": round(total_gain_loss, 2),
        "short_term_gain_loss": round(short_term, 2),
        "long_term_gain_loss": round(long_term, 2),
        "estimated_tax_impact": round(short_term_tax + long_term_tax - loss_offset, 2),
        "effective_tax_rate": round(
            ((short_term_tax + long_term_tax) / total_gain_loss * 100) if total_gain_loss > 0 else 0,
            2
        ),
        "recommendations": [
            "Consider holding short-term positions longer for lower tax rates",
            "Use tax-loss harvesting to offset gains",
        ] if total_gain_loss > 0 else [
            "Losses can offset up to $3,000 of ordinary income",
            "Excess losses carry forward to future years",
        ],
    }
