from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from datetime import datetime
from typing import Optional

from app.database import get_db
from app.models.user import User
from app.models.portfolio import Portfolio
from app.models.recommendation import Recommendation
from app.models.trade_request import TradeRequest, TradeRequestStatus, TradeAction, OrderType
from app.schemas.trade_request import (
    TradeRequestCreate,
    TradeRequestUpdate,
    TradeRequestResponse,
    TradeRequestListResponse,
    BrokerExecutionRequest,
)
from app.api.deps import get_current_user, get_current_broker
from app.middleware.subscription import require_subscription, get_user_subscription, Features
from app.models.subscription import SubscriptionStatus, tier_has_feature

router = APIRouter()

# ── User-facing routes ────────────────────────────────────────────────────────

@router.get("", response_model=TradeRequestListResponse)
async def list_trade_requests(
    status_filter: Optional[TradeRequestStatus] = None,
    limit: int = 50,
    offset: int = 0,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all trade requests for the current user."""
    subscription = await get_user_subscription(db, current_user.id)
    if (
        not subscription
        or subscription.status != SubscriptionStatus.active
        or not tier_has_feature(subscription.tier, Features.BROKER_EXECUTION)
    ):
        return TradeRequestListResponse(
            trades=[],
            total_count=0,
            pending_count=0,
            executed_count=0,
        )

    query = select(TradeRequest).where(TradeRequest.user_id == current_user.id)
    if status_filter:
        query = query.where(TradeRequest.status == status_filter)

    count_query = select(func.count(TradeRequest.id)).where(TradeRequest.user_id == current_user.id)
    total_count = (await db.execute(count_query)).scalar() or 0
    pending_count = (await db.execute(
        count_query.where(TradeRequest.status == TradeRequestStatus.pending)
    )).scalar() or 0
    executed_count = (await db.execute(
        count_query.where(TradeRequest.status == TradeRequestStatus.executed)
    )).scalar() or 0

    result = await db.execute(
        query.order_by(TradeRequest.created_at.desc()).offset(offset).limit(limit)
    )
    trades = result.scalars().all()

    return TradeRequestListResponse(
        trades=[TradeRequestResponse.model_validate(t) for t in trades],
        total_count=total_count,
        pending_count=pending_count,
        executed_count=executed_count,
    )


@router.post("", response_model=TradeRequestResponse, status_code=status.HTTP_201_CREATED)
async def create_trade_request(
    trade_data: TradeRequestCreate,
    current_user: User = Depends(require_subscription(Features.BROKER_EXECUTION)),
    db: AsyncSession = Depends(get_db),
):
    """Create a new trade request."""
    # Validate financial inputs
    if trade_data.quantity <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Quantity must be greater than zero",
        )
    if trade_data.estimated_price is not None and trade_data.estimated_price <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Estimated price must be greater than zero",
        )
    if trade_data.limit_price is not None and trade_data.limit_price <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Limit price must be greater than zero",
        )

    # Verify portfolio belongs to the requesting user
    result = await db.execute(
        select(Portfolio).where(
            Portfolio.id == trade_data.portfolio_id,
            Portfolio.user_id == current_user.id,
        )
    )
    portfolio = result.scalar_one_or_none()
    if not portfolio:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Portfolio not found",
        )

    # Verify recommendation belongs to the requesting user if provided
    if trade_data.recommendation_id:
        result = await db.execute(
            select(Recommendation).where(
                Recommendation.id == trade_data.recommendation_id,
                Recommendation.user_id == current_user.id,
            )
        )
        if not result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Recommendation not found",
            )

    estimated_total = None
    if trade_data.estimated_price:
        estimated_total = trade_data.estimated_price * trade_data.quantity

    trade_request = TradeRequest(
        user_id=current_user.id,
        portfolio_id=trade_data.portfolio_id,
        recommendation_id=trade_data.recommendation_id,
        action=trade_data.action,
        symbol=trade_data.symbol,
        company_name=trade_data.company_name,
        quantity=trade_data.quantity,
        order_type=trade_data.order_type,
        limit_price=trade_data.limit_price,
        estimated_price=trade_data.estimated_price,
        estimated_total=estimated_total,
        risk_level=trade_data.risk_level,
        growth_outlook=trade_data.growth_outlook,
        ai_reasoning=trade_data.ai_reasoning,
        user_notes=trade_data.user_notes,
        status=TradeRequestStatus.pending,
    )

    db.add(trade_request)
    await db.commit()
    await db.refresh(trade_request)

    return TradeRequestResponse.model_validate(trade_request)


@router.post("/request-execution", response_model=TradeRequestResponse, status_code=status.HTTP_201_CREATED)
async def request_broker_execution(
    request_data: BrokerExecutionRequest,
    current_user: User = Depends(require_subscription(Features.BROKER_EXECUTION)),
    db: AsyncSession = Depends(get_db),
):
    """Request broker execution based on a recommendation."""
    if request_data.quantity <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Quantity must be greater than zero",
        )

    result = await db.execute(
        select(Recommendation).where(
            Recommendation.id == request_data.recommendation_id,
            Recommendation.user_id == current_user.id,
        )
    )
    recommendation = result.scalar_one_or_none()
    if not recommendation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Recommendation not found",
        )

    result = await db.execute(
        select(Portfolio).where(
            Portfolio.id == request_data.portfolio_id,
            Portfolio.user_id == current_user.id,
        )
    )
    portfolio = result.scalar_one_or_none()
    if not portfolio:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Portfolio not found",
        )

    action_map = {
        "buy": TradeAction.buy,
        "sell": TradeAction.sell,
        "rebalance": TradeAction.rebalance,
    }
    action = action_map.get(recommendation.type.value, TradeAction.buy)

    details = recommendation.details or {}
    symbol = details.get("symbol", "UNKNOWN")
    company_name = details.get("company_name", recommendation.title)
    estimated_price = details.get("current_price", details.get("estimated_price"))
    risk_level = details.get("risk_level")
    growth_outlook = details.get("growth_outlook")

    estimated_total = None
    if estimated_price:
        estimated_total = estimated_price * request_data.quantity

    trade_request = TradeRequest(
        user_id=current_user.id,
        portfolio_id=request_data.portfolio_id,
        recommendation_id=recommendation.id,
        action=action,
        symbol=symbol,
        company_name=company_name,
        quantity=request_data.quantity,
        order_type=request_data.order_type,
        limit_price=request_data.limit_price,
        estimated_price=estimated_price,
        estimated_total=estimated_total,
        risk_level=risk_level,
        growth_outlook=growth_outlook,
        ai_reasoning=recommendation.description,
        user_notes=request_data.user_notes,
        status=TradeRequestStatus.pending,
    )

    db.add(trade_request)
    recommendation.status = "accepted"
    recommendation.acted_at = datetime.utcnow()

    await db.commit()
    await db.refresh(trade_request)

    return TradeRequestResponse.model_validate(trade_request)


@router.get("/{trade_id}", response_model=TradeRequestResponse)
async def get_trade_request(
    trade_id: str,
    current_user: User = Depends(require_subscription(Features.BROKER_EXECUTION)),
    db: AsyncSession = Depends(get_db),
):
    """Get a specific trade request (owner only)."""
    result = await db.execute(
        select(TradeRequest).where(
            TradeRequest.id == trade_id,
            TradeRequest.user_id == current_user.id,
        )
    )
    trade = result.scalar_one_or_none()
    if not trade:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trade request not found")

    return TradeRequestResponse.model_validate(trade)


@router.post("/{trade_id}/cancel", response_model=TradeRequestResponse)
async def cancel_trade_request(
    trade_id: str,
    current_user: User = Depends(require_subscription(Features.BROKER_EXECUTION)),
    db: AsyncSession = Depends(get_db),
):
    """Cancel a pending trade request (owner only)."""
    result = await db.execute(
        select(TradeRequest).where(
            TradeRequest.id == trade_id,
            TradeRequest.user_id == current_user.id,
        )
    )
    trade = result.scalar_one_or_none()
    if not trade:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trade request not found")

    if trade.status != TradeRequestStatus.pending:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot cancel trade with status: {trade.status.value}",
        )

    trade.status = TradeRequestStatus.canceled
    await db.commit()
    await db.refresh(trade)

    return TradeRequestResponse.model_validate(trade)


# ── Broker/Admin-only routes ──────────────────────────────────────────────────

@router.patch("/{trade_id}", response_model=TradeRequestResponse)
async def update_trade_request(
    trade_id: str,
    updates: TradeRequestUpdate,
    current_user: User = Depends(get_current_broker),  # broker or admin ONLY
    db: AsyncSession = Depends(get_db),
):
    """Update a trade request. Restricted to brokers and admins."""
    result = await db.execute(
        select(TradeRequest).where(TradeRequest.id == trade_id)
    )
    trade = result.scalar_one_or_none()
    if not trade:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trade request not found")

    update_data = updates.model_dump(exclude_unset=True)

    if updates.status == TradeRequestStatus.executed:
        update_data["executed_at"] = datetime.utcnow()

    for field, value in update_data.items():
        setattr(trade, field, value)

    await db.commit()
    await db.refresh(trade)

    return TradeRequestResponse.model_validate(trade)


@router.post("/{trade_id}/confirm", response_model=TradeRequestResponse)
async def confirm_trade_execution(
    trade_id: str,
    executed_price: float,
    executed_quantity: Optional[float] = None,
    execution_fees: float = 0.0,
    broker_notes: Optional[str] = None,
    current_user: User = Depends(get_current_broker),  # broker or admin ONLY
    db: AsyncSession = Depends(get_db),
):
    """Confirm trade execution. Restricted to brokers and admins."""
    # Validate financial inputs
    if executed_price <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Executed price must be greater than zero",
        )
    if executed_quantity is not None and executed_quantity <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Executed quantity must be greater than zero",
        )
    if execution_fees < 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Execution fees cannot be negative",
        )

    result = await db.execute(
        select(TradeRequest).where(TradeRequest.id == trade_id)
    )
    trade = result.scalar_one_or_none()
    if not trade:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trade request not found")

    if trade.status not in [TradeRequestStatus.pending, TradeRequestStatus.confirmed]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot execute trade with status: {trade.status.value}",
        )

    trade.status = TradeRequestStatus.executed
    trade.executed_price = executed_price
    trade.executed_quantity = executed_quantity or trade.quantity
    trade.execution_fees = execution_fees
    trade.broker_notes = broker_notes
    trade.executed_at = datetime.utcnow()

    await db.commit()
    await db.refresh(trade)

    return TradeRequestResponse.model_validate(trade)
