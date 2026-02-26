from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime
import uuid

from app.database import get_db
from app.models.user import User
from app.models.subscription import TIER_PRICING, SubscriptionTier
from app.models.payment import Payment, PaymentStatus
from app.schemas.payment import (
    PaymentIntentCreate,
    PaymentIntentResponse,
    PaymentConfirm,
    PaymentResponse,
    PaymentHistoryResponse,
)
from app.api.deps import get_current_user

router = APIRouter()


@router.post("/create-intent", response_model=PaymentIntentResponse)
async def create_payment_intent(
    intent_data: PaymentIntentCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Create a payment intent for subscription.
    This is a mock implementation - in production, this would call Stripe API.
    """
    # Validate tier
    try:
        tier = SubscriptionTier(intent_data.tier)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid tier: {intent_data.tier}",
        )

    # Get pricing
    pricing = TIER_PRICING[tier]
    amount = pricing["yearly"] if intent_data.billing_period == "yearly" else pricing["monthly"]

    # Generate mock payment intent
    payment_intent_id = f"pi_{uuid.uuid4().hex[:24]}"
    client_secret = f"{payment_intent_id}_secret_{uuid.uuid4().hex[:24]}"

    return PaymentIntentResponse(
        client_secret=client_secret,
        payment_intent_id=payment_intent_id,
        amount=amount / 100,  # Convert cents to dollars
        currency="USD",
    )


@router.post("/confirm", response_model=PaymentResponse)
async def confirm_payment(
    confirm_data: PaymentConfirm,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Confirm a payment.
    This is a mock implementation - in production, this would verify with Stripe.
    """
    # In a real implementation, we would verify the payment with Stripe
    # For mock purposes, we'll just return success

    # Check if payment already exists
    result = await db.execute(
        select(Payment).where(
            Payment.stripe_payment_intent_id == confirm_data.payment_intent_id
        )
    )
    existing = result.scalar_one_or_none()

    if existing:
        return PaymentResponse.model_validate(existing)

    # For mock, we can't create a payment without subscription context
    # This endpoint is mainly for webhook processing in real implementation
    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail="Payment intent not found. Use /subscriptions/subscribe to process payments.",
    )


@router.get("/history", response_model=PaymentHistoryResponse)
async def get_payment_history(
    limit: int = 20,
    offset: int = 0,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get payment history for the current user."""
    # Get total count
    result = await db.execute(
        select(Payment).where(Payment.user_id == current_user.id)
    )
    all_payments = result.scalars().all()
    total_count = len(all_payments)
    total_amount = sum(p.amount for p in all_payments if p.status == PaymentStatus.completed)

    # Get paginated results
    result = await db.execute(
        select(Payment)
        .where(Payment.user_id == current_user.id)
        .order_by(Payment.created_at.desc())
        .offset(offset)
        .limit(limit)
    )
    payments = result.scalars().all()

    return PaymentHistoryResponse(
        payments=[PaymentResponse.model_validate(p) for p in payments],
        total_count=total_count,
        total_amount=total_amount,
    )


@router.post("/webhook")
async def handle_webhook(
    db: AsyncSession = Depends(get_db),
):
    """
    Handle Stripe webhook events.
    This is a mock implementation - in production, this would verify and process webhook events.
    """
    # In production:
    # 1. Verify webhook signature
    # 2. Parse event type
    # 3. Handle different event types:
    #    - payment_intent.succeeded
    #    - invoice.paid
    #    - customer.subscription.updated
    #    - customer.subscription.deleted
    #    etc.

    return {"status": "received", "message": "Webhook processed (mock)"}
