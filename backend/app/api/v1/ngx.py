from fastapi import APIRouter, Depends, HTTPException, status

from app.models.user import User
from app.middleware.subscription import require_subscription, Features
from app.api.deps import get_current_user

router = APIRouter()

_require_ngx = require_subscription(Features.NGX_MODULE)


@router.get("/summary")
async def get_ngx_summary(current_user: User = Depends(_require_ngx)):
    return {
        "index": {
            "name": "NGX All-Share Index",
            "value": 97_842.35,
            "change": 1_368.92,
            "change_pct": 1.42,
            "ytd_change_pct": 32.7,
        },
        "market_cap_trn": 55.4,
        "volume_bn_units": 1.82,
        "value_traded_bn_ngn": 18.6,
        "deals": 8_412,
        "advancers": 31,
        "decliners": 14,
        "unchanged": 7,
        "as_of": "2026-03-20T15:30:00",
        "sector_indices": [
            {"name": "NGX Banking",         "value": 1_012.45, "change_pct":  2.15},
            {"name": "NGX Consumer Goods",  "value":   712.30, "change_pct":  0.48},
            {"name": "NGX Industrial Goods","value":  3_845.10,"change_pct":  0.87},
            {"name": "NGX Insurance",       "value":   182.65, "change_pct": -0.32},
            {"name": "NGX Oil & Gas",       "value":   848.20, "change_pct":  1.95},
            {"name": "NGX ICT",             "value":  2_109.55,"change_pct":  0.63},
            {"name": "NGX Agriculture",     "value":  1_563.40,"change_pct":  1.28},
        ],
    }


@router.get("/movers")
async def get_ngx_movers(current_user: User = Depends(_require_ngx)):
    return {
        "top_gainers": [
            {"symbol": "TRANSCORP",  "name": "Transcorp Hotels Plc",           "price": 18.40,   "change_pct": 3.1,  "volume": 4_500_000},
            {"symbol": "SEPLAT",     "name": "Seplat Energy Plc",              "price": 2300.00, "change_pct": 2.1,  "volume":   560_000},
            {"symbol": "UBA",        "name": "United Bank for Africa Plc",     "price": 26.40,   "change_pct": 2.3,  "volume": 11_200_000},
            {"symbol": "OKOMUOIL",   "name": "Okomu Oil Palm Plc",             "price": 310.00,  "change_pct": 1.6,  "volume":   450_000},
            {"symbol": "ZENITHBANK", "name": "Zenith Bank Plc",                "price": 38.20,   "change_pct": 1.5,  "volume": 12_300_000},
        ],
        "top_losers": [
            {"symbol": "ACCESSCORP", "name": "Access Holdings Plc",            "price": 22.50,   "change_pct": -1.1, "volume": 15_600_000},
            {"symbol": "NESTLE",     "name": "Nestle Nigeria Plc",             "price": 1050.00, "change_pct": -0.5, "volume":   320_000},
            {"symbol": "WAPCO",      "name": "Lafarge Africa Plc",             "price": 38.00,   "change_pct": -0.3, "volume":  1_800_000},
            {"symbol": "GTCO",       "name": "Guaranty Trust Holding Co Plc", "price": 52.80,   "change_pct": -0.8, "volume":  8_750_000},
            {"symbol": "CONOIL",     "name": "Conoil Plc",                     "price": 128.00,  "change_pct": -0.6, "volume":   310_000},
        ],
        "most_active": [
            {"symbol": "ACCESSCORP", "name": "Access Holdings Plc",            "price": 22.50,   "volume": 15_600_000},
            {"symbol": "ZENITHBANK", "name": "Zenith Bank Plc",                "price": 38.20,   "volume": 12_300_000},
            {"symbol": "UBA",        "name": "United Bank for Africa Plc",     "price": 26.40,   "volume": 11_200_000},
            {"symbol": "FBNH",       "name": "FBN Holdings Plc",               "price": 24.60,   "volume":  9_800_000},
            {"symbol": "GTCO",       "name": "Guaranty Trust Holding Co Plc", "price": 52.80,   "volume":  8_750_000},
        ],
    }


@router.get("/stocks")
async def get_ngx_stocks(current_user: User = Depends(_require_ngx)):
    from app.api.v1.screener import _STOCKS
    return {
        "stocks": _STOCKS,
        "total_count": len(_STOCKS),
    }
