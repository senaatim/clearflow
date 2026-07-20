"""
NGX Stock Service — real-time NGX stock data with a fundamental baseline.

Strategy:
  1. Baseline dict holds quarterly fundamentals (PE, margins, ROE, etc.)
     sourced from public NGX filings. These change slowly (quarterly).
  2. On every request we overlay live price/volume from the NGX scraper
     (doclib.ngxgroup.com + afx.kwayisi.org). Results are cached 15 minutes.
  3. Health score, rating, strengths, risks and summary are computed from
     the merged data — nothing is hardcoded in those fields.
"""

import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import Optional

# ---------------------------------------------------------------------------
# Baseline fundamentals (quarterly filing data — updated as filings arrive)
# ---------------------------------------------------------------------------
_BASELINE: dict[str, dict] = {
    "DANGCEM": {
        "name": "Dangote Cement Plc", "sector": "Industrial Goods",
        "price": 1047.00, "change_pct": 0.0, "volume": 1_245_000,
        "market_cap": 17_820_000_000_000,
        "pe_ratio": 14.3, "pb_ratio": 3.1, "ps_ratio": 4.0,
        "dividend_yield": 4.2, "payout_ratio": 60.2,
        "profit_margin": 28.4, "ebitda_margin": 38.1,
        "roe": 22.5, "roa": 14.1, "roce": 19.8,
        "debt_to_equity": 0.42, "current_ratio": 1.8, "quick_ratio": 1.3,
        "revenue_growth": 18.5, "eps": 73.2, "eps_growth": 15.2,
        "revenue_bn": 2140.5,
        "52w_high": 1200.0, "52w_low": 680.0, "analyst_count": 12,
    },
    "GTCO": {
        "name": "Guaranty Trust Holding Co Plc", "sector": "Financial Services",
        "price": 129.20, "change_pct": 0.0, "volume": 8_750_000,
        "market_cap": 3_795_000_000_000,
        "pe_ratio": 5.1, "pb_ratio": 1.4, "ps_ratio": 2.1,
        "dividend_yield": 7.6, "payout_ratio": 38.8,
        "profit_margin": 41.2, "ebitda_margin": 48.5,
        "roe": 28.4, "roa": 4.2, "roce": 24.1,
        "debt_to_equity": 5.2, "current_ratio": 1.1, "quick_ratio": 1.0,
        "revenue_growth": 22.3, "eps": 25.3, "eps_growth": 18.7,
        "revenue_bn": 612.3,
        "52w_high": 145.0, "52w_low": 75.0, "analyst_count": 15,
    },
    "MTNN": {
        "name": "MTN Nigeria Communications Plc", "sector": "ICT",
        "price": 826.50, "change_pct": 0.0, "volume": 3_456_000,
        "market_cap": 16_750_000_000_000,
        "pe_ratio": 22.1, "pb_ratio": 4.8, "ps_ratio": 4.0,
        "dividend_yield": 3.1, "payout_ratio": 68.5,
        "profit_margin": 18.2, "ebitda_margin": 51.4,
        "roe": 21.6, "roa": 6.5, "roce": 14.2,
        "debt_to_equity": 2.1, "current_ratio": 0.8, "quick_ratio": 0.7,
        "revenue_growth": 30.5, "eps": 37.4, "eps_growth": 12.1,
        "revenue_bn": 1050.8,
        "52w_high": 950.0, "52w_low": 580.0, "analyst_count": 18,
    },
    "ZENITHBANK": {
        "name": "Zenith Bank Plc", "sector": "Financial Services",
        "price": 114.00, "change_pct": 0.0, "volume": 12_300_000,
        "market_cap": 3_580_000_000_000,
        "pe_ratio": 3.9, "pb_ratio": 1.1, "ps_ratio": 1.4,
        "dividend_yield": 9.2, "payout_ratio": 35.9,
        "profit_margin": 35.8, "ebitda_margin": 44.2,
        "roe": 26.1, "roa": 3.9, "roce": 22.3,
        "debt_to_equity": 5.8, "current_ratio": 1.2, "quick_ratio": 1.1,
        "revenue_growth": 28.7, "eps": 29.2, "eps_growth": 24.5,
        "revenue_bn": 1124.6,
        "52w_high": 128.0, "52w_low": 65.0, "analyst_count": 14,
    },
    "ACCESSCORP": {
        "name": "Access Holdings Plc", "sector": "Financial Services",
        "price": 25.00, "change_pct": 0.0, "volume": 15_600_000,
        "market_cap": 886_000_000_000,
        "pe_ratio": 3.5, "pb_ratio": 0.9, "ps_ratio": 0.5,
        "dividend_yield": 6.8, "payout_ratio": 23.8,
        "profit_margin": 14.8, "ebitda_margin": 32.5,
        "roe": 24.8, "roa": 2.9, "roce": 18.5,
        "debt_to_equity": 7.1, "current_ratio": 1.0, "quick_ratio": 0.9,
        "revenue_growth": 35.2, "eps": 7.14, "eps_growth": 31.2,
        "revenue_bn": 1486.2,
        "52w_high": 32.0, "52w_low": 18.0, "analyst_count": 11,
    },
    "SEPLAT": {
        "name": "Seplat Energy Plc", "sector": "Oil & Gas",
        "price": 2300.00, "change_pct": 0.0, "volume": 560_000,
        "market_cap": 1_350_000_000_000,
        "pe_ratio": 8.7, "pb_ratio": 2.1, "ps_ratio": 2.7,
        "dividend_yield": 2.5, "payout_ratio": 21.7,
        "profit_margin": 31.5, "ebitda_margin": 62.1,
        "roe": 18.9, "roa": 10.5, "roce": 16.2,
        "debt_to_equity": 0.78, "current_ratio": 1.6, "quick_ratio": 1.4,
        "revenue_growth": 45.3, "eps": 264.4, "eps_growth": 38.7,
        "revenue_bn": 412.8,
        "52w_high": 2850.0, "52w_low": 1450.0, "analyst_count": 9,
    },
    "AIRTELAFRI": {
        "name": "Airtel Africa Plc", "sector": "ICT",
        "price": 5801.40, "change_pct": 0.0, "volume": 890_000,
        "market_cap": 11_000_000_000_000,
        "pe_ratio": 18.4, "pb_ratio": 3.6, "ps_ratio": 3.0,
        "dividend_yield": 1.8, "payout_ratio": 33.1,
        "profit_margin": 16.4, "ebitda_margin": 48.2,
        "roe": 19.6, "roa": 5.8, "roce": 13.4,
        "debt_to_equity": 1.8, "current_ratio": 0.9, "quick_ratio": 0.8,
        "revenue_growth": 25.8, "eps": 315.3, "eps_growth": 18.2,
        "revenue_bn": 920.5,
        "52w_high": 6500.0, "52w_low": 3800.0, "analyst_count": 16,
    },
    "NESTLE": {
        "name": "Nestle Nigeria Plc", "sector": "Consumer Goods",
        "price": 1050.00, "change_pct": 0.0, "volume": 320_000,
        "market_cap": 832_000_000_000,
        "pe_ratio": 31.2, "pb_ratio": 5.8, "ps_ratio": 3.4,
        "dividend_yield": 2.1, "payout_ratio": 65.6,
        "profit_margin": 10.8, "ebitda_margin": 22.6,
        "roe": 23.1, "roa": 12.4, "roce": 20.8,
        "debt_to_equity": 0.22, "current_ratio": 1.5, "quick_ratio": 0.9,
        "revenue_growth": 12.4, "eps": 33.7, "eps_growth": 8.4,
        "revenue_bn": 631.4,
        "52w_high": 1400.0, "52w_low": 850.0, "analyst_count": 8,
    },
    "FBNH": {
        "name": "FBN Holdings Plc", "sector": "Financial Services",
        "price": 24.60, "change_pct": 0.0, "volume": 9_800_000,
        "market_cap": 701_000_000_000,
        "pe_ratio": 4.2, "pb_ratio": 0.8, "ps_ratio": 0.9,
        "dividend_yield": 5.4, "payout_ratio": 22.7,
        "profit_margin": 22.6, "ebitda_margin": 35.4,
        "roe": 18.3, "roa": 2.6, "roce": 15.1,
        "debt_to_equity": 6.4, "current_ratio": 1.1, "quick_ratio": 1.0,
        "revenue_growth": 31.5, "eps": 5.86, "eps_growth": 28.4,
        "revenue_bn": 728.4,
        "52w_high": 32.0, "52w_low": 18.0, "analyst_count": 10,
    },
    "TRANSCORP": {
        "name": "Transcorp Hotels Plc", "sector": "Services",
        "price": 18.40, "change_pct": 0.0, "volume": 4_500_000,
        "market_cap": 290_000_000_000,
        "pe_ratio": 12.8, "pb_ratio": 1.4, "ps_ratio": 1.1,
        "dividend_yield": 0.8, "payout_ratio": 23.5,
        "profit_margin": 12.8, "ebitda_margin": 28.5,
        "roe": 12.4, "roa": 6.8, "roce": 10.9,
        "debt_to_equity": 0.85, "current_ratio": 1.3, "quick_ratio": 1.0,
        "revenue_growth": 62.5, "eps": 1.64, "eps_growth": 18.7,
        "revenue_bn": 82.4,
        "52w_high": 25.0, "52w_low": 12.0, "analyst_count": 6,
    },
    "STANBIC": {
        "name": "Stanbic IBTC Holdings Plc", "sector": "Financial Services",
        "price": 58.50, "change_pct": 0.0, "volume": 2_100_000,
        "market_cap": 613_000_000_000,
        "pe_ratio": 7.3, "pb_ratio": 1.5, "ps_ratio": 1.8,
        "dividend_yield": 8.1, "payout_ratio": 59.2,
        "profit_margin": 33.4, "ebitda_margin": 41.8,
        "roe": 20.8, "roa": 3.4, "roce": 17.6,
        "debt_to_equity": 4.8, "current_ratio": 1.2, "quick_ratio": 1.1,
        "revenue_growth": 26.4, "eps": 8.01, "eps_growth": 22.1,
        "revenue_bn": 388.5,
        "52w_high": 75.0, "52w_low": 45.0, "analyst_count": 9,
    },
    "UBA": {
        "name": "United Bank for Africa Plc", "sector": "Financial Services",
        "price": 26.40, "change_pct": 0.0, "volume": 11_200_000,
        "market_cap": 903_000_000_000,
        "pe_ratio": 4.0, "pb_ratio": 1.0, "ps_ratio": 0.9,
        "dividend_yield": 7.5, "payout_ratio": 30.0,
        "profit_margin": 24.6, "ebitda_margin": 38.9,
        "roe": 22.8, "roa": 3.2, "roce": 19.4,
        "debt_to_equity": 6.1, "current_ratio": 1.1, "quick_ratio": 1.0,
        "revenue_growth": 29.8, "eps": 6.60, "eps_growth": 27.3,
        "revenue_bn": 942.1,
        "52w_high": 35.0, "52w_low": 20.0, "analyst_count": 13,
    },
    "WAPCO": {
        "name": "Lafarge Africa Plc", "sector": "Industrial Goods",
        "price": 38.00, "change_pct": 0.0, "volume": 1_800_000,
        "market_cap": 612_000_000_000,
        "pe_ratio": 9.8, "pb_ratio": 2.2, "ps_ratio": 1.9,
        "dividend_yield": 3.2, "payout_ratio": 31.4,
        "profit_margin": 16.4, "ebitda_margin": 28.7,
        "roe": 19.2, "roa": 9.8, "roce": 16.5,
        "debt_to_equity": 0.35, "current_ratio": 1.6, "quick_ratio": 1.2,
        "revenue_growth": 14.2, "eps": 3.88, "eps_growth": 11.5,
        "revenue_bn": 314.8,
        "52w_high": 50.0, "52w_low": 28.0, "analyst_count": 7,
    },
    "OKOMUOIL": {
        "name": "Okomu Oil Palm Plc", "sector": "Agriculture",
        "price": 310.00, "change_pct": 0.0, "volume": 450_000,
        "market_cap": 296_000_000_000,
        "pe_ratio": 7.5, "pb_ratio": 2.8, "ps_ratio": 3.2,
        "dividend_yield": 6.5, "payout_ratio": 48.7,
        "profit_margin": 42.5, "ebitda_margin": 55.3,
        "roe": 32.5, "roa": 24.1, "roce": 29.8,
        "debt_to_equity": 0.18, "current_ratio": 2.4, "quick_ratio": 1.8,
        "revenue_growth": 20.3, "eps": 41.3, "eps_growth": 17.8,
        "revenue_bn": 98.4,
        "52w_high": 400.0, "52w_low": 240.0, "analyst_count": 6,
    },
    "PRESCO": {
        "name": "Presco Plc", "sector": "Agriculture",
        "price": 290.00, "change_pct": 0.0, "volume": 380_000,
        "market_cap": 278_000_000_000,
        "pe_ratio": 8.9, "pb_ratio": 2.4, "ps_ratio": 2.8,
        "dividend_yield": 5.8, "payout_ratio": 51.6,
        "profit_margin": 38.2, "ebitda_margin": 50.6,
        "roe": 28.4, "roa": 18.6, "roce": 25.2,
        "debt_to_equity": 0.22, "current_ratio": 2.1, "quick_ratio": 1.6,
        "revenue_growth": 18.7, "eps": 32.6, "eps_growth": 14.3,
        "revenue_bn": 76.2,
        "52w_high": 380.0, "52w_low": 220.0, "analyst_count": 5,
    },
    "BUACEMENT": {
        "name": "BUA Cement Plc", "sector": "Industrial Goods",
        "price": 275.60, "change_pct": 0.0, "volume": 1_100_000,
        "market_cap": 9_340_000_000_000,
        "pe_ratio": 11.5, "pb_ratio": 2.6, "ps_ratio": 3.1,
        "dividend_yield": 3.5, "payout_ratio": 40.3,
        "profit_margin": 24.8, "ebitda_margin": 36.4,
        "roe": 20.6, "roa": 11.2, "roce": 18.1,
        "debt_to_equity": 0.38, "current_ratio": 1.7, "quick_ratio": 1.3,
        "revenue_growth": 21.8, "eps": 23.9, "eps_growth": 16.4,
        "revenue_bn": 856.3,
        "52w_high": 320.0, "52w_low": 180.0, "analyst_count": 10,
    },
    "BUAFOODS": {
        "name": "BUA Foods Plc", "sector": "Consumer Goods",
        "price": 340.00, "change_pct": 0.0, "volume": 760_000,
        "market_cap": 3_060_000_000_000,
        "pe_ratio": 16.8, "pb_ratio": 4.2, "ps_ratio": 3.6,
        "dividend_yield": 2.4, "payout_ratio": 40.3,
        "profit_margin": 21.4, "ebitda_margin": 32.8,
        "roe": 24.8, "roa": 13.6, "roce": 21.3,
        "debt_to_equity": 0.31, "current_ratio": 1.8, "quick_ratio": 1.2,
        "revenue_growth": 38.4, "eps": 20.24, "eps_growth": 32.6,
        "revenue_bn": 498.6,
        "52w_high": 450.0, "52w_low": 260.0, "analyst_count": 8,
    },
    "CONOIL": {
        "name": "Conoil Plc", "sector": "Oil & Gas",
        "price": 128.00, "change_pct": 0.0, "volume": 310_000,
        "market_cap": 183_000_000_000,
        "pe_ratio": 6.4, "pb_ratio": 1.4, "ps_ratio": 0.6,
        "dividend_yield": 4.9, "payout_ratio": 31.4,
        "profit_margin": 9.2, "ebitda_margin": 15.8,
        "roe": 16.4, "roa": 7.8, "roce": 13.2,
        "debt_to_equity": 0.56, "current_ratio": 1.4, "quick_ratio": 1.0,
        "revenue_growth": 9.8, "eps": 20.0, "eps_growth": 7.2,
        "revenue_bn": 294.5,
        "52w_high": 180.0, "52w_low": 100.0, "analyst_count": 5,
    },
    "NPFMCRFBK": {
        "name": "NPF Microfinance Bank Plc", "sector": "Financial Services",
        "price": 2.10, "change_pct": 0.0, "volume": 6_200_000,
        "market_cap": 8_000_000_000,
        "pe_ratio": 5.6, "pb_ratio": 0.6, "ps_ratio": 0.4,
        "dividend_yield": 3.8, "payout_ratio": 21.3,
        "profit_margin": 18.4, "ebitda_margin": 26.2,
        "roe": 12.6, "roa": 2.1, "roce": 10.8,
        "debt_to_equity": 4.2, "current_ratio": 1.1, "quick_ratio": 1.0,
        "revenue_growth": 15.2, "eps": 0.38, "eps_growth": 12.4,
        "revenue_bn": 12.8,
        "52w_high": 2.80, "52w_low": 1.50, "analyst_count": 3,
    },
    "FIDELITYBK": {
        "name": "Fidelity Bank Plc", "sector": "Financial Services",
        "price": 21.85, "change_pct": 0.0, "volume": 7_400_000,
        "market_cap": 627_000_000_000,
        "pe_ratio": 4.8, "pb_ratio": 0.9, "ps_ratio": 0.7,
        "dividend_yield": 6.1, "payout_ratio": 29.3,
        "profit_margin": 21.8, "ebitda_margin": 34.2,
        "roe": 18.6, "roa": 2.8, "roce": 15.4,
        "debt_to_equity": 5.6, "current_ratio": 1.1, "quick_ratio": 1.0,
        "revenue_growth": 24.1, "eps": 4.55, "eps_growth": 20.8,
        "revenue_bn": 386.4,
        "52w_high": 26.0, "52w_low": 14.0, "analyst_count": 8,
    },
}

SECTORS = sorted({v["sector"] for v in _BASELINE.values()})

# In-memory cache: symbol → (merged_data, unix_timestamp)
_CACHE: dict[str, tuple[dict, float]] = {}
_CACHE_TTL = 900  # 15 minutes


# ---------------------------------------------------------------------------
# Health score (0–100), computed from merged data
# ---------------------------------------------------------------------------
def _compute_health_score(d: dict) -> int:
    score = 50
    sector = d.get("sector", "")

    pe = d.get("pe_ratio")
    div_yield = d.get("dividend_yield") or 0
    high_52w = d.get("52w_high") or 0
    low_52w = d.get("52w_low") or 0
    price = d.get("price") or 0
    market_cap = d.get("market_cap") or 0
    pm = d.get("profit_margin")
    roe = d.get("roe")
    de = d.get("debt_to_equity")
    cr = d.get("current_ratio")
    rg = d.get("revenue_growth")

    if pe and pe > 0:
        if pe < 8:   score += 15
        elif pe < 15: score += 10
        elif pe < 25: score += 5
        elif pe > 40: score -= 10

    if div_yield > 8:   score += 12
    elif div_yield > 5: score += 8
    elif div_yield > 2: score += 4

    if high_52w and low_52w and price:
        rng = high_52w - low_52w
        if rng > 0:
            pct = (price - low_52w) / rng
            if pct > 0.75:   score += 8
            elif pct > 0.5:  score += 4
            elif pct < 0.25: score -= 8

    if market_cap > 1_000_000_000_000: score += 6
    elif market_cap > 500_000_000_000: score += 3

    if pm is not None:
        if pm > 30:   score += 8
        elif pm > 15: score += 5
        elif pm > 5:  score += 2
        elif pm < 0:  score -= 10

    if roe is not None:
        if roe > 25:  score += 8
        elif roe > 15: score += 5
        elif roe < 0: score -= 8

    if de is not None and sector != "Financial Services":
        if de < 0.5: score += 5
        elif de > 2: score -= 5

    if cr is not None:
        if cr > 1.5: score += 5
        elif cr < 1: score -= 5

    if rg is not None:
        if rg > 25:  score += 8
        elif rg > 10: score += 4
        elif rg < 0: score -= 5

    return max(0, min(100, round(score)))


def _generate_rating(health_score: int) -> str:
    if health_score >= 85: return "Strong Buy"
    if health_score >= 72: return "Buy"
    if health_score >= 55: return "Hold"
    if health_score >= 40: return "Sell"
    return "Strong Sell"


def _generate_strengths(d: dict) -> list[str]:
    out = []
    sector = d.get("sector", "")
    pe, dy, pm, roe = d.get("pe_ratio"), d.get("dividend_yield") or 0, d.get("profit_margin"), d.get("roe")
    de, mc, rg = d.get("debt_to_equity"), d.get("market_cap") or 0, d.get("revenue_growth")

    if pe and pe < 10:                                  out.append(f"Deep value P/E of {pe:.1f}x")
    if dy > 5:                                          out.append(f"High dividend yield of {dy:.1f}%")
    if pm and pm > 20:                                  out.append(f"Strong profit margin of {pm:.1f}%")
    if roe and roe > 20:                                out.append(f"High return on equity of {roe:.1f}%")
    if de is not None and de < 0.5 and sector != "Financial Services":
                                                        out.append("Low leverage with minimal debt")
    if mc > 1_000_000_000_000:                          out.append("Large-cap stability on the NGX")
    if rg and rg > 15:                                  out.append(f"Strong revenue growth of {rg:.1f}% YoY")
    if not out:                                         out.append(f"Established {sector} player on the NGX")
    return out[:3]


def _generate_risks(d: dict) -> list[str]:
    out = []
    sector = d.get("sector", "")
    pe, de, cr, rg = d.get("pe_ratio"), d.get("debt_to_equity"), d.get("current_ratio"), d.get("revenue_growth")

    if pe and pe > 30:                                           out.append(f"Premium valuation at {pe:.1f}x P/E")
    if de and de > 1.5 and sector != "Financial Services":       out.append("High leverage poses refinancing risk")
    if cr and cr < 1:                                            out.append("Current ratio below 1 — liquidity risk")
    if rg is not None and rg < 0:                                out.append("Declining revenue trend")

    sector_risk = {
        "Financial Services": "FX translation losses on naira depreciation",
        "Oil & Gas":          "Commodity price and production risk",
        "ICT":                "Regulatory and licence concentration risk",
        "Consumer Goods":     "Input cost inflation and FX on imports",
        "Industrial Goods":   "Energy and fuel cost pressure",
        "Agriculture":        "Weather risk and commodity price cycles",
        "Services":           "Sensitivity to consumer spending cycles",
    }
    if sector in sector_risk:
        out.append(sector_risk[sector])
    out.append("General Nigerian macroeconomic and regulatory risk")
    return out[:3]


def _generate_summary(d: dict) -> str:
    name = d.get("name", "This company")
    sector = d.get("sector", "")
    health = d.get("health_score", 50)
    pe = d.get("pe_ratio")
    dy = d.get("dividend_yield") or 0

    tone = "strong" if health >= 75 else "moderate" if health >= 55 else "challenging"
    pe_str = f" at a P/E of {pe:.1f}x" if pe else ""
    dy_str = f" with a {dy:.1f}% dividend yield" if dy > 1 else ""
    return (
        f"{name} presents a {tone} investment profile in the {sector} sector{pe_str}{dy_str}. "
        f"Health score: {health}/100."
    )


def _build_stock(symbol: str) -> dict:
    """Merge baseline fundamentals with live price data, then compute derived fields."""
    cached = _CACHE.get(symbol)
    if cached and (time.time() - cached[1]) < _CACHE_TTL:
        return cached[0]

    base = dict(_BASELINE[symbol])
    base["symbol"] = symbol

    # Overlay live price/change/volume from the NGX scraper
    # (one cached HTTP request covers all 150+ stocks — no per-symbol calls)
    from app.services.ngx_scraper import get_live_prices
    live = get_live_prices().get(symbol, {})
    base.update(live)

    # Add computed fields
    base["market_cap_bn"] = round(base["market_cap"] / 1e9, 1) if base.get("market_cap") else None
    health_score = _compute_health_score(base)
    base["health_score"] = health_score
    base["rating"]    = _generate_rating(health_score)
    base["strengths"] = _generate_strengths(base)
    base["risks"]     = _generate_risks(base)
    base["summary"]   = _generate_summary(base)
    base.setdefault("roce", None)

    _CACHE[symbol] = (base, time.time())
    return base


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------
def get_all_stocks() -> list[dict]:
    """Return all 20 NGX stocks in parallel, using cache where valid."""
    order = list(_BASELINE.keys())
    results: list[dict] = []

    with ThreadPoolExecutor(max_workers=10) as pool:
        futures = {pool.submit(_build_stock, sym): sym for sym in order}
        for future in as_completed(futures):
            try:
                results.append(future.result())
            except Exception as exc:
                print(f"[NGX] Unexpected error: {exc}")

    results.sort(key=lambda s: order.index(s["symbol"]) if s["symbol"] in order else 99)
    return results


def get_stock(symbol: str) -> Optional[dict]:
    """Fetch a single NGX stock by symbol (case-insensitive). Returns None if unknown."""
    sym = symbol.upper()
    if sym not in _BASELINE:
        return None
    return _build_stock(sym)


def screener_fields(stock: dict) -> dict:
    """Pro/Premium row — all screener columns."""
    return {k: stock.get(k) for k in (
        "symbol", "name", "sector", "price", "change_pct",
        "market_cap", "volume", "pe_ratio", "revenue_growth",
        "dividend_yield", "health_score",
    )}


def free_screener_fields(stock: dict) -> dict:
    """Free-tier row — price and basic info only, no advanced metrics."""
    return {k: stock.get(k) for k in (
        "symbol", "name", "sector", "price", "change_pct",
        "market_cap", "volume",
    )}
