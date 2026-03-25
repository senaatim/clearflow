from fastapi import APIRouter, Depends, HTTPException, status
from typing import Optional
from datetime import datetime

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
from app.middleware.subscription import require_subscription, Features

_portfolio_access = require_subscription(Features.PORTFOLIO_TRACKING)

router = APIRouter()

ALLOCATION_COLORS = [
    "#00ffaa", "#00d4ff", "#00ff88", "#ffbb00",
    "#ff6b9d", "#a855f7", "#ff9f43",
]


@router.get("", response_model=list[PortfolioResponse])
async def list_portfolios(current_user: User = Depends(_portfolio_access)):
    portfolios = await Portfolio.find(Portfolio.user_id == current_user.id).to_list()

    response = []
    for portfolio in portfolios:
        assets = await Asset.find(Asset.portfolio_id == portfolio.id).to_list()
        total_value = sum(a.current_value for a in assets)
        total_cost = sum(a.cost_basis for a in assets)
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
    current_user: User = Depends(_portfolio_access),
):
    portfolio = Portfolio(
        user_id=current_user.id,
        name=portfolio_data.name,
        type=portfolio_data.type,
        description=portfolio_data.description,
        currency=portfolio_data.currency,
    )
    await portfolio.insert()
    return PortfolioResponse.model_validate(portfolio)


@router.get("/{portfolio_id}", response_model=PortfolioWithAssets)
async def get_portfolio(
    portfolio_id: str,
    current_user: User = Depends(_portfolio_access),
):
    portfolio = await Portfolio.find_one(
        Portfolio.id == portfolio_id,
        Portfolio.user_id == current_user.id,
    )

    if not portfolio:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Portfolio not found")

    assets = await Asset.find(Asset.portfolio_id == portfolio.id).to_list()

    assets_data = [
        {
            "id": a.id,
            "symbol": a.symbol,
            "name": a.name,
            "asset_type": a.asset_type.value,
            "category": a.category,
            "quantity": a.quantity,
            "average_cost": a.average_cost,
            "current_price": a.current_price,
            "current_value": a.current_value,
            "gain_loss": a.gain_loss,
            "gain_loss_percentage": a.gain_loss_percentage,
        }
        for a in assets
    ]

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
    current_user: User = Depends(_portfolio_access),
):
    portfolio = await Portfolio.find_one(
        Portfolio.id == portfolio_id,
        Portfolio.user_id == current_user.id,
    )

    if not portfolio:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Portfolio not found")

    update_data = updates.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(portfolio, field, value)

    portfolio.updated_at = datetime.utcnow()
    await portfolio.save()

    return PortfolioResponse.model_validate(portfolio)


@router.delete("/{portfolio_id}")
async def delete_portfolio(
    portfolio_id: str,
    current_user: User = Depends(_portfolio_access),
):
    portfolio = await Portfolio.find_one(
        Portfolio.id == portfolio_id,
        Portfolio.user_id == current_user.id,
    )

    if not portfolio:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Portfolio not found")

    # Delete related assets and transactions
    await Asset.find(Asset.portfolio_id == portfolio_id).delete()
    from app.models.transaction import Transaction
    await Transaction.find(Transaction.portfolio_id == portfolio_id).delete()

    await portfolio.delete()
    return {"success": True, "message": "Portfolio deleted"}


@router.get("/{portfolio_id}/allocation", response_model=list[AllocationItem])
async def get_allocation(
    portfolio_id: str,
    current_user: User = Depends(_portfolio_access),
):
    portfolio = await Portfolio.find_one(
        Portfolio.id == portfolio_id,
        Portfolio.user_id == current_user.id,
    )

    if not portfolio:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Portfolio not found")

    assets = await Asset.find(Asset.portfolio_id == portfolio_id).to_list()

    category_totals: dict[str, dict] = {}
    total_value = 0

    for asset in assets:
        value = asset.current_value
        total_value += value

        if asset.category not in category_totals:
            category_totals[asset.category] = {
                "name": asset.category,
                "type": f"{asset.asset_type.value.upper()}s",
                "value": 0,
            }
        category_totals[asset.category]["value"] += value

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

    allocations.sort(key=lambda x: x.percentage, reverse=True)
    return allocations


@router.get("/{portfolio_id}/performance", response_model=list[PerformanceData])
async def get_performance(
    portfolio_id: str,
    period: str = "1y",
    current_user: User = Depends(_portfolio_access),
):
    portfolio = await Portfolio.find_one(
        Portfolio.id == portfolio_id,
        Portfolio.user_id == current_user.id,
    )

    if not portfolio:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Portfolio not found")

    import random
    from datetime import timedelta

    months = {"1m": 1, "3m": 3, "6m": 6, "1y": 12, "all": 24}.get(period.lower(), 12)
    base_value = 220000
    data = []

    for i in range(months):
        date = datetime.now() - timedelta(days=(months - i) * 30)
        growth = 1 + (random.uniform(-0.02, 0.04) + 0.01)
        base_value *= growth

        data.append(PerformanceData(
            date=date.strftime("%b %Y"),
            value=round(base_value, 2),
            benchmark=round(base_value * random.uniform(0.95, 1.05), 2),
        ))

    return data


@router.get("/{portfolio_id}/assets", response_model=list[AssetResponse])
async def list_assets(
    portfolio_id: str,
    current_user: User = Depends(_portfolio_access),
):
    portfolio = await Portfolio.find_one(
        Portfolio.id == portfolio_id,
        Portfolio.user_id == current_user.id,
    )

    if not portfolio:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Portfolio not found")

    assets = await Asset.find(Asset.portfolio_id == portfolio_id).to_list()

    return [
        AssetResponse(**{
            "id": a.id,
            "portfolio_id": a.portfolio_id,
            "symbol": a.symbol,
            "name": a.name,
            "asset_type": a.asset_type,
            "category": a.category,
            "quantity": a.quantity,
            "average_cost": a.average_cost,
            "current_price": a.current_price,
            "last_price_update": a.last_price_update,
            "current_value": a.current_value,
            "cost_basis": a.cost_basis,
            "gain_loss": a.gain_loss,
            "gain_loss_percentage": a.gain_loss_percentage,
            "created_at": a.created_at,
            "updated_at": a.updated_at,
        })
        for a in assets
    ]


@router.post("/{portfolio_id}/assets", response_model=AssetResponse, status_code=status.HTTP_201_CREATED)
async def add_asset(
    portfolio_id: str,
    asset_data: AssetCreate,
    current_user: User = Depends(_portfolio_access),
):
    portfolio = await Portfolio.find_one(
        Portfolio.id == portfolio_id,
        Portfolio.user_id == current_user.id,
    )

    if not portfolio:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Portfolio not found")

    asset = Asset(
        portfolio_id=portfolio_id,
        symbol=asset_data.symbol,
        name=asset_data.name,
        asset_type=asset_data.asset_type,
        category=asset_data.category,
        quantity=asset_data.quantity,
        average_cost=asset_data.average_cost,
        current_price=asset_data.average_cost,
    )
    await asset.insert()

    return AssetResponse(**{
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
    })
