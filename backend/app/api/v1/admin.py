from fastapi import APIRouter, Depends, HTTPException, status, Query
from datetime import datetime, timedelta
from typing import Optional

from app.models.user import User, UserRole, AccountStatus
from app.models.subscription import Subscription, SubscriptionTier, SubscriptionStatus
from app.models.portfolio import Portfolio
from app.models.asset import Asset
from app.models.transaction import Transaction
from app.models.trade_request import TradeRequest, TradeRequestStatus
from app.models.fund_request import FundRequest, FundRequestStatus
from app.schemas.admin import (
    AdminStatsResponse, AdminUserResponse, AdminUserListResponse, AdminUserUpdate,
    AccountReviewRequest,
    AdminFundRequestResponse, AdminFundRequestListResponse,
    AdminTradeResponse, AdminTradeListResponse,
    AdminPortfolioResponse, AdminPortfolioListResponse,
    AdminTransactionResponse, AdminTransactionListResponse,
    TradeExecuteRequest, TradeRejectRequest,
)
from app.schemas.fund_request import FundRequestReview, FundRequestResponse
from app.api.deps import require_role

router = APIRouter()

broker_or_admin = require_role(UserRole.broker, UserRole.admin)


@router.get("/stats", response_model=AdminStatsResponse)
async def get_admin_stats(current_user: User = Depends(broker_or_admin)):
    total_users = await User.find(User.role == UserRole.user).count()
    active_users = await User.find(User.role == UserRole.user, User.is_active == True).count()
    pending_reviews = await User.find(User.account_status == AccountStatus.pending_review).count()
    pending_deposits = await FundRequest.find(FundRequest.status == FundRequestStatus.pending).count()
    pending_trades = await TradeRequest.find(TradeRequest.status == TradeRequestStatus.pending).count()

    approved_funds = await FundRequest.find(FundRequest.status == FundRequestStatus.approved).to_list()
    total_aum = sum(f.amount for f in approved_funds)

    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    total_deposits_today = await FundRequest.find(FundRequest.created_at >= today_start).count()

    return AdminStatsResponse(
        total_users=total_users,
        active_users=active_users,
        pending_reviews=pending_reviews,
        pending_deposits=pending_deposits,
        pending_trades=pending_trades,
        total_aum=total_aum,
        total_deposits_today=total_deposits_today,
    )


@router.get("/users", response_model=AdminUserListResponse)
async def list_users(
    search: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
    current_user: User = Depends(broker_or_admin),
):
    if search:
        import re
        pattern = re.compile(search, re.IGNORECASE)
        all_users = await User.find().to_list()
        filtered = [
            u for u in all_users
            if pattern.search(u.first_name) or pattern.search(u.last_name) or pattern.search(u.email)
        ]
        total_count = len(filtered)
        users = sorted(filtered, key=lambda u: u.created_at, reverse=True)[offset:offset+limit]
    else:
        total_count = await User.find().count()
        users = await User.find().sort(-User.created_at).skip(offset).limit(limit).to_list()

    return AdminUserListResponse(
        users=[AdminUserResponse.model_validate(u) for u in users],
        total_count=total_count,
    )


@router.get("/users/{user_id}", response_model=AdminUserResponse)
async def get_user(user_id: str, current_user: User = Depends(broker_or_admin)):
    user = await User.find_one(User.id == user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return AdminUserResponse.model_validate(user)


@router.patch("/users/{user_id}", response_model=AdminUserResponse)
async def update_user(
    user_id: str,
    updates: AdminUserUpdate,
    current_user: User = Depends(broker_or_admin),
):
    user = await User.find_one(User.id == user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    if user.id == current_user.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot modify your own account")

    if updates.is_active is not None:
        user.is_active = updates.is_active

    if updates.role is not None:
        try:
            user.role = UserRole(updates.role)
        except ValueError:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Invalid role: {updates.role}")

    user.updated_at = datetime.utcnow()
    await user.save()

    return AdminUserResponse.model_validate(user)


@router.post("/users/{user_id}/review", response_model=AdminUserResponse)
async def review_user_account(
    user_id: str,
    review: AccountReviewRequest,
    current_user: User = Depends(broker_or_admin),
):
    user = await User.find_one(User.id == user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    if user.id == current_user.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot review your own account")

    if user.account_status != AccountStatus.pending_review:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Account is already {user.account_status.value}",
        )

    if review.action == "approve":
        user.account_status = AccountStatus.approved
        user.is_active = True

        # Auto-enroll on Free plan if they have no subscription yet
        existing_sub = await Subscription.find_one(Subscription.user_id == user.id)
        if not existing_sub:
            free_sub = Subscription(
                user_id=user.id,
                tier=SubscriptionTier.basic,
                status=SubscriptionStatus.active,
                current_period_start=datetime.utcnow(),
                current_period_end=datetime(2099, 12, 31),  # Free plan never expires
            )
            await free_sub.insert()

    elif review.action == "reject":
        user.account_status = AccountStatus.rejected
        user.is_active = False
    else:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Action must be 'approve' or 'reject'")

    user.updated_at = datetime.utcnow()
    await user.save()

    return AdminUserResponse.model_validate(user)


@router.get("/fund-requests", response_model=AdminFundRequestListResponse)
async def list_fund_requests(
    status_filter: Optional[FundRequestStatus] = None,
    limit: int = 50,
    offset: int = 0,
    current_user: User = Depends(broker_or_admin),
):
    total_count = await FundRequest.find().count()
    pending_count = await FundRequest.find(FundRequest.status == FundRequestStatus.pending).count()

    query = FundRequest.find()
    if status_filter:
        query = FundRequest.find(FundRequest.status == status_filter)

    fund_requests = await query.sort(-FundRequest.created_at).skip(offset).limit(limit).to_list()

    requests = []
    for fr in fund_requests:
        user = await User.find_one(User.id == fr.user_id)
        requests.append(AdminFundRequestResponse(
            id=fr.id,
            user_id=fr.user_id,
            user_name=f"{user.first_name} {user.last_name}" if user else "Unknown",
            user_email=user.email if user else "unknown",
            amount=fr.amount,
            method=fr.method.value,
            status=fr.status.value,
            user_notes=fr.user_notes,
            admin_notes=fr.admin_notes,
            reviewed_by=fr.reviewed_by,
            created_at=fr.created_at,
            reviewed_at=fr.reviewed_at,
        ))

    return AdminFundRequestListResponse(requests=requests, total_count=total_count, pending_count=pending_count)


@router.post("/fund-requests/{request_id}/review", response_model=FundRequestResponse)
async def review_fund_request(
    request_id: str,
    review: FundRequestReview,
    current_user: User = Depends(broker_or_admin),
):
    fund_request = await FundRequest.find_one(FundRequest.id == request_id)
    if not fund_request:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Fund request not found")

    if fund_request.status != FundRequestStatus.pending:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot review request with status: {fund_request.status.value}",
        )

    if review.status not in [FundRequestStatus.approved, FundRequestStatus.rejected]:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Review status must be 'approved' or 'rejected'")

    fund_request.status = review.status
    fund_request.admin_notes = review.admin_notes
    fund_request.reviewed_by = current_user.id
    fund_request.reviewed_at = datetime.utcnow()
    await fund_request.save()

    if review.status == FundRequestStatus.approved:
        portfolio = await Portfolio.find_one(Portfolio.user_id == fund_request.user_id)
        if portfolio:
            transaction = Transaction(
                portfolio_id=portfolio.id,
                type="deposit",
                total_amount=fund_request.amount,
                fees=0,
                notes="Deposit approved by broker",
                executed_at=datetime.utcnow(),
            )
            await transaction.insert()

    return FundRequestResponse.model_validate(fund_request)


@router.get("/trades", response_model=AdminTradeListResponse)
async def list_trades(
    status_filter: Optional[TradeRequestStatus] = None,
    limit: int = 50,
    offset: int = 0,
    current_user: User = Depends(broker_or_admin),
):
    total_count = await TradeRequest.find().count()
    pending_count = await TradeRequest.find(TradeRequest.status == TradeRequestStatus.pending).count()

    query = TradeRequest.find()
    if status_filter:
        query = TradeRequest.find(TradeRequest.status == status_filter)

    trade_requests = await query.sort(-TradeRequest.created_at).skip(offset).limit(limit).to_list()

    trades = []
    for tr in trade_requests:
        user = await User.find_one(User.id == tr.user_id)
        trades.append(AdminTradeResponse(
            id=tr.id,
            user_id=tr.user_id,
            user_name=f"{user.first_name} {user.last_name}" if user else "Unknown",
            user_email=user.email if user else "unknown",
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
        ))

    return AdminTradeListResponse(trades=trades, total_count=total_count, pending_count=pending_count)


@router.post("/trades/{trade_id}/execute")
async def execute_trade(
    trade_id: str,
    data: TradeExecuteRequest,
    current_user: User = Depends(broker_or_admin),
):
    trade = await TradeRequest.find_one(TradeRequest.id == trade_id)
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
    trade.updated_at = datetime.utcnow()
    await trade.save()

    return {"success": True, "message": "Trade executed successfully"}


@router.post("/trades/{trade_id}/reject")
async def reject_trade(
    trade_id: str,
    data: TradeRejectRequest,
    current_user: User = Depends(broker_or_admin),
):
    trade = await TradeRequest.find_one(TradeRequest.id == trade_id)
    if not trade:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trade request not found")

    if trade.status != TradeRequestStatus.pending:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot reject trade with status: {trade.status.value}",
        )

    trade.status = TradeRequestStatus.rejected
    trade.broker_notes = data.broker_notes
    trade.updated_at = datetime.utcnow()
    await trade.save()

    return {"success": True, "message": "Trade rejected"}


@router.get("/portfolios", response_model=AdminPortfolioListResponse)
async def list_portfolios(
    limit: int = 50,
    offset: int = 0,
    current_user: User = Depends(broker_or_admin),
):
    count = await Portfolio.find().count()
    portfolios_list = await Portfolio.find().sort(-Portfolio.created_at).skip(offset).limit(limit).to_list()

    portfolios = []
    for p in portfolios_list:
        user = await User.find_one(User.id == p.user_id)
        portfolios.append(AdminPortfolioResponse(
            id=p.id,
            user_id=p.user_id,
            user_name=f"{user.first_name} {user.last_name}" if user else "Unknown",
            user_email=user.email if user else "unknown",
            name=p.name,
            type=p.type,
            currency=p.currency,
            total_value=None,
            created_at=p.created_at,
        ))

    return AdminPortfolioListResponse(portfolios=portfolios, total_count=count)


@router.get("/transactions", response_model=AdminTransactionListResponse)
async def list_transactions(
    limit: int = 50,
    offset: int = 0,
    current_user: User = Depends(broker_or_admin),
):
    count = await Transaction.find().count()
    transactions_list = await Transaction.find().sort(-Transaction.executed_at).skip(offset).limit(limit).to_list()

    transactions = []
    for tx in transactions_list:
        portfolio = await Portfolio.find_one(Portfolio.id == tx.portfolio_id)
        user = None
        if portfolio:
            user = await User.find_one(User.id == portfolio.user_id)

        transactions.append(AdminTransactionResponse(
            id=tx.id,
            portfolio_id=tx.portfolio_id,
            user_name=f"{user.first_name} {user.last_name}" if user else "Unknown",
            type=tx.type.value if hasattr(tx.type, 'value') else tx.type,
            symbol=tx.symbol,
            quantity=tx.quantity,
            price=tx.price,
            total_amount=tx.total_amount,
            executed_at=tx.executed_at,
        ))

    return AdminTransactionListResponse(transactions=transactions, total_count=count)
