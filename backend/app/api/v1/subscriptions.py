from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, timedelta

from app.database import get_db
from app.models.user import User
from app.models.subscription import (
    Subscription,
    SubscriptionTier,
    SubscriptionStatus,
    TIER_FEATURES,
    TIER_PRICING,
)
from app.models.payment import Payment, PaymentStatus
from app.schemas.subscription import (
    SubscriptionCreate,
    SubscriptionUpgrade,
    SubscriptionResponse,
    SubscriptionWithFeatures,
    TierInfo,
    TierFeature,
    TiersResponse,
    SubscriptionInvoice,
    InvoicesResponse,
)
from app.api.deps import get_current_user
from app.middleware.subscription import get_user_subscription

router = APIRouter()


# Feature descriptions for display
FEATURE_DESCRIPTIONS = {
    "portfolio_tracking": "Track and manage your investment portfolios",
    "basic_recommendations": "AI-powered investment recommendations",
    "basic_analytics": "Basic portfolio performance analytics",
    "market_summaries": "Weekly market and sector summaries",
    "advanced_analytics": "Advanced analytics with predictions and correlations",
    "tax_optimization": "Tax-loss harvesting and optimization suggestions",
    "downloadable_reports": "Generate and download detailed PDF reports",
    "weekly_digest": "Personalized weekly investment digest emails",
    "broker_execution": "Request broker-assisted trade execution",
    "robo_advisor": "AI-powered portfolio rebalancing recommendations",
    "api_access": "API access for custom integrations",
    "priority_support": "Priority customer support",
}


@router.get("/tiers", response_model=TiersResponse)
async def get_subscription_tiers():
    """Get available subscription tiers with features and pricing."""
    all_features = set()
    for features in TIER_FEATURES.values():
        all_features.update(features)

    tiers = []
    for tier in [SubscriptionTier.basic, SubscriptionTier.pro, SubscriptionTier.premium]:
        pricing = TIER_PRICING[tier]
        tier_features = TIER_FEATURES[tier]

        features = [
            TierFeature(
                name=feature.replace("_", " ").title(),
                description=FEATURE_DESCRIPTIONS.get(feature, ""),
                included=feature in tier_features,
            )
            for feature in all_features
        ]

        # Sort features: included first, then alphabetically
        features.sort(key=lambda f: (not f.included, f.name))

        tiers.append(TierInfo(
            tier=tier,
            name=pricing["name"],
            description=pricing["description"],
            monthly_price=pricing["monthly"] / 100,
            yearly_price=pricing["yearly"] / 100,
            features=features,
            popular=tier == SubscriptionTier.pro,
        ))

    return TiersResponse(tiers=tiers)


@router.get("/current", response_model=SubscriptionWithFeatures | None)
async def get_current_subscription(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get the current user's subscription."""
    subscription = await get_user_subscription(db, current_user.id)

    if not subscription:
        return None

    tier_pricing = TIER_PRICING[subscription.tier]
    tier_features = TIER_FEATURES[subscription.tier]

    # Determine upgrade/downgrade options
    tier_order = [SubscriptionTier.basic, SubscriptionTier.pro, SubscriptionTier.premium]
    current_idx = tier_order.index(subscription.tier)

    return SubscriptionWithFeatures(
        id=subscription.id,
        user_id=subscription.user_id,
        tier=subscription.tier,
        status=subscription.status,
        current_period_start=subscription.current_period_start,
        current_period_end=subscription.current_period_end,
        canceled_at=subscription.canceled_at,
        cancel_at_period_end=subscription.cancel_at_period_end,
        created_at=subscription.created_at,
        updated_at=subscription.updated_at,
        features=tier_features,
        tier_name=tier_pricing["name"],
        can_upgrade=current_idx < len(tier_order) - 1,
        can_downgrade=current_idx > 0,
    )


@router.post("/subscribe", response_model=SubscriptionResponse, status_code=status.HTTP_201_CREATED)
async def create_subscription(
    subscription_data: SubscriptionCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new subscription (mock payment)."""
    # Check if user already has a subscription
    existing = await get_user_subscription(db, current_user.id)
    if existing and existing.status == SubscriptionStatus.active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You already have an active subscription. Use upgrade endpoint to change plans.",
        )

    # Calculate billing period
    period_days = 365 if subscription_data.billing_period == "yearly" else 30
    period_start = datetime.utcnow()
    period_end = period_start + timedelta(days=period_days)

    # Get pricing
    pricing = TIER_PRICING[subscription_data.tier]
    amount = pricing["yearly"] if subscription_data.billing_period == "yearly" else pricing["monthly"]

    # Create or update subscription
    if existing:
        existing.tier = subscription_data.tier
        existing.status = SubscriptionStatus.active
        existing.current_period_start = period_start
        existing.current_period_end = period_end
        existing.canceled_at = None
        existing.cancel_at_period_end = False
        subscription = existing
    else:
        subscription = Subscription(
            user_id=current_user.id,
            tier=subscription_data.tier,
            status=SubscriptionStatus.active,
            current_period_start=period_start,
            current_period_end=period_end,
            stripe_customer_id=f"mock_cus_{current_user.id[:8]}",
            stripe_subscription_id=f"mock_sub_{subscription_data.tier.value}",
        )
        db.add(subscription)

    await db.flush()

    # Create payment record
    payment = Payment(
        user_id=current_user.id,
        subscription_id=subscription.id,
        amount=amount / 100,  # Convert cents to dollars
        currency="USD",
        status=PaymentStatus.completed,
        description=f"{pricing['name']} Plan - {subscription_data.billing_period.capitalize()} Subscription",
        stripe_payment_intent_id=f"mock_pi_{subscription.id[:8]}",
        completed_at=datetime.utcnow(),
    )
    db.add(payment)

    await db.commit()
    await db.refresh(subscription)

    return SubscriptionResponse.model_validate(subscription)


@router.post("/upgrade", response_model=SubscriptionResponse)
async def upgrade_subscription(
    upgrade_data: SubscriptionUpgrade,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Upgrade subscription to a higher tier."""
    subscription = await get_user_subscription(db, current_user.id)

    if not subscription:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No subscription found. Please subscribe first.",
        )

    tier_order = [SubscriptionTier.basic, SubscriptionTier.pro, SubscriptionTier.premium]
    current_idx = tier_order.index(subscription.tier)
    new_idx = tier_order.index(upgrade_data.tier)

    if new_idx <= current_idx:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New tier must be higher than current tier. Use downgrade endpoint for lower tiers.",
        )

    # Update subscription
    subscription.tier = upgrade_data.tier
    subscription.status = SubscriptionStatus.active

    # Record upgrade payment (prorated in real system)
    pricing = TIER_PRICING[upgrade_data.tier]
    payment = Payment(
        user_id=current_user.id,
        subscription_id=subscription.id,
        amount=pricing["monthly"] / 100,
        currency="USD",
        status=PaymentStatus.completed,
        description=f"Upgrade to {pricing['name']} Plan",
        stripe_payment_intent_id=f"mock_pi_upgrade_{subscription.id[:8]}",
        completed_at=datetime.utcnow(),
    )
    db.add(payment)

    await db.commit()
    await db.refresh(subscription)

    return SubscriptionResponse.model_validate(subscription)


@router.post("/cancel", response_model=SubscriptionResponse)
async def cancel_subscription(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Cancel subscription at period end."""
    subscription = await get_user_subscription(db, current_user.id)

    if not subscription:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No subscription found.",
        )

    if subscription.status != SubscriptionStatus.active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Subscription is not active.",
        )

    subscription.cancel_at_period_end = True
    subscription.canceled_at = datetime.utcnow()

    await db.commit()
    await db.refresh(subscription)

    return SubscriptionResponse.model_validate(subscription)


@router.post("/reactivate", response_model=SubscriptionResponse)
async def reactivate_subscription(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Reactivate a canceled subscription before it expires."""
    subscription = await get_user_subscription(db, current_user.id)

    if not subscription:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No subscription found.",
        )

    if not subscription.cancel_at_period_end:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Subscription is not scheduled for cancellation.",
        )

    subscription.cancel_at_period_end = False
    subscription.canceled_at = None

    await db.commit()
    await db.refresh(subscription)

    return SubscriptionResponse.model_validate(subscription)


@router.get("/invoices", response_model=InvoicesResponse)
async def get_invoices(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get payment history for the current user."""
    result = await db.execute(
        select(Payment)
        .where(Payment.user_id == current_user.id)
        .order_by(Payment.created_at.desc())
    )
    payments = result.scalars().all()

    invoices = [
        SubscriptionInvoice(
            id=payment.id,
            amount=payment.amount,
            currency=payment.currency,
            status=payment.status.value,
            description=payment.description or "Subscription Payment",
            created_at=payment.created_at,
        )
        for payment in payments
    ]

    return InvoicesResponse(
        invoices=invoices,
        total_count=len(invoices),
    )
