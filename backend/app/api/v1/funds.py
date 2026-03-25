from fastapi import APIRouter, Depends, HTTPException, status
from typing import Optional
from datetime import datetime

from app.models.user import User
from app.models.fund_request import FundRequest, FundRequestStatus
from app.schemas.fund_request import (
    FundRequestCreate, FundRequestResponse, FundRequestListResponse,
)
from app.api.deps import get_current_user

router = APIRouter()


@router.post("", response_model=FundRequestResponse, status_code=status.HTTP_201_CREATED)
async def create_fund_request(
    data: FundRequestCreate,
    current_user: User = Depends(get_current_user),
):
    if data.amount <= 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Amount must be greater than zero")

    MAX_DEPOSIT = 50_000_000
    if data.amount > MAX_DEPOSIT:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Single deposit cannot exceed {MAX_DEPOSIT:,.0f}. Contact support for large transfers.",
        )

    pending_count = await FundRequest.find(
        FundRequest.user_id == current_user.id,
        FundRequest.status == FundRequestStatus.pending,
    ).count()

    if pending_count >= 3:
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
    await fund_request.insert()

    return FundRequestResponse.model_validate(fund_request)


@router.get("", response_model=FundRequestListResponse)
async def list_fund_requests(
    status_filter: Optional[FundRequestStatus] = None,
    limit: int = 50,
    offset: int = 0,
    current_user: User = Depends(get_current_user),
):
    base_query = FundRequest.find(FundRequest.user_id == current_user.id)
    total_count = await base_query.count()
    pending_count = await FundRequest.find(
        FundRequest.user_id == current_user.id,
        FundRequest.status == FundRequestStatus.pending,
    ).count()

    query = base_query
    if status_filter:
        query = FundRequest.find(
            FundRequest.user_id == current_user.id,
            FundRequest.status == status_filter,
        )

    requests = await query.sort(-FundRequest.created_at).skip(offset).limit(limit).to_list()

    return FundRequestListResponse(
        requests=[FundRequestResponse.model_validate(r) for r in requests],
        total_count=total_count,
        pending_count=pending_count,
    )


@router.get("/{request_id}", response_model=FundRequestResponse)
async def get_fund_request(
    request_id: str,
    current_user: User = Depends(get_current_user),
):
    fund_request = await FundRequest.find_one(
        FundRequest.id == request_id,
        FundRequest.user_id == current_user.id,
    )

    if not fund_request:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Fund request not found")

    return FundRequestResponse.model_validate(fund_request)


@router.post("/{request_id}/cancel", response_model=FundRequestResponse)
async def cancel_fund_request(
    request_id: str,
    current_user: User = Depends(get_current_user),
):
    fund_request = await FundRequest.find_one(
        FundRequest.id == request_id,
        FundRequest.user_id == current_user.id,
    )

    if not fund_request:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Fund request not found")

    if fund_request.status != FundRequestStatus.pending:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot cancel request with status: {fund_request.status.value}",
        )

    fund_request.status = FundRequestStatus.canceled
    await fund_request.save()

    return FundRequestResponse.model_validate(fund_request)
