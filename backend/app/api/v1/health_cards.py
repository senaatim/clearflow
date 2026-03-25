from fastapi import APIRouter, Depends, HTTPException, status

from app.models.user import User
from app.models.subscription import tier_has_feature
from app.middleware.subscription import get_user_subscription
from app.api.deps import get_current_user

router = APIRouter()

_HEALTH_CARDS = {
    "DANGCEM": {
        "symbol": "DANGCEM", "name": "Dangote Cement Plc", "sector": "Industrial Goods",
        "price": 625.00, "change_pct": 1.2, "health_score": 82,
        "rating": "Strong Buy", "analyst_count": 12,
        "revenue_bn": 2140.5, "revenue_growth": 18.5,
        "profit_margin": 28.4, "ebitda_margin": 38.1,
        "pe_ratio": 14.3, "pb_ratio": 3.1, "ps_ratio": 4.0,
        "debt_to_equity": 0.42, "current_ratio": 1.8, "quick_ratio": 1.3,
        "roe": 22.5, "roa": 14.1, "roce": 19.8,
        "eps": 43.7, "eps_growth": 15.2,
        "dividend_yield": 4.2, "payout_ratio": 60.2,
        "market_cap_bn": 10650.0,
        "52w_high": 710.0, "52w_low": 410.0,
        "strengths": ["Market leader in Nigerian cement", "Strong cash generation", "Pan-African expansion"],
        "risks": ["FX exposure on imported fuel", "Energy cost pressure", "Regulatory risk"],
        "summary": "Dangote Cement maintains a dominant market position with solid margins and consistent dividend payments. Well-positioned for pan-African growth.",
    },
    "GTCO": {
        "symbol": "GTCO", "name": "Guaranty Trust Holding Co Plc", "sector": "Financial Services",
        "price": 52.80, "change_pct": -0.8, "health_score": 88,
        "rating": "Buy", "analyst_count": 15,
        "revenue_bn": 612.3, "revenue_growth": 22.3,
        "profit_margin": 41.2, "ebitda_margin": 48.5,
        "pe_ratio": 5.1, "pb_ratio": 1.4, "ps_ratio": 2.1,
        "debt_to_equity": 5.2, "current_ratio": 1.1, "quick_ratio": 1.0,
        "roe": 28.4, "roa": 4.2, "roce": 24.1,
        "eps": 10.35, "eps_growth": 18.7,
        "dividend_yield": 7.6, "payout_ratio": 38.8,
        "market_cap_bn": 1552.0,
        "52w_high": 58.5, "52w_low": 32.1,
        "strengths": ["Highest ROE among tier-1 banks", "Strong digital platform (HabariPay)", "Low NPL ratio"],
        "risks": ["Interest rate sensitivity", "FX translation losses", "Competition from fintechs"],
        "summary": "GTCO is the most profitable large-cap bank in Nigeria with class-leading returns and a growing fintech arm. Attractive dividend yield.",
    },
    "MTNN": {
        "symbol": "MTNN", "name": "MTN Nigeria Communications Plc", "sector": "ICT",
        "price": 198.50, "change_pct": 0.5, "health_score": 75,
        "rating": "Hold", "analyst_count": 18,
        "revenue_bn": 1050.8, "revenue_growth": 30.5,
        "profit_margin": 18.2, "ebitda_margin": 51.4,
        "pe_ratio": 22.1, "pb_ratio": 4.8, "ps_ratio": 4.0,
        "debt_to_equity": 2.1, "current_ratio": 0.8, "quick_ratio": 0.7,
        "roe": 21.6, "roa": 6.5, "roce": 14.2,
        "eps": 8.98, "eps_growth": 12.1,
        "dividend_yield": 3.1, "payout_ratio": 68.5,
        "market_cap_bn": 4021.0,
        "52w_high": 250.0, "52w_low": 155.0,
        "strengths": ["Largest telecom by subscribers", "Strong data revenue growth", "Fintech (MoMo) optionality"],
        "risks": ["Heavy naira depreciation impact", "Regulatory fines exposure", "High debt load"],
        "summary": "MTN Nigeria is a dominant telecom with strong data and fintech growth, but current valuation prices in significant future growth.",
    },
    "ZENITHBANK": {
        "symbol": "ZENITHBANK", "name": "Zenith Bank Plc", "sector": "Financial Services",
        "price": 38.20, "change_pct": 1.5, "health_score": 84,
        "rating": "Strong Buy", "analyst_count": 14,
        "revenue_bn": 1124.6, "revenue_growth": 28.7,
        "profit_margin": 35.8, "ebitda_margin": 44.2,
        "pe_ratio": 3.9, "pb_ratio": 1.1, "ps_ratio": 1.4,
        "debt_to_equity": 5.8, "current_ratio": 1.2, "quick_ratio": 1.1,
        "roe": 26.1, "roa": 3.9, "roce": 22.3,
        "eps": 9.79, "eps_growth": 24.5,
        "dividend_yield": 9.2, "payout_ratio": 35.9,
        "market_cap_bn": 1199.0,
        "52w_high": 42.5, "52w_low": 25.0,
        "strengths": ["One of Nigeria's most profitable banks", "Very high dividend yield", "Strong capital ratios"],
        "risks": ["Elevated NPL risk", "FX volatility", "Regulatory capital requirements"],
        "summary": "Zenith Bank offers compelling value with a single-digit P/E, high ROE, and an exceptional dividend yield above 9%.",
    },
    "ACCESSCORP": {
        "symbol": "ACCESSCORP", "name": "Access Holdings Plc", "sector": "Financial Services",
        "price": 22.50, "change_pct": -1.1, "health_score": 79,
        "rating": "Buy", "analyst_count": 11,
        "revenue_bn": 1486.2, "revenue_growth": 35.2,
        "profit_margin": 14.8, "ebitda_margin": 32.5,
        "pe_ratio": 3.5, "pb_ratio": 0.9, "ps_ratio": 0.5,
        "debt_to_equity": 7.1, "current_ratio": 1.0, "quick_ratio": 0.9,
        "roe": 24.8, "roa": 2.9, "roce": 18.5,
        "eps": 6.43, "eps_growth": 31.2,
        "dividend_yield": 6.8, "payout_ratio": 23.8,
        "market_cap_bn": 797.0,
        "52w_high": 28.0, "52w_low": 16.5,
        "strengths": ["Africa's largest bank by assets", "Fast revenue growth", "Diversified pan-African presence"],
        "risks": ["Integration risk from acquisitions", "High leverage", "Weaker margins vs peers"],
        "summary": "Access Holdings trades at a discount to peers despite strong growth, making it an attractive value opportunity for patient investors.",
    },
    "SEPLAT": {
        "symbol": "SEPLAT", "name": "Seplat Energy Plc", "sector": "Oil & Gas",
        "price": 2300.00, "change_pct": 2.1, "health_score": 71,
        "rating": "Buy", "analyst_count": 9,
        "revenue_bn": 412.8, "revenue_growth": 45.3,
        "profit_margin": 31.5, "ebitda_margin": 62.1,
        "pe_ratio": 8.7, "pb_ratio": 2.1, "ps_ratio": 2.7,
        "debt_to_equity": 0.78, "current_ratio": 1.6, "quick_ratio": 1.4,
        "roe": 18.9, "roa": 10.5, "roce": 16.2,
        "eps": 264.4, "eps_growth": 38.7,
        "dividend_yield": 2.5, "payout_ratio": 21.7,
        "market_cap_bn": 1350.0,
        "52w_high": 2850.0, "52w_low": 1450.0,
        "strengths": ["Low-cost upstream producer", "Strong EBITDA margins", "NNPC acquisition upside"],
        "risks": ["Oil price volatility", "Gas pipeline constraints", "Regulatory delays"],
        "summary": "Seplat is Nigeria's premier independent E&P with high margins and significant production growth potential from the NNPC MPNU acquisition.",
    },
    "AIRTELAFRI": {
        "symbol": "AIRTELAFRI", "name": "Airtel Africa Plc", "sector": "ICT",
        "price": 1450.00, "change_pct": 0.3, "health_score": 77,
        "rating": "Hold", "analyst_count": 16,
        "revenue_bn": 920.5, "revenue_growth": 25.8,
        "profit_margin": 16.4, "ebitda_margin": 48.2,
        "pe_ratio": 18.4, "pb_ratio": 3.6, "ps_ratio": 3.0,
        "debt_to_equity": 1.8, "current_ratio": 0.9, "quick_ratio": 0.8,
        "roe": 19.6, "roa": 5.8, "roce": 13.4,
        "eps": 78.8, "eps_growth": 18.2,
        "dividend_yield": 1.8, "payout_ratio": 33.1,
        "market_cap_bn": 2750.0,
        "52w_high": 1720.0, "52w_low": 1100.0,
        "strengths": ["14-country African footprint", "Mobile money (Airtel Money) growth", "Strong data penetration"],
        "risks": ["FX headwinds in key markets", "Debt servicing costs", "Regulatory complexity"],
        "summary": "Airtel Africa offers broad pan-African exposure with strong mobile money optionality, though near-term FX headwinds weigh on earnings.",
    },
    "NESTLE": {
        "symbol": "NESTLE", "name": "Nestle Nigeria Plc", "sector": "Consumer Goods",
        "price": 1050.00, "change_pct": -0.5, "health_score": 80,
        "rating": "Hold", "analyst_count": 8,
        "revenue_bn": 631.4, "revenue_growth": 12.4,
        "profit_margin": 10.8, "ebitda_margin": 22.6,
        "pe_ratio": 31.2, "pb_ratio": 5.8, "ps_ratio": 3.4,
        "debt_to_equity": 0.22, "current_ratio": 1.5, "quick_ratio": 0.9,
        "roe": 23.1, "roa": 12.4, "roce": 20.8,
        "eps": 33.7, "eps_growth": 8.4,
        "dividend_yield": 2.1, "payout_ratio": 65.6,
        "market_cap_bn": 832.0,
        "52w_high": 1200.0, "52w_low": 780.0,
        "strengths": ["Premium brand portfolio (Milo, Maggi, Golden Morn)", "Low debt", "Loyal consumer base"],
        "risks": ["Premium valuation", "Input cost inflation", "FX impact on imports"],
        "summary": "Nestle Nigeria benefits from iconic brands and low leverage, but its premium valuation leaves limited margin of safety.",
    },
    "OKOMUOIL": {
        "symbol": "OKOMUOIL", "name": "Okomu Oil Palm Plc", "sector": "Agriculture",
        "price": 310.00, "change_pct": 1.6, "health_score": 86,
        "rating": "Strong Buy", "analyst_count": 6,
        "revenue_bn": 98.4, "revenue_growth": 20.3,
        "profit_margin": 42.5, "ebitda_margin": 55.3,
        "pe_ratio": 7.5, "pb_ratio": 2.8, "ps_ratio": 3.2,
        "debt_to_equity": 0.18, "current_ratio": 2.4, "quick_ratio": 1.8,
        "roe": 32.5, "roa": 24.1, "roce": 29.8,
        "eps": 41.3, "eps_growth": 17.8,
        "dividend_yield": 6.5, "payout_ratio": 48.7,
        "market_cap_bn": 296.0,
        "52w_high": 358.0, "52w_low": 215.0,
        "strengths": ["Highest ROE in agriculture sector", "Near-zero debt", "Beneficiary of agro-commodity price tailwinds"],
        "risks": ["Concentration in palm oil", "Weather risk", "Low liquidity"],
        "summary": "Okomu Oil is a best-in-class agribusiness with exceptional margins, negligible debt, and strong returns — trading at an attractive valuation.",
    },
    "UBA": {
        "symbol": "UBA", "name": "United Bank for Africa Plc", "sector": "Financial Services",
        "price": 26.40, "change_pct": 2.3, "health_score": 80,
        "rating": "Buy", "analyst_count": 13,
        "revenue_bn": 942.1, "revenue_growth": 29.8,
        "profit_margin": 24.6, "ebitda_margin": 38.9,
        "pe_ratio": 4.0, "pb_ratio": 1.0, "ps_ratio": 0.9,
        "debt_to_equity": 6.1, "current_ratio": 1.1, "quick_ratio": 1.0,
        "roe": 22.8, "roa": 3.2, "roce": 19.4,
        "eps": 6.60, "eps_growth": 27.3,
        "dividend_yield": 7.5, "payout_ratio": 30.0,
        "market_cap_bn": 903.0,
        "52w_high": 30.0, "52w_low": 18.5,
        "strengths": ["20-country African presence", "Fast earnings growth", "Strong capital adequacy"],
        "risks": ["FX losses across African operations", "Rising NPLs in subsidiaries", "Thin margins"],
        "summary": "UBA offers pan-African diversification at an attractive valuation with strong earnings momentum and a solid dividend.",
    },
}

# Free tier limit — max 3 health cards per session (in-memory, resets on restart)
_FREE_CARD_COUNTS: dict[str, int] = {}
_FREE_LIMIT = 3


@router.get("/")
async def list_health_cards(current_user: User = Depends(get_current_user)):
    subscription = await get_user_subscription(current_user.id)
    is_free = not subscription or not tier_has_feature(subscription.tier, "health_cards")
    # Even free users get the cards feature; just limited count
    is_full = subscription and tier_has_feature(subscription.tier, "full_screener")

    cards = list(_HEALTH_CARDS.values())

    if not is_full:
        # Free tier: return summary only (no detailed metrics), capped count
        viewed = _FREE_CARD_COUNTS.get(current_user.id, 0)
        remaining = max(0, _FREE_LIMIT - viewed)
        cards_out = []
        for card in cards:
            cards_out.append({
                "symbol": card["symbol"],
                "name": card["name"],
                "sector": card["sector"],
                "price": card["price"],
                "change_pct": card["change_pct"],
                "health_score": card["health_score"],
                "rating": card["rating"],
                "summary": card["summary"],
            })
        return {"cards": cards_out, "is_limited": True, "cards_remaining": remaining}

    return {"cards": cards, "is_limited": False, "cards_remaining": None}


@router.get("/{symbol}")
async def get_health_card(symbol: str, current_user: User = Depends(get_current_user)):
    card = _HEALTH_CARDS.get(symbol.upper())
    if not card:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Health card not found for symbol: {symbol}")

    subscription = await get_user_subscription(current_user.id)
    is_full = subscription and tier_has_feature(subscription.tier, "full_screener")

    if not is_full:
        viewed = _FREE_CARD_COUNTS.get(current_user.id, 0)
        if viewed >= _FREE_LIMIT:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Free tier limit reached ({_FREE_LIMIT} detailed cards per session). Upgrade to ClearFlow Pro for unlimited access.",
            )
        _FREE_CARD_COUNTS[current_user.id] = viewed + 1

    return card
