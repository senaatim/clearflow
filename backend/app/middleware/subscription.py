from fastapi import Depends, HTTPException, status
from datetime import datetime

from app.models.user import User, UserRole
from app.models.subscription import Subscription, SubscriptionTier, SubscriptionStatus, tier_has_feature
from app.api.deps import get_current_user


async def get_user_subscription(user_id: str) -> Subscription | None:
    return await Subscription.find_one(Subscription.user_id == user_id)


async def require_active_subscription(
    current_user: User = Depends(get_current_user),
) -> User:
    if current_user.role == UserRole.admin:
        return current_user

    subscription = await get_user_subscription(current_user.id)

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
    async def check_subscription(
        current_user: User = Depends(get_current_user),
    ) -> User:
        if current_user.role == UserRole.admin:
            return current_user

        subscription = await get_user_subscription(current_user.id)

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


class Features:
    # Free tier
    NEWS_FEED = "news_feed"
    BASIC_SCREENER = "basic_screener"
    HEALTH_CARDS = "health_cards"
    # Pro tier
    FULL_SCREENER = "full_screener"
    PORTFOLIO_TRACKING = "portfolio_tracking"
    BASIC_RECOMMENDATIONS = "basic_recommendations"
    BASIC_ANALYTICS = "basic_analytics"
    MARKET_SUMMARIES = "market_summaries"
    PORTFOLIO_BUILDER = "portfolio_builder"
    BEHAVIOUR_TOOLS = "behaviour_tools"
    EARNINGS_DECODER = "earnings_decoder"
    NGX_MODULE = "ngx_module"
    # Premium tier
    DCF_MODELS = "dcf_models"
    MACRO_DASHBOARD = "macro_dashboard"
    FULL_PORTFOLIO_ANALYTICS = "full_portfolio_analytics"
    PRIORITY_ALERTS = "priority_alerts"
    ADVANCED_ANALYTICS = "advanced_analytics"
    TAX_OPTIMIZATION = "tax_optimization"
    DOWNLOADABLE_REPORTS = "downloadable_reports"
    WEEKLY_DIGEST = "weekly_digest"
    BROKER_EXECUTION = "broker_execution"
    ROBO_ADVISOR = "robo_advisor"
    API_ACCESS = "api_access"
    PRIORITY_SUPPORT = "priority_support"
