from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import Optional

from app.database import get_db
from app.models.user import User
from app.models.fund_request import FundRequest, FundRequestStatus
from app.schemas.fund_request import (
    FundRequestCreate,
    FundRequestResponse,
    FundRequestListResponse,
)
from app.api.deps import get_current_user

router = APIRouter()


@router.post("", response_model=FundRequestResponse, status_code=status.HTTP_201_CREATED)
async def create_fund_request(
    data: FundRequestCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Submit a new fund deposit request."""
    if data.amount <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Amount must be greater than zero",
        )

    # Cap single deposit amount to prevent fraudulent large transactions
    MAX_DEPOSIT = 50_000_000
    if data.amount > MAX_DEPOSIT:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Single deposit cannot exceed {MAX_DEPOSIT:,.0f}. Contact support for large transfers.",
        )

    # Limit concurrent pending requests to prevent abuse
    pending_count_result = await db.execute(
        select(func.count(FundRequest.id)).where(
            FundRequest.user_id == current_user.id,
            FundRequest.status == FundRequestStatus.pending,
        )
    )
    if (pending_count_result.scalar() or 0) >= 3:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You already have 3 pending deposit requests. Please wait for them to be reviewed.",
        )

    fund_request = FundRequest(
        user_id=current_user.id,
        amount=data.amount,
        method=data.method,
        user_notes=data.user_notes,
        status=FundRequestStatus.pending,
    )

    db.add(fund_request)
    await db.commit()
    await db.refresh(fund_request)

    return FundRequestResponse.model_validate(fund_request)


@router.get("", response_model=FundRequestListResponse)
async def list_fund_requests(
    status_filter: Optional[FundRequestStatus] = None,
    limit: int = 50,
    offset: int = 0,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List the current user's fund requests."""
    query = select(FundRequest).where(FundRequest.user_id == current_user.id)

    if status_filter:
        query = query.where(FundRequest.status == status_filter)

    # Counts
    count_base = select(func.count(FundRequest.id)).where(FundRequest.user_id == current_user.id)
    total_result = await db.execute(count_base)
    total_count = total_result.scalar() or 0

    pending_result = await db.execute(
        count_base.where(FundRequest.status == FundRequestStatus.pending)
    )
    pending_count = pending_result.scalar() or 0

    result = await db.execute(
        query.order_by(FundRequest.created_at.desc()).offset(offset).limit(limit)
    )
    requests = result.scalars().all()

    return FundRequestListResponse(
        requests=[FundRequestResponse.model_validate(r) for r in requests],
        total_count=total_count,
        pending_count=pending_count,
    )


@router.get("/{request_id}", response_model=FundRequestResponse)
async def get_fund_request(
    request_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a specific fund request."""
    result = await db.execute(
        select(FundRequest).where(
            FundRequest.id == request_id,
            FundRequest.user_id == current_user.id,
        )
    )
    fund_request = result.scalar_one_or_none()

    if not fund_request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Fund request not found",
        )

    return FundRequestResponse.model_validate(fund_request)


@router.post("/{request_id}/cancel", response_model=FundRequestResponse)
async def cancel_fund_request(
    request_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Cancel a pending fund request."""
    result = await db.execute(
        select(FundRequest).where(
            FundRequest.id == request_id,
            FundRequest.user_id == current_user.id,
        )
    )
    fund_request = result.scalar_one_or_none()

    if not fund_request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Fund request not found",
        )

    if fund_request.status != FundRequestStatus.pending:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot cancel request with status: {fund_request.status.value}",
        )

    fund_request.status = FundRequestStatus.canceled
    await db.commit()
    await db.refresh(fund_request)

    return FundRequestResponse.model_validate(fund_request)
