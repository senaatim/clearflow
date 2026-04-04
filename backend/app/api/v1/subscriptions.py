from fastapi import APIRouter, Depends, HTTPException, status
from datetime import datetime, timedelta

from app.models.user import User
from app.models.subscription import (
    Subscription, SubscriptionTier, SubscriptionStatus,
    TIER_FEATURES, TIER_PRICING,
)
from app.models.payment import Payment, PaymentStatus
from app.schemas.subscription import (
    SubscriptionCreate, SubscriptionUpgrade, SubscriptionResponse,
    SubscriptionWithFeatures, TierInfo, TierFeature, TiersResponse,
    SubscriptionInvoice, InvoicesResponse,
)
from app.api.deps import get_current_user
from app.middleware.subscription import get_user_subscription

router = APIRouter()

FEATURE_DESCRIPTIONS = {
    "news_feed": "Daily financial news with AI sentiment analysis",
    "basic_screener": "Screen stocks by sector and name",
    "health_cards": "Company Health Cards with key financial metrics",
    "full_screener": "Advanced screener with P/E, dividend, growth & risk filters",
    "portfolio_tracking": "Track and manage your investment portfolios",
    "basic_recommendations": "AI-powered investment recommendations",
    "basic_analytics": "Basic portfolio performance analytics",
    "market_summaries": "Weekly market and sector summaries",
    "portfolio_builder": "Build and optimize multi-asset portfolios",
    "behaviour_tools": "Investor behaviour analytics and bias detection",
    "earnings_decoder": "Plain-English earnings report summaries",
    "ngx_module": "NGX market data, top movers & index tracker",
    "dcf_models": "Discounted Cash Flow valuation models",
    "macro_dashboard": "Macroeconomic indicators and impact analysis",
    "full_portfolio_analytics": "Advanced attribution, correlation & stress testing",
    "priority_alerts": "Real-time price and news alerts",
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
async def get_current_subscription(current_user: User = Depends(get_current_user)):
    from app.models.user import UserRole
    subscription = await get_user_subscription(current_user.id)

    if not subscription:
        if current_user.role in (UserRole.admin, UserRole.broker):
            # Admins/brokers get a synthetic premium subscription
            now = datetime.utcnow()
            return SubscriptionWithFeatures(
                id="admin-premium",
                user_id=current_user.id,
                tier=SubscriptionTier.premium,
                status=SubscriptionStatus.active,
                current_period_start=now,
                current_period_end=now.replace(year=now.year + 10),
                canceled_at=None,
                cancel_at_period_end=False,
                created_at=now,
                updated_at=now,
                features=TIER_FEATURES[SubscriptionTier.premium],
                tier_name="Premium (Admin)",
                can_upgrade=False,
                can_downgrade=False,
            )
        return None

    tier_pricing = TIER_PRICING[subscription.tier]
    tier_features = TIER_FEATURES[subscription.tier]
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
):
    existing = await get_user_subscription(current_user.id)
    if existing and existing.status == SubscriptionStatus.active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You already have an active subscription. Use upgrade endpoint to change plans.",
        )

    period_days = 365 if subscription_data.billing_period == "yearly" else 30
    period_start = datetime.utcnow()
    period_end = period_start + timedelta(days=period_days)

    pricing = TIER_PRICING[subscription_data.tier]
    amount = pricing["yearly"] if subscription_data.billing_period == "yearly" else pricing["monthly"]

    if existing:
        existing.tier = subscription_data.tier
        existing.status = SubscriptionStatus.active
        existing.current_period_start = period_start
        existing.current_period_end = period_end
        existing.canceled_at = None
        existing.cancel_at_period_end = False
        existing.updated_at = datetime.utcnow()
        await existing.save()
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
        await subscription.insert()

    payment = Payment(
        user_id=current_user.id,
        subscription_id=subscription.id,
        amount=amount / 100,
        currency="NGN",
        status=PaymentStatus.completed,
        description=f"{pricing['name']} Plan - {subscription_data.billing_period.capitalize()} Subscription",
        stripe_payment_intent_id=f"mock_pi_{subscription.id[:8]}",
        completed_at=datetime.utcnow(),
    )
    await payment.insert()

    return SubscriptionResponse.model_validate(subscription)


@router.post("/upgrade", response_model=SubscriptionResponse)
async def upgrade_subscription(
    upgrade_data: SubscriptionUpgrade,
    current_user: User = Depends(get_current_user),
):
    from app.models.user import UserRole
    subscription = await get_user_subscription(current_user.id)

    if not subscription:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No subscription found. Please subscribe first.")

    is_admin = current_user.role in (UserRole.admin, UserRole.broker)

    if not is_admin:
        tier_order = [SubscriptionTier.basic, SubscriptionTier.pro, SubscriptionTier.premium]
        current_idx = tier_order.index(subscription.tier)
        new_idx = tier_order.index(upgrade_data.tier)

        if new_idx <= current_idx:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="New tier must be higher than current tier. Use downgrade endpoint for lower tiers.",
            )

    subscription.tier = upgrade_data.tier
    subscription.status = SubscriptionStatus.active
    subscription.updated_at = datetime.utcnow()
    await subscription.save()

    pricing = TIER_PRICING[upgrade_data.tier]
    payment = Payment(
        user_id=current_user.id,
        subscription_id=subscription.id,
        amount=pricing["monthly"] / 100,
        currency="NGN",
        status=PaymentStatus.completed,
        description=f"Upgrade to {pricing['name']} Plan",
        stripe_payment_intent_id=f"mock_pi_upgrade_{subscription.id[:8]}",
        completed_at=datetime.utcnow(),
    )
    await payment.insert()

    return SubscriptionResponse.model_validate(subscription)


@router.post("/cancel", response_model=SubscriptionResponse)
async def cancel_subscription(current_user: User = Depends(get_current_user)):
    subscription = await get_user_subscription(current_user.id)

    if not subscription:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No subscription found.")

    if subscription.status != SubscriptionStatus.active:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Subscription is not active.")

    subscription.cancel_at_period_end = True
    subscription.canceled_at = datetime.utcnow()
    subscription.updated_at = datetime.utcnow()
    await subscription.save()

    return SubscriptionResponse.model_validate(subscription)


@router.post("/reactivate", response_model=SubscriptionResponse)
async def reactivate_subscription(current_user: User = Depends(get_current_user)):
    subscription = await get_user_subscription(current_user.id)

    if not subscription:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No subscription found.")

    if not subscription.cancel_at_period_end:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Subscription is not scheduled for cancellation.")

    subscription.cancel_at_period_end = False
    subscription.canceled_at = None
    subscription.updated_at = datetime.utcnow()
    await subscription.save()

    return SubscriptionResponse.model_validate(subscription)


@router.get("/invoices", response_model=InvoicesResponse)
async def get_invoices(current_user: User = Depends(get_current_user)):
    payments = await Payment.find(Payment.user_id == current_user.id).sort(-Payment.created_at).to_list()

    invoices = [
        SubscriptionInvoice(
            id=p.id,
            amount=p.amount,
            currency=p.currency,
            status=p.status.value,
            description=p.description or "Subscription Payment",
            created_at=p.created_at,
        )
        for p in payments
    ]

    return InvoicesResponse(invoices=invoices, total_count=len(invoices))
