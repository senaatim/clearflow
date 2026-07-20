import asyncio
from fastapi import APIRouter, Depends, Query
from typing import Optional

from app.models.user import User
from app.models.subscription import tier_has_feature
from app.middleware.subscription import get_user_subscription
from app.api.deps import get_current_user
from app.services.ngx_stock_service import (
    get_all_stocks, screener_fields, free_screener_fields, SECTORS,
)

router = APIRouter()


@router.get("/stocks")
async def screen_stocks(
    sector: Optional[str] = None,
    min_pe: Optional[float] = None,
    max_pe: Optional[float] = None,
    min_health: Optional[int] = None,
    min_dividend: Optional[float] = None,
    min_revenue_growth: Optional[float] = None,
    sort_by: str = Query(
        "market_cap",
        pattern="^(market_cap|pe_ratio|revenue_growth|dividend_yield|health_score|change_pct|price|volume)$",
    ),
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
):
    subscription = await get_user_subscription(current_user.id)
    is_free = not subscription or not tier_has_feature(subscription.tier, "full_screener")

    # Fetch all stocks (scraper + baseline, cached 15 min)
    stocks = await asyncio.get_event_loop().run_in_executor(None, get_all_stocks)

    # Sector filter — available to all tiers
    if sector:
        stocks = [s for s in stocks if s["sector"].lower() == sector.lower()]

    # Advanced filters — Pro/Premium only
    if not is_free:
        if min_pe is not None:
            stocks = [s for s in stocks if s["pe_ratio"] is not None and s["pe_ratio"] >= min_pe]
        if max_pe is not None:
            stocks = [s for s in stocks if s["pe_ratio"] is not None and s["pe_ratio"] <= max_pe]
        if min_health is not None:
            stocks = [s for s in stocks if (s["health_score"] or 0) >= min_health]
        if min_dividend is not None:
            stocks = [s for s in stocks if (s["dividend_yield"] or 0) >= min_dividend]
        if min_revenue_growth is not None:
            stocks = [s for s in stocks if s["revenue_growth"] is not None and s["revenue_growth"] >= min_revenue_growth]

    total_count = len(stocks)

    stocks.sort(key=lambda s: (s.get(sort_by) or 0), reverse=True)

    if is_free:
        out = [free_screener_fields(s) for s in stocks[:5]]
    else:
        out = [screener_fields(s) for s in stocks[:limit]]

    return {
        "stocks": out,
        "total_count": total_count,
        "is_limited": is_free,
        "sectors": SECTORS,
    }


@router.get("/sectors")
async def get_sectors(current_user: User = Depends(get_current_user)):
    return {"sectors": SECTORS}
