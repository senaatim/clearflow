from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_
from datetime import datetime, timedelta
from typing import Optional

from app.database import get_db
from app.models.user import User, UserRole
from app.models.portfolio import Portfolio
from app.models.asset import Asset
from app.models.transaction import Transaction
from app.models.trade_request import TradeRequest, TradeRequestStatus
from app.models.fund_request import FundRequest, FundRequestStatus
from app.schemas.admin import (
    AdminStatsResponse,
    AdminUserResponse,
    AdminUserListResponse,
    AdminUserUpdate,
    AdminFundRequestResponse,
    AdminFundRequestListResponse,
    AdminTradeResponse,
    AdminTradeListResponse,
    AdminPortfolioResponse,
    AdminPortfolioListResponse,
    AdminTransactionResponse,
    AdminTransactionListResponse,
    TradeExecuteRequest,
    TradeRejectRequest,
)
from app.schemas.fund_request import FundRequestReview, FundRequestResponse
from app.api.deps import require_role

router = APIRouter()

broker_or_admin = require_role(UserRole.broker, UserRole.admin)


# ── Dashboard Stats ──────────────────────────────────────────────────────────

@router.get("/stats", response_model=AdminStatsResponse)
async def get_admin_stats(
    current_user: User = Depends(broker_or_admin),
    db: AsyncSession = Depends(get_db),
):
    """Get overview statistics for the admin dashboard."""
    total_users = (await db.execute(
        select(func.count(User.id)).where(User.role == UserRole.user)
    )).scalar() or 0

    active_users = (await db.execute(
        select(func.count(User.id)).where(User.role == UserRole.user, User.is_active == True)
    )).scalar() or 0

    pending_deposits = (await db.execute(
        select(func.count(FundRequest.id)).where(FundRequest.status == FundRequestStatus.pending)
    )).scalar() or 0

    pending_trades = (await db.execute(
        select(func.count(TradeRequest.id)).where(TradeRequest.status == TradeRequestStatus.pending)
    )).scalar() or 0

    total_aum = (await db.execute(
        select(func.sum(FundRequest.amount)).where(FundRequest.status == FundRequestStatus.approved)
    )).scalar() or 0.0

    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    total_deposits_today = (await db.execute(
        select(func.count(FundRequest.id)).where(
            FundRequest.created_at >= today_start
        )
    )).scalar() or 0

    return AdminStatsResponse(
        total_users=total_users,
        active_users=active_users,
        pending_deposits=pending_deposits,
        pending_trades=pending_trades,
        total_aum=total_aum,
        total_deposits_today=total_deposits_today,
    )


# ── User Management ──────────────────────────────────────────────────────────

@router.get("/users", response_model=AdminUserListResponse)
async def list_users(
    search: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
    current_user: User = Depends(broker_or_admin),
    db: AsyncSession = Depends(get_db),
):
    """List all users with optional search."""
    query = select(User)

    if search:
        search_term = f"%{search}%"
        query = query.where(
            or_(
                User.first_name.ilike(search_term),
                User.last_name.ilike(search_term),
                User.email.ilike(search_term),
            )
        )

    count_query = select(func.count()).select_from(query.subquery())
    total_count = (await db.execute(count_query)).scalar() or 0

    result = await db.execute(
        query.order_by(User.created_at.desc()).offset(offset).limit(limit)
    )
    users = result.scalars().all()

    return AdminUserListResponse(
        users=[AdminUserResponse.model_validate(u) for u in users],
        total_count=total_count,
    )


@router.get("/users/{user_id}", response_model=AdminUserResponse)
async def get_user(
    user_id: str,
    current_user: User = Depends(broker_or_admin),
    db: AsyncSession = Depends(get_db),
):
    """Get a specific user's details."""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    return AdminUserResponse.model_validate(user)


@router.patch("/users/{user_id}", response_model=AdminUserResponse)
async def update_user(
    user_id: str,
    updates: AdminUserUpdate,
    current_user: User = Depends(broker_or_admin),
    db: AsyncSession = Depends(get_db),
):
    """Update a user's active status or role."""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    if user.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot modify your own account",
        )

    if updates.is_active is not None:
        user.is_active = updates.is_active

    if updates.role is not None:
        try:
            user.role = UserRole(updates.role)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid role: {updates.role}",
            )

    await db.commit()
    await db.refresh(user)

    return AdminUserResponse.model_validate(user)


# ── Fund Request Management ──────────────────────────────────────────────────

@router.get("/fund-requests", response_model=AdminFundRequestListResponse)
async def list_fund_requests(
    status_filter: Optional[FundRequestStatus] = None,
    limit: int = 50,
    offset: int = 0,
    current_user: User = Depends(broker_or_admin),
    db: AsyncSession = Depends(get_db),
):
    """List all fund requests across users."""
    query = select(FundRequest, User).join(User, FundRequest.user_id == User.id)

    if status_filter:
        query = query.where(FundRequest.status == status_filter)

    # Counts
    count_base = select(func.count(FundRequest.id))
    total_count = (await db.execute(count_base)).scalar() or 0
    pending_count = (await db.execute(
        count_base.where(FundRequest.status == FundRequestStatus.pending)
    )).scalar() or 0

    result = await db.execute(
        query.order_by(FundRequest.created_at.desc()).offset(offset).limit(limit)
    )
    rows = result.all()

    requests = [
        AdminFundRequestResponse(
            id=fr.id,
            user_id=fr.user_id,
            user_name=f"{user.first_name} {user.last_name}",
            user_email=user.email,
            amount=fr.amount,
            method=fr.method.value,
            status=fr.status.value,
            user_notes=fr.user_notes,
            admin_notes=fr.admin_notes,
            reviewed_by=fr.reviewed_by,
            created_at=fr.created_at,
            reviewed_at=fr.reviewed_at,
        )
        for fr, user in rows
    ]

    return AdminFundRequestListResponse(
        requests=requests,
        total_count=total_count,
        pending_count=pending_count,
    )


@router.post("/fund-requests/{request_id}/review", response_model=FundRequestResponse)
async def review_fund_request(
    request_id: str,
    review: FundRequestReview,
    current_user: User = Depends(broker_or_admin),
    db: AsyncSession = Depends(get_db),
):
    """Approve or reject a fund request."""
    result = await db.execute(
        select(FundRequest).where(FundRequest.id == request_id)
    )
    fund_request = result.scalar_one_or_none()

    if not fund_request:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Fund request not found")

    if fund_request.status != FundRequestStatus.pending:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot review request with status: {fund_request.status.value}",
        )

    if review.status not in [FundRequestStatus.approved, FundRequestStatus.rejected]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Review status must be 'approved' or 'rejected'",
        )

    fund_request.status = review.status
    fund_request.admin_notes = review.admin_notes
    fund_request.reviewed_by = current_user.id
    fund_request.reviewed_at = datetime.utcnow()

    # If approved, create a deposit transaction in the user's first portfolio
    if review.status == FundRequestStatus.approved:
        portfolio_result = await db.execute(
            select(Portfolio).where(Portfolio.user_id == fund_request.user_id).limit(1)
        )
        portfolio = portfolio_result.scalar_one_or_none()

        if portfolio:
            transaction = Transaction(
                portfolio_id=portfolio.id,
                type="deposit",
                total_amount=fund_request.amount,
                fees=0,
                notes=f"Deposit approved by broker",
                executed_at=datetime.utcnow(),
            )
            db.add(transaction)

    await db.commit()
    await db.refresh(fund_request)

    return FundRequestResponse.model_validate(fund_request)


# ── Trade Management ─────────────────────────────────────────────────────────

@router.get("/trades", response_model=AdminTradeListResponse)
async def list_trades(
    status_filter: Optional[TradeRequestStatus] = None,
    limit: int = 50,
    offset: int = 0,
    current_user: User = Depends(broker_or_admin),
    db: AsyncSession = Depends(get_db),
):
    """List all trade requests across users."""
    query = select(TradeRequest, User).join(User, TradeRequest.user_id == User.id)

    if status_filter:
        query = query.where(TradeRequest.status == status_filter)

    count_base = select(func.count(TradeRequest.id))
    total_count = (await db.execute(count_base)).scalar() or 0
    pending_count = (await db.execute(
        count_base.where(TradeRequest.status == TradeRequestStatus.pending)
    )).scalar() or 0

    result = await db.execute(
        query.order_by(TradeRequest.created_at.desc()).offset(offset).limit(limit)
    )
    rows = result.all()

    trades = [
        AdminTradeResponse(
            id=tr.id,
            user_id=tr.user_id,
            user_name=f"{user.first_name} {user.last_name}",
            user_email=user.email,
            portfolio_id=tr.portfolio_id,
            action=tr.action.value,
            symbol=tr.symbol,
            company_name=tr.company_name,
            quantity=tr.quantity,
            order_type=tr.order_type.value,
            estimated_price=tr.estimated_price,
            estimated_total=tr.estimated_total,
            status=tr.status.value,
            broker_notes=tr.broker_notes,
            executed_price=tr.executed_price,
            executed_quantity=tr.executed_quantity,
            execution_fees=tr.execution_fees,
            created_at=tr.created_at,
            executed_at=tr.executed_at,
        )
        for tr, user in rows
    ]

    return AdminTradeListResponse(
        trades=trades,
        total_count=total_count,
        pending_count=pending_count,
    )


@router.post("/trades/{trade_id}/execute")
async def execute_trade(
    trade_id: str,
    data: TradeExecuteRequest,
    current_user: User = Depends(broker_or_admin),
    db: AsyncSession = Depends(get_db),
):
    """Execute a pending trade request."""
    result = await db.execute(
        select(TradeRequest).where(TradeRequest.id == trade_id)
    )
    trade = result.scalar_one_or_none()

    if not trade:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trade request not found")

    if trade.status != TradeRequestStatus.pending:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot execute trade with status: {trade.status.value}",
        )

    trade.status = TradeRequestStatus.executed
    trade.executed_price = data.executed_price
    trade.executed_quantity = data.executed_quantity or trade.quantity
    trade.execution_fees = data.execution_fees
    trade.broker_notes = data.broker_notes
    trade.executed_at = datetime.utcnow()

    await db.commit()
    await db.refresh(trade)

    return {"success": True, "message": "Trade executed successfully"}


@router.post("/trades/{trade_id}/reject")
async def reject_trade(
    trade_id: str,
    data: TradeRejectRequest,
    current_user: User = Depends(broker_or_admin),
    db: AsyncSession = Depends(get_db),
):
    """Reject a pending trade request."""
    result = await db.execute(
        select(TradeRequest).where(TradeRequest.id == trade_id)
    )
    trade = result.scalar_one_or_none()

    if not trade:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trade request not found")

    if trade.status != TradeRequestStatus.pending:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot reject trade with status: {trade.status.value}",
        )

    trade.status = TradeRequestStatus.rejected
    trade.broker_notes = data.broker_notes

    await db.commit()

    return {"success": True, "message": "Trade rejected"}


# ── Portfolios & Transactions ────────────────────────────────────────────────

@router.get("/portfolios", response_model=AdminPortfolioListResponse)
async def list_portfolios(
    limit: int = 50,
    offset: int = 0,
    current_user: User = Depends(broker_or_admin),
    db: AsyncSession = Depends(get_db),
):
    """List all portfolios across users."""
    count = (await db.execute(select(func.count(Portfolio.id)))).scalar() or 0

    result = await db.execute(
        select(Portfolio, User)
        .join(User, Portfolio.user_id == User.id)
        .order_by(Portfolio.created_at.desc())
        .offset(offset).limit(limit)
    )
    rows = result.all()

    portfolios = [
        AdminPortfolioResponse(
            id=p.id,
            user_id=p.user_id,
            user_name=f"{user.first_name} {user.last_name}",
            user_email=user.email,
            name=p.name,
            type=p.type,
            currency=p.currency,
            total_value=p.total_value if hasattr(p, 'total_value') else None,
            created_at=p.created_at,
        )
        for p, user in rows
    ]

    return AdminPortfolioListResponse(portfolios=portfolios, total_count=count)


@router.get("/transactions", response_model=AdminTransactionListResponse)
async def list_transactions(
    limit: int = 50,
    offset: int = 0,
    current_user: User = Depends(broker_or_admin),
    db: AsyncSession = Depends(get_db),
):
    """List all transactions across users."""
    count = (await db.execute(select(func.count(Transaction.id)))).scalar() or 0

    result = await db.execute(
        select(Transaction, Portfolio, User)
        .join(Portfolio, Transaction.portfolio_id == Portfolio.id)
        .join(User, Portfolio.user_id == User.id)
        .order_by(Transaction.executed_at.desc())
        .offset(offset).limit(limit)
    )
    rows = result.all()

    transactions = [
        AdminTransactionResponse(
            id=tx.id,
            portfolio_id=tx.portfolio_id,
            user_name=f"{user.first_name} {user.last_name}",
            type=tx.type.value if hasattr(tx.type, 'value') else tx.type,
            symbol=tx.symbol,
            quantity=tx.quantity,
            price=tx.price,
            total_amount=tx.total_amount,
            executed_at=tx.executed_at,
        )
        for tx, portfolio, user in rows
    ]

    return AdminTransactionListResponse(transactions=transactions, total_count=count)
