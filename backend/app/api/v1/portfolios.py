from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional

from app.database import get_db
from app.models.user import User
from app.models.portfolio import Portfolio
from app.models.asset import Asset
from app.schemas.portfolio import (
    PortfolioCreate,
    PortfolioUpdate,
    PortfolioResponse,
    PortfolioWithAssets,
    AllocationItem,
    PerformanceData,
)
from app.schemas.asset import AssetCreate, AssetUpdate, AssetResponse
from app.api.deps import get_current_user

router = APIRouter()


# Color palette for allocation
ALLOCATION_COLORS = [
    "#00ffaa",  # Primary green
    "#00d4ff",  # Cyan
    "#00ff88",  # Success green
    "#ffbb00",  # Warning yellow
    "#ff6b9d",  # Pink
    "#a855f7",  # Purple
    "#ff9f43",  # Orange
]


@router.get("", response_model=list[PortfolioResponse])
async def list_portfolios(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all portfolios for the current user."""
    result = await db.execute(
        select(Portfolio).where(Portfolio.user_id == current_user.id)
    )
    portfolios = result.scalars().all()

    # Calculate totals for each portfolio
    response = []
    for portfolio in portfolios:
        await db.refresh(portfolio, ["assets"])
        total_value = sum(asset.current_value for asset in portfolio.assets)
        total_cost = sum(asset.cost_basis for asset in portfolio.assets)
        total_return = total_value - total_cost
        return_percentage = (total_return / total_cost * 100) if total_cost > 0 else 0

        portfolio_response = PortfolioResponse.model_validate(portfolio)
        portfolio_response.total_value = total_value
        portfolio_response.total_return = total_return
        portfolio_response.return_percentage = return_percentage
        response.append(portfolio_response)

    return response


@router.post("", response_model=PortfolioResponse, status_code=status.HTTP_201_CREATED)
async def create_portfolio(
    portfolio_data: PortfolioCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new portfolio."""
    portfolio = Portfolio(
        user_id=current_user.id,
        name=portfolio_data.name,
        type=portfolio_data.type,
        description=portfolio_data.description,
        currency=portfolio_data.currency,
    )

    db.add(portfolio)
    await db.commit()
    await db.refresh(portfolio)

    return PortfolioResponse.model_validate(portfolio)


@router.get("/{portfolio_id}", response_model=PortfolioWithAssets)
async def get_portfolio(
    portfolio_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a specific portfolio with its assets."""
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

    # Build response with computed values
    assets_data = []
    for asset in portfolio.assets:
        assets_data.append({
            "id": asset.id,
            "symbol": asset.symbol,
            "name": asset.name,
            "asset_type": asset.asset_type.value,
            "category": asset.category,
            "quantity": asset.quantity,
            "average_cost": asset.average_cost,
            "current_price": asset.current_price,
            "current_value": asset.current_value,
            "gain_loss": asset.gain_loss,
            "gain_loss_percentage": asset.gain_loss_percentage,
        })

    total_value = sum(a["current_value"] for a in assets_data)
    total_cost = sum(a["quantity"] * a["average_cost"] for a in assets_data)
    total_return = total_value - total_cost
    return_percentage = (total_return / total_cost * 100) if total_cost > 0 else 0

    return PortfolioWithAssets(
        **PortfolioResponse.model_validate(portfolio).model_dump(),
        assets=assets_data,
        total_value=total_value,
        total_return=total_return,
        return_percentage=return_percentage,
    )


@router.patch("/{portfolio_id}", response_model=PortfolioResponse)
async def update_portfolio(
    portfolio_id: str,
    updates: PortfolioUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update a portfolio."""
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

    update_data = updates.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(portfolio, field, value)

    await db.commit()
    await db.refresh(portfolio)

    return PortfolioResponse.model_validate(portfolio)


@router.delete("/{portfolio_id}")
async def delete_portfolio(
    portfolio_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a portfolio."""
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

    await db.delete(portfolio)
    await db.commit()

    return {"success": True, "message": "Portfolio deleted"}


@router.get("/{portfolio_id}/allocation", response_model=list[AllocationItem])
async def get_allocation(
    portfolio_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get portfolio asset allocation."""
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

    # Group assets by category
    category_totals: dict[str, dict] = {}
    total_value = 0

    for asset in portfolio.assets:
        value = asset.current_value
        total_value += value

        if asset.category not in category_totals:
            category_totals[asset.category] = {
                "name": asset.category,
                "type": f"{asset.asset_type.value.upper()}s",
                "value": 0,
            }
        category_totals[asset.category]["value"] += value

    # Calculate percentages and assign colors
    allocations = []
    for i, (category, data) in enumerate(category_totals.items()):
        percentage = (data["value"] / total_value * 100) if total_value > 0 else 0
        allocations.append(AllocationItem(
            name=data["name"],
            type=data["type"],
            percentage=round(percentage, 1),
            value=data["value"],
            color=ALLOCATION_COLORS[i % len(ALLOCATION_COLORS)],
        ))

    # Sort by percentage descending
    allocations.sort(key=lambda x: x.percentage, reverse=True)

    return allocations


@router.get("/{portfolio_id}/performance", response_model=list[PerformanceData])
async def get_performance(
    portfolio_id: str,
    period: str = "1y",
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get portfolio performance data."""
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

    # Generate mock performance data
    import random
    from datetime import datetime, timedelta

    months = {"1m": 1, "3m": 3, "6m": 6, "1y": 12, "all": 24}.get(period.lower(), 12)
    base_value = 220000
    data = []

    for i in range(months):
        date = datetime.now() - timedelta(days=(months - i) * 30)
        # Simulate growth with some variance
        growth = 1 + (random.uniform(-0.02, 0.04) + 0.01)
        base_value *= growth

        data.append(PerformanceData(
            date=date.strftime("%b %Y"),
            value=round(base_value, 2),
            benchmark=round(base_value * random.uniform(0.95, 1.05), 2),
        ))

    return data


# Asset endpoints
@router.get("/{portfolio_id}/assets", response_model=list[AssetResponse])
async def list_assets(
    portfolio_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all assets in a portfolio."""
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

    return [
        AssetResponse(
            **{
                "id": asset.id,
                "portfolio_id": asset.portfolio_id,
                "symbol": asset.symbol,
                "name": asset.name,
                "asset_type": asset.asset_type,
                "category": asset.category,
                "quantity": asset.quantity,
                "average_cost": asset.average_cost,
                "current_price": asset.current_price,
                "last_price_update": asset.last_price_update,
                "current_value": asset.current_value,
                "cost_basis": asset.cost_basis,
                "gain_loss": asset.gain_loss,
                "gain_loss_percentage": asset.gain_loss_percentage,
                "created_at": asset.created_at,
                "updated_at": asset.updated_at,
            }
        )
        for asset in portfolio.assets
    ]


@router.post("/{portfolio_id}/assets", response_model=AssetResponse, status_code=status.HTTP_201_CREATED)
async def add_asset(
    portfolio_id: str,
    asset_data: AssetCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Add an asset to a portfolio."""
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

    asset = Asset(
        portfolio_id=portfolio_id,
        symbol=asset_data.symbol,
        name=asset_data.name,
        asset_type=asset_data.asset_type,
        category=asset_data.category,
        quantity=asset_data.quantity,
        average_cost=asset_data.average_cost,
        current_price=asset_data.average_cost,  # Initial price = cost
    )

    db.add(asset)
    await db.commit()
    await db.refresh(asset)

    return AssetResponse(
        **{
            "id": asset.id,
            "portfolio_id": asset.portfolio_id,
            "symbol": asset.symbol,
            "name": asset.name,
            "asset_type": asset.asset_type,
            "category": asset.category,
            "quantity": asset.quantity,
            "average_cost": asset.average_cost,
            "current_price": asset.current_price,
            "last_price_update": asset.last_price_update,
            "current_value": asset.current_value,
            "cost_basis": asset.cost_basis,
            "gain_loss": asset.gain_loss,
            "gain_loss_percentage": asset.gain_loss_percentage,
            "created_at": asset.created_at,
            "updated_at": asset.updated_at,
        }
    )
