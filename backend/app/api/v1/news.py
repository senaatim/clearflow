from fastapi import APIRouter, Depends, Query
from typing import Optional
from datetime import datetime, timedelta
import random

from app.models.user import User
from app.models.subscription import tier_has_feature
from app.middleware.subscription import get_user_subscription
from app.api.deps import get_current_user

router = APIRouter()

_NEWS = [
    {
        "id": "n1",
        "title": "Dangote Cement Reports Record Q3 Revenue Amid Volume Growth",
        "source": "BusinessDay",
        "category": "earnings",
        "sentiment": "positive",
        "sentiment_score": 0.82,
        "summary": "Dangote Cement posted a 23% year-on-year revenue increase in Q3, driven by volume growth and improved pricing. Analysts raised their 12-month targets following the release.",
        "related_symbols": ["DANGCEM"],
        "published_at": (datetime.utcnow() - timedelta(hours=2)).isoformat(),
        "read_time": 3,
    },
    {
        "id": "n2",
        "title": "CBN Holds MPR at 26.75% as Inflation Pressure Eases",
        "source": "Nairametrics",
        "category": "policy",
        "sentiment": "neutral",
        "sentiment_score": 0.51,
        "summary": "The Central Bank of Nigeria's Monetary Policy Committee voted unanimously to hold the benchmark rate at 26.75%, citing early signs of disinflation while noting ongoing FX volatility.",
        "related_symbols": ["GTCO", "ZENITHBANK", "ACCESSCORP", "UBA"],
        "published_at": (datetime.utcnow() - timedelta(hours=4)).isoformat(),
        "read_time": 4,
    },
    {
        "id": "n3",
        "title": "NGX All-Share Index Climbs 1.4% on Banking Sector Rally",
        "source": "The Punch",
        "category": "market",
        "sentiment": "positive",
        "sentiment_score": 0.75,
        "summary": "The NGX All-Share Index gained 1.4% in today's session, led by a broad-based rally in financial services stocks. Trading volume was 42% above the 30-day average.",
        "related_symbols": ["GTCO", "ZENITHBANK", "FBNH", "STANBIC"],
        "published_at": (datetime.utcnow() - timedelta(hours=5)).isoformat(),
        "read_time": 2,
    },
    {
        "id": "n4",
        "title": "MTN Nigeria Mobile Money Users Cross 10 Million Milestone",
        "source": "Techcabal",
        "category": "company",
        "sentiment": "positive",
        "sentiment_score": 0.88,
        "summary": "MTN Nigeria's MoMo mobile wallet reached 10 million active users, a 45% jump year-over-year. Management expects the fintech unit to contribute 15% of group revenue by 2026.",
        "related_symbols": ["MTNN"],
        "published_at": (datetime.utcnow() - timedelta(hours=7)).isoformat(),
        "read_time": 3,
    },
    {
        "id": "n5",
        "title": "Seplat Energy Inches Closer to NNPC MPNU Acquisition Approval",
        "source": "Reuters Africa",
        "category": "company",
        "sentiment": "positive",
        "sentiment_score": 0.79,
        "summary": "Seplat Energy's proposed acquisition of ExxonMobil's NNPC joint venture is reportedly in its final regulatory review stage. Completion would more than triple Seplat's production capacity.",
        "related_symbols": ["SEPLAT"],
        "published_at": (datetime.utcnow() - timedelta(hours=9)).isoformat(),
        "read_time": 4,
    },
    {
        "id": "n6",
        "title": "Nigeria's Headline Inflation Falls for Third Consecutive Month",
        "source": "NBS Statistical Release",
        "category": "economy",
        "sentiment": "positive",
        "sentiment_score": 0.68,
        "summary": "Nigeria's headline inflation rate moderated to 31.2% in October from 32.7% in September, the third consecutive monthly decline. The NBS attributed the drop to a slower rise in food prices.",
        "related_symbols": ["NESTLE", "BUAFOODS"],
        "published_at": (datetime.utcnow() - timedelta(hours=11)).isoformat(),
        "read_time": 3,
    },
    {
        "id": "n7",
        "title": "Zenith Bank to Pay ₦3.50 Interim Dividend Amid Strong H1 Profit",
        "source": "Vanguard",
        "category": "earnings",
        "sentiment": "positive",
        "sentiment_score": 0.91,
        "summary": "Zenith Bank declared an interim dividend of ₦3.50 per share following a 52% jump in pre-tax profit for the first half of the year. This represents a 40% increase from the prior year's interim dividend.",
        "related_symbols": ["ZENITHBANK"],
        "published_at": (datetime.utcnow() - timedelta(hours=13)).isoformat(),
        "read_time": 2,
    },
    {
        "id": "n8",
        "title": "Naira Weakens Against Dollar at NAFEM Window",
        "source": "Nairametrics",
        "category": "economy",
        "sentiment": "negative",
        "sentiment_score": 0.21,
        "summary": "The naira depreciated to ₦1,615 per dollar at the official NAFEM window, extending losses for the third consecutive session as dollar demand outstripped supply.",
        "related_symbols": ["MTNN", "AIRTELAFRI", "ACCESSCORP"],
        "published_at": (datetime.utcnow() - timedelta(hours=15)).isoformat(),
        "read_time": 2,
    },
    {
        "id": "n9",
        "title": "Access Holdings Launches Africa's Largest Trade Finance Hub",
        "source": "BusinessDay",
        "category": "company",
        "sentiment": "positive",
        "sentiment_score": 0.72,
        "summary": "Access Holdings unveiled a dedicated ₦500bn trade finance facility targeting SMEs across its 24 African markets. Management says the initiative is central to its strategy of monetising its pan-African network.",
        "related_symbols": ["ACCESSCORP"],
        "published_at": (datetime.utcnow() - timedelta(hours=18)).isoformat(),
        "read_time": 3,
    },
    {
        "id": "n10",
        "title": "BUA Foods Profit Surges 112% on Strong Pasta and Sugar Demand",
        "source": "The Punch",
        "category": "earnings",
        "sentiment": "positive",
        "sentiment_score": 0.94,
        "summary": "BUA Foods posted a 112% jump in after-tax profit for the nine months to September, beating analyst expectations by a wide margin. Management cited market share gains in pasta and expanded sugar refining capacity.",
        "related_symbols": ["BUAFOODS"],
        "published_at": (datetime.utcnow() - timedelta(hours=20)).isoformat(),
        "read_time": 3,
    },
    {
        "id": "n11",
        "title": "FG Approves New Petroleum Fiscal Incentives for Deepwater Projects",
        "source": "Daily Trust",
        "category": "policy",
        "sentiment": "positive",
        "sentiment_score": 0.65,
        "summary": "The Federal Government approved revised fiscal terms for deepwater oil and gas projects, cutting royalty rates by 5 percentage points to attract new investment.",
        "related_symbols": ["SEPLAT", "CONOIL"],
        "published_at": (datetime.utcnow() - timedelta(hours=22)).isoformat(),
        "read_time": 4,
    },
    {
        "id": "n12",
        "title": "GTCO Fintech Arm HabariPay Applies for Full Payment Service Bank Licence",
        "source": "Techcabal",
        "category": "company",
        "sentiment": "positive",
        "sentiment_score": 0.77,
        "summary": "Guaranty Trust Holding Company's fintech subsidiary, HabariPay, has applied for a Payment Service Bank licence from the CBN, paving the way for a full retail banking product suite.",
        "related_symbols": ["GTCO"],
        "published_at": (datetime.utcnow() - timedelta(hours=26)).isoformat(),
        "read_time": 3,
    },
    {
        "id": "n13",
        "title": "Lafarge Africa Posts Improved EBITDA on Cost Optimisation Drive",
        "source": "Bloomberg Africa",
        "category": "earnings",
        "sentiment": "neutral",
        "sentiment_score": 0.55,
        "summary": "Lafarge Africa's nine-month EBITDA margin improved by 3.2 percentage points to 28.4% as the company's fuel switching and energy efficiency programme began to deliver tangible savings.",
        "related_symbols": ["WAPCO"],
        "published_at": (datetime.utcnow() - timedelta(hours=30)).isoformat(),
        "read_time": 3,
    },
    {
        "id": "n14",
        "title": "Stock Market Outlook: Analysts Favour Banks and Agri Stocks for Q4",
        "source": "Coronation Research",
        "category": "market",
        "sentiment": "positive",
        "sentiment_score": 0.70,
        "summary": "Analysts at Coronation Asset Management recommend overweighting banks and agricultural stocks heading into Q4, citing undervaluation, high dividend yields, and a potential rate-cut cycle in 2025.",
        "related_symbols": ["GTCO", "ZENITHBANK", "OKOMUOIL", "PRESCO"],
        "published_at": (datetime.utcnow() - timedelta(hours=34)).isoformat(),
        "read_time": 5,
    },
    {
        "id": "n15",
        "title": "Airtel Africa Sees Q2 Revenue Growth Slow on FX Headwinds",
        "source": "Reuters Africa",
        "category": "earnings",
        "sentiment": "negative",
        "sentiment_score": 0.28,
        "summary": "Airtel Africa's Q2 revenue growth slowed to 8.3% in constant currency terms, with reported dollar revenue flat due to currency devaluations in Nigeria, Kenya, and Zambia.",
        "related_symbols": ["AIRTELAFRI"],
        "published_at": (datetime.utcnow() - timedelta(hours=38)).isoformat(),
        "read_time": 3,
    },
]

_CATEGORIES = ["market", "economy", "company", "earnings", "policy"]

_FREE_LIMIT = 5


@router.get("")
async def get_news(
    category: Optional[str] = None,
    symbol: Optional[str] = None,
    limit: int = Query(20, ge=1, le=50),
    current_user: User = Depends(get_current_user),
):
    subscription = await get_user_subscription(current_user.id)
    is_free = not subscription or not tier_has_feature(subscription.tier, "full_screener")

    articles = list(_NEWS)

    if category and category in _CATEGORIES:
        articles = [a for a in articles if a["category"] == category]

    if symbol:
        articles = [a for a in articles if symbol.upper() in a.get("related_symbols", [])]

    # Free tier: max 5 articles
    if is_free:
        articles = articles[:_FREE_LIMIT]
    else:
        articles = articles[:limit]

    return {
        "articles": articles,
        "total_count": len(articles),
        "is_limited": is_free,
        "categories": _CATEGORIES,
    }
