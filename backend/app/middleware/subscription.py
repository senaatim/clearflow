from fastapi import Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime

from app.database import get_db
from app.models.user import User
from app.models.subscription import Subscription, SubscriptionTier, SubscriptionStatus, tier_has_feature
from app.api.deps import get_current_user


async def get_user_subscription(
    db: AsyncSession,
    user_id: str,
) -> Subscription | None:
    """Get the subscription for a user."""
    result = await db.execute(
        select(Subscription).where(Subscription.user_id == user_id)
    )
    return result.scalar_one_or_none()


async def require_active_subscription(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> User:
    """Require an active subscription to access the endpoint."""
    subscription = await get_user_subscription(db, current_user.id)

    if not subscription:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Active subscription required. Please subscribe to access this feature.",
        )

    if subscription.status != SubscriptionStatus.active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Your subscription is {subscription.status.value}. Please renew to continue.",
        )

    if datetime.utcnow() > subscription.current_period_end:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your subscription has expired. Please renew to continue.",
        )

    return current_user


def require_subscription(feature: str):
    """
    Dependency factory that checks if a user's subscription tier has access to a specific feature.

    Usage:
        @router.get("/advanced-analytics")
        async def get_advanced_analytics(
            current_user: User = Depends(require_subscription("advanced_analytics")),
            ...
        ):
    """
    async def check_subscription(
        current_user: User = Depends(get_current_user),
        db: AsyncSession = Depends(get_db),
    ) -> User:
        subscription = await get_user_subscription(db, current_user.id)

        if not subscription:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Active subscription required. Please subscribe to access this feature.",
            )

        if subscription.status != SubscriptionStatus.active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Your subscription is {subscription.status.value}. Please renew to continue.",
            )

        if datetime.utcnow() > subscription.current_period_end:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Your subscription has expired. Please renew to continue.",
            )

        if not tier_has_feature(subscription.tier, feature):
            # Determine the minimum tier needed
            min_tier = None
            for tier in [SubscriptionTier.basic, SubscriptionTier.pro, SubscriptionTier.premium]:
                if tier_has_feature(tier, feature):
                    min_tier = tier
                    break

            tier_name = min_tier.value.capitalize() if min_tier else "higher"
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"This feature requires a {tier_name} subscription or higher. Please upgrade your plan.",
            )

        return current_user

    return check_subscription


# Feature constants for easy reference
class Features:
    PORTFOLIO_TRACKING = "portfolio_tracking"
    BASIC_RECOMMENDATIONS = "basic_recommendations"
    BASIC_ANALYTICS = "basic_analytics"
    MARKET_SUMMARIES = "market_summaries"
    ADVANCED_ANALYTICS = "advanced_analytics"
    TAX_OPTIMIZATION = "tax_optimization"
    DOWNLOADABLE_REPORTS = "downloadable_reports"
    WEEKLY_DIGEST = "weekly_digest"
    BROKER_EXECUTION = "broker_execution"
    ROBO_ADVISOR = "robo_advisor"
    API_ACCESS = "api_access"
    PRIORITY_SUPPORT = "priority_support"
