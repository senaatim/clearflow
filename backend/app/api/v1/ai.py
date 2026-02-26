"""
AI Advisor API Endpoints
"""
import asyncio
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

from app.api.deps import get_current_user
from app.models.user import User
from app.services.ai_advisor import get_ai_advisor
from app.services.market_data import MarketDataService

router = APIRouter()


class StockAnalysisRequest(BaseModel):
    symbol: str


class PortfolioAnalysisRequest(BaseModel):
    holdings: list[dict]


class QuestionRequest(BaseModel):
    question: str
    context: Optional[dict] = None


class RecommendationRequest(BaseModel):
    symbols: Optional[list[str]] = None
    count: int = 5


@router.get("/stock/{symbol}")
async def analyze_stock(
    symbol: str,
    current_user: User = Depends(get_current_user),
):
    """Get AI analysis for a specific stock."""
    advisor = get_ai_advisor()
    analysis = await asyncio.to_thread(advisor.analyze_stock, symbol.upper())

    if "error" in analysis:
        raise HTTPException(status_code=404, detail=analysis["error"])

    return analysis


@router.get("/stock/{symbol}/quote")
async def get_stock_quote(
    symbol: str,
    current_user: User = Depends(get_current_user),
):
    """Get real-time stock quote."""
    service = MarketDataService()
    data = await asyncio.to_thread(service.get_stock_info, symbol.upper())

    if "error" in data:
        raise HTTPException(status_code=404, detail=f"Stock {symbol} not found")

    return data


@router.get("/stock/{symbol}/history")
async def get_stock_history(
    symbol: str,
    period: str = Query("1mo", regex="^(1d|5d|1mo|3mo|6mo|1y|2y|5y|max)$"),
    current_user: User = Depends(get_current_user),
):
    """Get historical price data for a stock."""
    service = MarketDataService()
    data = await asyncio.to_thread(service.get_stock_history, symbol.upper(), period)

    if not data:
        raise HTTPException(status_code=404, detail=f"No history found for {symbol}")

    return {"symbol": symbol.upper(), "period": period, "data": data}


@router.get("/stock/{symbol}/technicals")
async def get_technical_indicators(
    symbol: str,
    current_user: User = Depends(get_current_user),
):
    """Get technical indicators for a stock."""
    service = MarketDataService()
    data = await asyncio.to_thread(service.calculate_technical_indicators, symbol.upper())

    if "error" in data:
        raise HTTPException(status_code=404, detail=data["error"])

    return data


@router.post("/recommendations")
async def generate_recommendations(
    request: RecommendationRequest,
    current_user: User = Depends(get_current_user),
):
    """Generate AI-powered stock recommendations."""
    advisor = get_ai_advisor()
    recommendations = await asyncio.to_thread(
        advisor.generate_recommendations,
        request.symbols,
        request.count,
    )

    return {
        "recommendations": recommendations,
        "count": len(recommendations),
        "generated_at": datetime.utcnow().isoformat(),
    }


@router.get("/recommendations/quick")
async def get_quick_recommendations(
    count: int = Query(5, ge=1, le=10),
    current_user: User = Depends(get_current_user),
):
    """Get quick AI recommendations from popular stocks."""
    advisor = get_ai_advisor()
    recommendations = await asyncio.to_thread(advisor.generate_recommendations, None, count)

    return {
        "recommendations": recommendations,
        "count": len(recommendations),
        "generated_at": datetime.utcnow().isoformat(),
    }


@router.post("/portfolio/analyze")
async def analyze_portfolio(
    request: PortfolioAnalysisRequest,
    current_user: User = Depends(get_current_user),
):
    """Get AI analysis of your portfolio."""
    if not request.holdings:
        raise HTTPException(status_code=400, detail="No holdings provided")

    advisor = get_ai_advisor()
    analysis = await asyncio.to_thread(advisor.analyze_portfolio, request.holdings)

    if "error" in analysis:
        raise HTTPException(status_code=400, detail=analysis["error"])

    return analysis


@router.get("/market/summary")
async def get_market_summary(
    current_user: User = Depends(get_current_user),
):
    """Get current market summary with major indices."""
    service = MarketDataService()
    return await asyncio.to_thread(service.get_market_summary)


@router.get("/market/insights")
async def get_market_insights(
    current_user: User = Depends(get_current_user),
):
    """Get AI-generated market insights."""
    advisor = get_ai_advisor()
    return await asyncio.to_thread(advisor.get_market_insights)


@router.post("/ask")
async def ask_question(
    request: QuestionRequest,
    current_user: User = Depends(get_current_user),
):
    """Ask the AI advisor a question."""
    if not request.question or len(request.question.strip()) < 1:
        raise HTTPException(status_code=400, detail="Please enter a question")

    print(f"[AI ASK] Question received: '{request.question}'")
    advisor = get_ai_advisor()
    answer = await asyncio.to_thread(advisor.answer_question, request.question, request.context)
    print(f"[AI ASK] Answer starts with: '{answer[:60]}...'")

    return {
        "question": request.question,
        "answer": answer,
        "disclaimer": "This is AI-generated advice for informational purposes only. Always consult a financial advisor before making investment decisions.",
        "generated_at": datetime.utcnow().isoformat(),
    }


@router.get("/news")
async def get_market_news(
    limit: int = Query(20, ge=1, le=50),
    current_user: User = Depends(get_current_user),
):
    """Get general financial news with AI summary."""
    service = MarketDataService()
    articles = await asyncio.to_thread(service.get_market_news, limit)

    # Get AI summary of the news
    advisor = get_ai_advisor()
    ai_summary = await asyncio.to_thread(advisor.summarize_news, articles)

    return {
        "articles": articles,
        "ai_summary": ai_summary,
        "count": len(articles),
        "generated_at": datetime.utcnow().isoformat(),
    }


@router.get("/news/{symbol}")
async def get_stock_news(
    symbol: str,
    limit: int = Query(10, ge=1, le=30),
    current_user: User = Depends(get_current_user),
):
    """Get news for a specific stock with AI summary."""
    service = MarketDataService()
    articles = await asyncio.to_thread(service.get_stock_news, symbol.upper(), limit)

    if not articles:
        return {
            "symbol": symbol.upper(),
            "articles": [],
            "ai_summary": None,
            "count": 0,
            "generated_at": datetime.utcnow().isoformat(),
        }

    # Get AI summary
    advisor = get_ai_advisor()
    ai_summary = await asyncio.to_thread(advisor.summarize_news, articles)

    return {
        "symbol": symbol.upper(),
        "articles": articles,
        "ai_summary": ai_summary,
        "count": len(articles),
        "generated_at": datetime.utcnow().isoformat(),
    }


@router.get("/search")
async def search_stocks(
    query: str = Query(..., min_length=1),
    limit: int = Query(10, ge=1, le=50),
    current_user: User = Depends(get_current_user),
):
    """Search for stocks by name or symbol."""
    service = MarketDataService()
    results = await asyncio.to_thread(service.search_stocks, query, limit)

    return {"query": query, "results": results, "count": len(results)}
