import asyncio
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, status

from app.models.user import User
from app.models.subscription import tier_has_feature
from app.middleware.subscription import get_user_subscription
from app.api.deps import get_current_user
from app.services.ngx_stock_service import get_all_stocks, get_stock
from app.database import get_client
from app.config import settings

router = APIRouter()

_FREE_LIMIT = 3


async def _get_free_views_today(user_id: str) -> int:
    """Return today's detailed health-card view count for a free-tier user."""
    db = get_client()[settings.mongodb_db_name]
    today = date.today().isoformat()
    doc = await db["health_card_views"].find_one({"user_id": user_id, "date": today})
    return doc["count"] if doc else 0


async def _increment_free_views(user_id: str) -> None:
    """Atomically increment today's view counter for a free-tier user."""
    db = get_client()[settings.mongodb_db_name]
    today = date.today().isoformat()
    await db["health_card_views"].update_one(
        {"user_id": user_id, "date": today},
        {"$inc": {"count": 1}, "$setOnInsert": {"user_id": user_id, "date": today}},
        upsert=True,
    )


@router.get("")
async def list_health_cards(current_user: User = Depends(get_current_user)):
    subscription = await get_user_subscription(current_user.id)
    is_full = subscription and tier_has_feature(subscription.tier, "full_screener")

    stocks = await asyncio.get_event_loop().run_in_executor(None, get_all_stocks)

    if not is_full:
        viewed = await _get_free_views_today(current_user.id)
        remaining = max(0, _FREE_LIMIT - viewed)
        cards_out = [
            {
                "symbol": s["symbol"],
                "name": s["name"],
                "sector": s["sector"],
                "price": s["price"],
                "change_pct": s["change_pct"],
                "health_score": s["health_score"],
                "rating": s["rating"],
                "summary": s["summary"],
            }
            for s in stocks
        ]
        return {"cards": cards_out, "is_limited": True, "cards_remaining": remaining}

    return {"cards": stocks, "is_limited": False, "cards_remaining": None}


@router.get("/{symbol}")
async def get_health_card(symbol: str, current_user: User = Depends(get_current_user)):
    card = await asyncio.get_event_loop().run_in_executor(None, get_stock, symbol)
    if not card:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Health card not found for symbol: {symbol}",
        )

    subscription = await get_user_subscription(current_user.id)
    is_full = subscription and tier_has_feature(subscription.tier, "full_screener")

    if not is_full:
        viewed = await _get_free_views_today(current_user.id)
        if viewed >= _FREE_LIMIT:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=(
                    f"Free tier limit reached ({_FREE_LIMIT} detailed cards per day). "
                    "Upgrade to ClearFlow Pro for unlimited access."
                ),
            )
        await _increment_free_views(current_user.id)

    return card
