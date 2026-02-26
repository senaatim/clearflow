"""
Market Data Service - Fetches real-time stock data from Yahoo Finance
"""
import yfinance as yf
from datetime import datetime, timedelta
from typing import Optional
import asyncio
from concurrent.futures import ThreadPoolExecutor, as_completed
from functools import lru_cache


class MarketDataService:
    """Service for fetching real market data."""

    @staticmethod
    def get_stock_info(symbol: str) -> dict:
        """Get comprehensive stock information."""
        try:
            ticker = yf.Ticker(symbol)
            info = ticker.info

            return {
                "symbol": symbol.upper(),
                "name": info.get("longName") or info.get("shortName", symbol),
                "current_price": info.get("currentPrice") or info.get("regularMarketPrice", 0),
                "previous_close": info.get("previousClose", 0),
                "open": info.get("open") or info.get("regularMarketOpen", 0),
                "day_high": info.get("dayHigh") or info.get("regularMarketDayHigh", 0),
                "day_low": info.get("dayLow") or info.get("regularMarketDayLow", 0),
                "volume": info.get("volume") or info.get("regularMarketVolume", 0),
                "market_cap": info.get("marketCap", 0),
                "pe_ratio": info.get("trailingPE"),
                "forward_pe": info.get("forwardPE"),
                "dividend_yield": info.get("dividendYield"),
                "fifty_two_week_high": info.get("fiftyTwoWeekHigh", 0),
                "fifty_two_week_low": info.get("fiftyTwoWeekLow", 0),
                "fifty_day_avg": info.get("fiftyDayAverage", 0),
                "two_hundred_day_avg": info.get("twoHundredDayAverage", 0),
                "sector": info.get("sector", "Unknown"),
                "industry": info.get("industry", "Unknown"),
                "description": info.get("longBusinessSummary", ""),
                "recommendation": info.get("recommendationKey", "none"),
                "target_mean_price": info.get("targetMeanPrice"),
                "analyst_count": info.get("numberOfAnalystOpinions", 0),
            }
        except Exception as e:
            print(f"Error fetching stock info for {symbol}: {e}")
            return {"symbol": symbol, "error": str(e)}

    @staticmethod
    def get_stock_history(symbol: str, period: str = "1mo") -> list[dict]:
        """Get historical price data."""
        try:
            ticker = yf.Ticker(symbol)
            hist = ticker.history(period=period)

            data = []
            for date, row in hist.iterrows():
                data.append({
                    "date": date.strftime("%Y-%m-%d"),
                    "open": round(row["Open"], 2),
                    "high": round(row["High"], 2),
                    "low": round(row["Low"], 2),
                    "close": round(row["Close"], 2),
                    "volume": int(row["Volume"]),
                })
            return data
        except Exception as e:
            print(f"Error fetching history for {symbol}: {e}")
            return []

    @staticmethod
    def get_multiple_stocks(symbols: list[str]) -> list[dict]:
        """Get data for multiple stocks."""
        results = []
        for symbol in symbols:
            data = MarketDataService.get_stock_info(symbol)
            if "error" not in data:
                results.append(data)
        return results

    @staticmethod
    def calculate_technical_indicators(symbol: str) -> dict:
        """Calculate basic technical indicators."""
        try:
            ticker = yf.Ticker(symbol)
            hist = ticker.history(period="3mo")

            if len(hist) < 20:
                return {"error": "Insufficient data"}

            closes = hist["Close"]

            # Simple Moving Averages
            sma_20 = closes.tail(20).mean()
            sma_50 = closes.tail(50).mean() if len(closes) >= 50 else None

            # Current price vs moving averages
            current_price = closes.iloc[-1]

            # RSI (14-day)
            delta = closes.diff()
            gain = (delta.where(delta > 0, 0)).rolling(window=14).mean()
            loss = (-delta.where(delta < 0, 0)).rolling(window=14).mean()
            rs = gain / loss
            rsi = 100 - (100 / (1 + rs.iloc[-1]))

            # Volatility (standard deviation of returns)
            returns = closes.pct_change().dropna()
            volatility = returns.std() * (252 ** 0.5) * 100  # Annualized

            # Price momentum (% change over periods)
            momentum_1w = ((current_price / closes.iloc[-5]) - 1) * 100 if len(closes) >= 5 else 0
            momentum_1m = ((current_price / closes.iloc[-21]) - 1) * 100 if len(closes) >= 21 else 0

            return {
                "symbol": symbol.upper(),
                "current_price": float(round(current_price, 2)),
                "sma_20": float(round(sma_20, 2)),
                "sma_50": float(round(sma_50, 2)) if sma_50 is not None else None,
                "rsi": float(round(rsi, 2)),
                "volatility": float(round(volatility, 2)),
                "momentum_1w": float(round(momentum_1w, 2)),
                "momentum_1m": float(round(momentum_1m, 2)),
                "above_sma_20": bool(current_price > sma_20),
                "above_sma_50": bool(current_price > sma_50) if sma_50 is not None else None,
                "rsi_signal": "oversold" if rsi < 30 else "overbought" if rsi > 70 else "neutral",
            }
        except Exception as e:
            print(f"Error calculating indicators for {symbol}: {e}")
            return {"symbol": symbol, "error": str(e)}

    @staticmethod
    def _fetch_index(symbol: str, name: str) -> dict | None:
        """Fetch a single market index."""
        try:
            ticker = yf.Ticker(symbol)
            info = ticker.info
            current = info.get("regularMarketPrice", 0)
            prev_close = info.get("previousClose", 0)
            change = current - prev_close
            change_pct = (change / prev_close * 100) if prev_close else 0

            return {
                "symbol": symbol,
                "name": name,
                "price": float(round(current, 2)),
                "change": float(round(change, 2)),
                "change_percent": float(round(change_pct, 2)),
            }
        except Exception as e:
            print(f"Error fetching {symbol}: {e}")
            return None

    @staticmethod
    def get_market_summary() -> dict:
        """Get overall market summary using major indices."""
        indices = {
            "^GSPC": "S&P 500",
            "^DJI": "Dow Jones",
            "^IXIC": "NASDAQ",
            "^VIX": "VIX (Volatility)",
        }

        summary = {"indices": [], "market_sentiment": "neutral"}

        # Fetch all indices in parallel
        with ThreadPoolExecutor(max_workers=4) as executor:
            futures = {
                executor.submit(MarketDataService._fetch_index, sym, name): sym
                for sym, name in indices.items()
            }
            for future in as_completed(futures):
                result = future.result()
                if result:
                    summary["indices"].append(result)

        # Sort to maintain consistent order
        order = list(indices.keys())
        summary["indices"].sort(key=lambda x: order.index(x["symbol"]) if x["symbol"] in order else 99)

        # Determine market sentiment based on S&P 500
        sp500 = next((i for i in summary["indices"] if i["symbol"] == "^GSPC"), None)
        if sp500:
            if sp500["change_percent"] > 1:
                summary["market_sentiment"] = "bullish"
            elif sp500["change_percent"] < -1:
                summary["market_sentiment"] = "bearish"

        return summary

    @staticmethod
    def _parse_news_item(item: dict) -> dict:
        """Parse a yfinance news item (v1.1.0+ format)."""
        content = item.get("content", item)
        thumbnail = content.get("thumbnail", {})
        resolutions = thumbnail.get("resolutions", []) if thumbnail else []
        thumb_url = resolutions[0].get("url", "") if resolutions else ""
        provider = content.get("provider", {})
        click_through = content.get("clickThroughUrl", {})
        canonical = content.get("canonicalUrl", {})

        return {
            "title": content.get("title", ""),
            "publisher": provider.get("displayName", "Unknown") if isinstance(provider, dict) else str(provider),
            "link": click_through.get("url", "") or canonical.get("url", ""),
            "published_at": content.get("pubDate", None),
            "type": content.get("contentType", "STORY"),
            "thumbnail": thumb_url,
            "related_symbols": [],
        }

    @staticmethod
    def get_stock_news(symbol: str, limit: int = 10) -> list[dict]:
        """Get recent news articles for a specific stock."""
        try:
            ticker = yf.Ticker(symbol)
            news = ticker.news
            articles = []

            for item in news[:limit]:
                if not item:
                    continue
                articles.append(MarketDataService._parse_news_item(item))
            return articles
        except Exception as e:
            print(f"Error fetching news for {symbol}: {e}")
            return []

    @staticmethod
    def get_market_news(limit: int = 20) -> list[dict]:
        """Get general financial news from major market tickers."""
        all_news = []
        seen_titles = set()

        # Fetch news from major indices and popular stocks
        news_sources = ["^GSPC", "^DJI", "^IXIC", "AAPL", "MSFT", "GOOGL", "NVDA"]

        for symbol in news_sources:
            try:
                ticker = yf.Ticker(symbol)
                news = ticker.news

                for item in news:
                    if not item:
                        continue
                    parsed = MarketDataService._parse_news_item(item)
                    title = parsed["title"]
                    if title and title not in seen_titles:
                        seen_titles.add(title)
                        all_news.append(parsed)
            except Exception as e:
                print(f"Error fetching news from {symbol}: {e}")
                continue

        # Sort by publish time (most recent first)
        all_news.sort(key=lambda x: x.get("published_at", ""), reverse=True)
        return all_news[:limit]

    @staticmethod
    def search_stocks(query: str, limit: int = 10) -> list[dict]:
        """Search for stocks by name or symbol."""
        try:
            # Use yfinance search (limited functionality)
            # In production, you'd use a proper search API
            ticker = yf.Ticker(query.upper())
            info = ticker.info

            if info.get("symbol"):
                return [{
                    "symbol": info.get("symbol"),
                    "name": info.get("longName") or info.get("shortName", query),
                    "sector": info.get("sector", "Unknown"),
                    "exchange": info.get("exchange", "Unknown"),
                }]
            return []
        except Exception:
            return []


# Popular stocks for recommendations
POPULAR_STOCKS = [
    "AAPL", "MSFT", "GOOGL", "AMZN", "NVDA", "META", "TSLA", "BRK-B",
    "JPM", "V", "JNJ", "WMT", "PG", "MA", "HD", "DIS", "NFLX", "PYPL",
    "VZ", "INTC", "CSCO", "PFE", "MRK", "KO", "PEP", "T", "XOM", "CVX",
]

SECTOR_ETFS = {
    "Technology": "XLK",
    "Healthcare": "XLV",
    "Financials": "XLF",
    "Energy": "XLE",
    "Consumer Discretionary": "XLY",
    "Consumer Staples": "XLP",
    "Industrials": "XLI",
    "Materials": "XLB",
    "Utilities": "XLU",
    "Real Estate": "XLRE",
}
