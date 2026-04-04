from fastapi import APIRouter, Depends, Query
from typing import Optional

from app.models.user import User
from app.models.subscription import tier_has_feature
from app.middleware.subscription import get_user_subscription
from app.api.deps import get_current_user

router = APIRouter()

_STOCKS = [
    {"symbol": "DANGCEM",    "name": "Dangote Cement Plc",               "sector": "Industrial Goods",    "price": 625.00,  "change_pct": 1.2,  "market_cap": 10_650_000_000_000, "pe_ratio": 14.3, "revenue_growth": 18.5, "dividend_yield": 4.2, "health_score": 82, "volume": 1_245_000},
    {"symbol": "GTCO",       "name": "Guaranty Trust Holding Co Plc",    "sector": "Financial Services",  "price": 52.80,   "change_pct": -0.8, "market_cap":  1_552_000_000_000, "pe_ratio":  5.1, "revenue_growth": 22.3, "dividend_yield": 7.6, "health_score": 88, "volume": 8_750_000},
    {"symbol": "MTNN",       "name": "MTN Nigeria Communications Plc",   "sector": "ICT",                 "price": 198.50,  "change_pct":  0.5, "market_cap":  4_021_000_000_000, "pe_ratio": 22.1, "revenue_growth": 30.5, "dividend_yield": 3.1, "health_score": 75, "volume": 3_456_000},
    {"symbol": "ZENITHBANK", "name": "Zenith Bank Plc",                  "sector": "Financial Services",  "price": 38.20,   "change_pct":  1.5, "market_cap":  1_199_000_000_000, "pe_ratio":  3.9, "revenue_growth": 28.7, "dividend_yield": 9.2, "health_score": 84, "volume": 12_300_000},
    {"symbol": "ACCESSCORP", "name": "Access Holdings Plc",              "sector": "Financial Services",  "price": 22.50,   "change_pct": -1.1, "market_cap":    797_000_000_000, "pe_ratio":  3.5, "revenue_growth": 35.2, "dividend_yield": 6.8, "health_score": 79, "volume": 15_600_000},
    {"symbol": "SEPLAT",     "name": "Seplat Energy Plc",                "sector": "Oil & Gas",           "price": 2300.00, "change_pct":  2.1, "market_cap":  1_350_000_000_000, "pe_ratio":  8.7, "revenue_growth": 45.3, "dividend_yield": 2.5, "health_score": 71, "volume":    560_000},
    {"symbol": "AIRTELAFRI", "name": "Airtel Africa Plc",                "sector": "ICT",                 "price": 1450.00, "change_pct":  0.3, "market_cap":  2_750_000_000_000, "pe_ratio": 18.4, "revenue_growth": 25.8, "dividend_yield": 1.8, "health_score": 77, "volume":    890_000},
    {"symbol": "NESTLE",     "name": "Nestle Nigeria Plc",               "sector": "Consumer Goods",      "price": 1050.00, "change_pct": -0.5, "market_cap":    832_000_000_000, "pe_ratio": 31.2, "revenue_growth": 12.4, "dividend_yield": 2.1, "health_score": 80, "volume":    320_000},
    {"symbol": "FBNH",       "name": "FBN Holdings Plc",                 "sector": "Financial Services",  "price": 24.60,   "change_pct":  1.8, "market_cap":    701_000_000_000, "pe_ratio":  4.2, "revenue_growth": 31.5, "dividend_yield": 5.4, "health_score": 72, "volume":  9_800_000},
    {"symbol": "TRANSCORP",  "name": "Transcorp Hotels Plc",             "sector": "Services",            "price": 18.40,   "change_pct":  3.1, "market_cap":    290_000_000_000, "pe_ratio": 12.8, "revenue_growth": 62.5, "dividend_yield": 0.8, "health_score": 68, "volume":  4_500_000},
    {"symbol": "STANBIC",    "name": "Stanbic IBTC Holdings Plc",        "sector": "Financial Services",  "price": 58.50,   "change_pct":  0.9, "market_cap":    613_000_000_000, "pe_ratio":  7.3, "revenue_growth": 26.4, "dividend_yield": 8.1, "health_score": 83, "volume":  2_100_000},
    {"symbol": "UBA",        "name": "United Bank for Africa Plc",       "sector": "Financial Services",  "price": 26.40,   "change_pct":  2.3, "market_cap":    903_000_000_000, "pe_ratio":  4.0, "revenue_growth": 29.8, "dividend_yield": 7.5, "health_score": 80, "volume": 11_200_000},
    {"symbol": "WAPCO",      "name": "Lafarge Africa Plc",               "sector": "Industrial Goods",    "price": 38.00,   "change_pct": -0.3, "market_cap":    612_000_000_000, "pe_ratio":  9.8, "revenue_growth": 14.2, "dividend_yield": 3.2, "health_score": 74, "volume":  1_800_000},
    {"symbol": "OKOMUOIL",   "name": "Okomu Oil Palm Plc",               "sector": "Agriculture",         "price": 310.00,  "change_pct":  1.6, "market_cap":    296_000_000_000, "pe_ratio":  7.5, "revenue_growth": 20.3, "dividend_yield": 6.5, "health_score": 86, "volume":    450_000},
    {"symbol": "PRESCO",     "name": "Presco Plc",                       "sector": "Agriculture",         "price": 290.00,  "change_pct":  0.7, "market_cap":    278_000_000_000, "pe_ratio":  8.9, "revenue_growth": 18.7, "dividend_yield": 5.8, "health_score": 83, "volume":    380_000},
    {"symbol": "BUACEMENT",  "name": "BUA Cement Plc",                   "sector": "Industrial Goods",    "price": 92.00,   "change_pct":  0.4, "market_cap":  3_120_000_000_000, "pe_ratio": 11.5, "revenue_growth": 21.8, "dividend_yield": 3.5, "health_score": 78, "volume":  1_100_000},
    {"symbol": "BUAFOODS",   "name": "BUA Foods Plc",                    "sector": "Consumer Goods",      "price": 340.00,  "change_pct":  1.1, "market_cap":  3_060_000_000_000, "pe_ratio": 16.8, "revenue_growth": 38.4, "dividend_yield": 2.4, "health_score": 81, "volume":    760_000},
    {"symbol": "CONOIL",     "name": "Conoil Plc",                       "sector": "Oil & Gas",           "price": 128.00,  "change_pct": -0.6, "market_cap":    183_000_000_000, "pe_ratio":  6.4, "revenue_growth":  9.8, "dividend_yield": 4.9, "health_score": 69, "volume":    310_000},
    {"symbol": "NPFMCRFBK",  "name": "NPF Microfinance Bank Plc",        "sector": "Financial Services",  "price": 2.10,    "change_pct":  4.5, "market_cap":      8_000_000_000, "pe_ratio":  5.6, "revenue_growth": 15.2, "dividend_yield": 3.8, "health_score": 65, "volume":  6_200_000},
    {"symbol": "FIDELITYBK", "name": "Fidelity Bank Plc",                "sector": "Financial Services",  "price": 12.80,   "change_pct":  1.4, "market_cap":    367_000_000_000, "pe_ratio":  4.8, "revenue_growth": 24.1, "dividend_yield": 6.1, "health_score": 73, "volume":  7_400_000},
]

_SECTORS = sorted(set(s["sector"] for s in _STOCKS))


@router.get("/stocks")
async def screen_stocks(
    sector: Optional[str] = None,
    min_pe: Optional[float] = None,
    max_pe: Optional[float] = None,
    min_health: Optional[int] = None,
    min_dividend: Optional[float] = None,
    min_revenue_growth: Optional[float] = None,
    sort_by: str = Query("market_cap", pattern="^(market_cap|pe_ratio|revenue_growth|dividend_yield|health_score|change_pct|price)$"),
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
):
    subscription = await get_user_subscription(current_user.id)
    is_free = not subscription or not tier_has_feature(subscription.tier, "full_screener")

    stocks = list(_STOCKS)

    # Sector filter available to all tiers
    if sector:
        stocks = [s for s in stocks if s["sector"].lower() == sector.lower()]

    # Advanced filters — Pro/Premium only
    if not is_free:
        if min_pe is not None:
            stocks = [s for s in stocks if s["pe_ratio"] >= min_pe]
        if max_pe is not None:
            stocks = [s for s in stocks if s["pe_ratio"] <= max_pe]
        if min_health is not None:
            stocks = [s for s in stocks if s["health_score"] >= min_health]
        if min_dividend is not None:
            stocks = [s for s in stocks if s["dividend_yield"] >= min_dividend]
        if min_revenue_growth is not None:
            stocks = [s for s in stocks if s["revenue_growth"] >= min_revenue_growth]

    stocks.sort(key=lambda s: s.get(sort_by, 0), reverse=True)

    # Free tier: max 5 results, hide advanced fields
    if is_free:
        stocks = stocks[:5]
        for s in stocks:
            s = {k: v for k, v in s.items()}  # copy already done by list()

    return {
        "stocks": stocks[:limit],
        "total_count": len(stocks),
        "is_limited": is_free,
        "sectors": _SECTORS,
    }


@router.get("/sectors")
async def get_sectors(current_user: User = Depends(get_current_user)):
    return {"sectors": _SECTORS}
