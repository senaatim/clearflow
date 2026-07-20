import asyncio
from fastapi import APIRouter, Depends

from app.models.user import User
from app.middleware.subscription import require_subscription, Features
from app.api.deps import get_current_user
from app.services.ngx_stock_service import get_all_stocks

router = APIRouter()

_require_ngx = require_subscription(Features.NGX_MODULE)


@router.get("/summary")
async def get_ngx_summary(current_user: User = Depends(_require_ngx)):
    """
    NGX market summary. Index data scraped from afx.kwayisi.org.
    """
    from app.services.ngx_scraper import get_asi_index

    asi = await asyncio.get_event_loop().run_in_executor(None, get_asi_index)
    index_data = asi  # may be None if scrape fails

    stocks = await asyncio.get_event_loop().run_in_executor(None, get_all_stocks)
    advancers = sum(1 for s in stocks if (s.get("change_pct") or 0) > 0)
    decliners = sum(1 for s in stocks if (s.get("change_pct") or 0) < 0)
    unchanged = len(stocks) - advancers - decliners
    total_volume = sum(s.get("volume") or 0 for s in stocks)
    total_market_cap = sum(s.get("market_cap") or 0 for s in stocks)

    # Sector breakdown using what we have
    from app.services.ngx_stock_service import SECTORS
    sector_indices = []
    for sec in SECTORS:
        sec_stocks = [s for s in stocks if s["sector"] == sec]
        if not sec_stocks:
            continue
        avg_change = round(
            sum(s.get("change_pct") or 0 for s in sec_stocks) / len(sec_stocks), 2
        )
        sector_indices.append({
            "name": f"NGX {sec}",
            "change_pct": avg_change,
        })

    # Prefer ASI market cap (all-market) over our 20-stock sum
    asi_mcap = index_data.get("market_cap_trn") if index_data else None
    market_cap_trn = asi_mcap or (round(total_market_cap / 1e12, 2) if total_market_cap else None)

    # Strip market_cap_trn out of the index sub-object (it belongs at top level)
    index_out = {k: v for k, v in index_data.items() if k != "market_cap_trn"} if index_data else None

    return {
        "index": index_out,
        "market_cap_trn": market_cap_trn,
        "volume_total": total_volume,
        "advancers": advancers,
        "decliners": decliners,
        "unchanged": unchanged,
        "sector_indices": sector_indices,
    }


@router.get("/movers")
async def get_ngx_movers(current_user: User = Depends(_require_ngx)):
    stocks = await asyncio.get_event_loop().run_in_executor(None, get_all_stocks)

    with_change = [s for s in stocks if s.get("change_pct") is not None]
    sorted_change = sorted(with_change, key=lambda s: s["change_pct"], reverse=True)

    def _row(s: dict) -> dict:
        return {
            "symbol": s["symbol"],
            "name": s["name"],
            "price": s["price"],
            "change_pct": s["change_pct"],
            "volume": s.get("volume"),
        }

    top_gainers = [_row(s) for s in sorted_change[:5]]
    top_losers = [_row(s) for s in sorted_change[-5:][::-1]]
    most_active = sorted(
        [s for s in stocks if s.get("volume")],
        key=lambda s: s["volume"],
        reverse=True,
    )[:5]
    most_active_out = [
        {"symbol": s["symbol"], "name": s["name"], "price": s["price"], "volume": s["volume"]}
        for s in most_active
    ]

    return {
        "top_gainers": top_gainers,
        "top_losers": top_losers,
        "most_active": most_active_out,
    }


@router.get("/stocks")
async def get_ngx_stocks(current_user: User = Depends(_require_ngx)):
    stocks = await asyncio.get_event_loop().run_in_executor(None, get_all_stocks)
    return {"stocks": stocks, "total_count": len(stocks)}


@router.get("/scraper/status")
async def scraper_status(current_user: User = Depends(_require_ngx)):
    """
    Debug endpoint — shows what the NGX scraper last fetched.
    Useful for confirming live prices are coming through.
    """
    from app.services.ngx_scraper import get_live_prices, _LIVE_CACHE
    import time

    prices = await asyncio.get_event_loop().run_in_executor(None, get_live_prices)
    age_seconds = round(time.time() - _LIVE_CACHE[1]) if _LIVE_CACHE else None

    return {
        "scraped_count": len(prices),
        "cache_age_seconds": age_seconds,
        "sample": dict(list(prices.items())[:5]),  # first 5 entries
    }
