from fastapi import APIRouter, Depends, HTTPException, status
import uuid
from datetime import datetime

from app.models.user import User
from app.models.subscription import TIER_PRICING, SubscriptionTier
from app.models.payment import Payment, PaymentStatus
from app.schemas.payment import (
    PaymentIntentCreate, PaymentIntentResponse,
    PaymentConfirm, PaymentResponse, PaymentHistoryResponse,
)
from app.api.deps import get_current_user

router = APIRouter()


@router.post("/create-intent", response_model=PaymentIntentResponse)
async def create_payment_intent(
    intent_data: PaymentIntentCreate,
    current_user: User = Depends(get_current_user),
):
    try:
        tier = SubscriptionTier(intent_data.tier)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Invalid tier: {intent_data.tier}")

    pricing = TIER_PRICING[tier]
    amount = pricing["yearly"] if intent_data.billing_period == "yearly" else pricing["monthly"]

    payment_intent_id = f"pi_{uuid.uuid4().hex[:24]}"
    client_secret = f"{payment_intent_id}_secret_{uuid.uuid4().hex[:24]}"

    return PaymentIntentResponse(
        client_secret=client_secret,
        payment_intent_id=payment_intent_id,
        amount=amount / 100,
        currency="USD",
    )


@router.post("/confirm", response_model=PaymentResponse)
async def confirm_payment(
    confirm_data: PaymentConfirm,
    current_user: User = Depends(get_current_user),
):
    existing = await Payment.find_one(
        Payment.stripe_payment_intent_id == confirm_data.payment_intent_id
    )

    if existing:
        return PaymentResponse.model_validate(existing)

    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail="Payment intent not found. Use /subscriptions/subscribe to process payments.",
    )


@router.get("/history", response_model=PaymentHistoryResponse)
async def get_payment_history(
    limit: int = 20,
    offset: int = 0,
    current_user: User = Depends(get_current_user),
):
    all_payments = await Payment.find(Payment.user_id == current_user.id).to_list()
    total_count = len(all_payments)
    total_amount = sum(p.amount for p in all_payments if p.status == PaymentStatus.completed)

    payments = await Payment.find(Payment.user_id == current_user.id).sort(-Payment.created_at).skip(offset).limit(limit).to_list()

    return PaymentHistoryResponse(
        payments=[PaymentResponse.model_validate(p) for p in payments],
        total_count=total_count,
        total_amount=total_amount,
    )


@router.post("/webhook")
async def handle_webhook():
    return {"status": "received", "message": "Webhook processed (mock)"}
