"""
AI Advisor Service - Uses Google Gemini to generate intelligent stock recommendations
"""
import os
import json
from pathlib import Path
from typing import Optional
from datetime import datetime

# Load .env using an absolute path so it works regardless of the server's
# working directory. Path: this file → app/services → app → backend → .env
_env_file = Path(__file__).resolve().parent.parent.parent / ".env"
try:
    from dotenv import load_dotenv
    load_dotenv(_env_file, override=False)
except ImportError:
    pass

try:
    import google.generativeai as genai
except ImportError:
    genai = None
from app.config import settings
from app.services.market_data import MarketDataService, POPULAR_STOCKS


class AIAdvisorService:
    """AI-powered investment advisor using Google Gemini."""

    def __init__(self, api_key: Optional[str] = None):
        # Try all sources: passed arg → pydantic settings → raw OS env
        self.api_key = api_key or settings.gemini_api_key or os.getenv("GEMINI_API_KEY", "")
        print(f"[AI] API key loaded: {'YES (len=' + str(len(self.api_key)) + ')' if self.api_key else 'NO'}")
        self.model = None
        if self.api_key and genai:
            try:
                genai.configure(api_key=self.api_key)
                self.model = genai.GenerativeModel('gemini-2.0-flash')
                print(f"[AI] Gemini initialized (primary: gemini-2.0-flash)")
            except Exception as e:
                print(f"[AI] Failed to initialize Gemini client: {e}")
        else:
            print(f"[AI] Running in mock mode (no API key or genai not installed)")
        self.market_service = MarketDataService()

    # Models tried in order — falls to next on 429/404
    _MODELS = [
        'gemini-2.0-flash',       # Primary — Gemini 2.0 Flash
        'gemini-2.0-flash-lite',  # Fallback — lighter 2.0 model, more free quota
        'gemini-1.5-flash',       # Last resort free-tier fallback
    ]

    def _call_gemini(self, messages: list, max_tokens: int = 1000) -> str:
        """Make a call to Gemini API, trying free-tier models in order."""
        if not self.api_key or not genai:
            return self._get_mock_response(messages)

        genai.configure(api_key=self.api_key)

        system_prompt = ""
        user_parts = []
        for msg in messages:
            if msg["role"] == "system":
                system_prompt = msg["content"]
            elif msg["role"] == "user":
                user_parts.append(msg["content"])
        user_prompt = "\n\n".join(user_parts)

        last_error = None
        for model_name in self._MODELS:
            try:
                model = genai.GenerativeModel(
                    model_name,
                    system_instruction=system_prompt if system_prompt else None,
                )
                response = model.generate_content(
                    user_prompt,
                    generation_config=genai.types.GenerationConfig(
                        max_output_tokens=max_tokens,
                        temperature=0.7,
                    )
                )
                print(f"[AI] Response from {model_name}")
                return response.text
            except Exception as e:
                err_str = str(e)
                print(f"[AI] {model_name} error: {err_str[:120]}")
                last_error = e
                # Only retry on quota/not-found errors; stop on auth errors
                if "429" in err_str or "404" in err_str:
                    continue
                break

        print(f"[AI] All models failed, using mock response")
        return self._get_mock_response(messages)

    def _get_mock_response(self, messages: list) -> str:
        """Return mock AI response when API is not available."""
        # Extract context from messages
        user_msg = messages[-1]["content"] if messages else ""

        if "analyze" in user_msg.lower() and "portfolio" in user_msg.lower():
            return json.dumps({
                "analysis": "Your portfolio shows good diversification across sectors. Technology holdings are performing well, though slightly overweight at 35% of total value.",
                "risk_level": "moderate",
                "suggestions": [
                    "Consider rebalancing technology exposure to 25-30%",
                    "Add some defensive positions in utilities or consumer staples",
                    "Your dividend income could be improved with high-yield ETFs"
                ]
            })

        if "financial news" in user_msg.lower() or "news headlines" in user_msg.lower():
            return json.dumps({
                "summary": "Markets are experiencing mixed activity with technology and AI stocks leading gains. Major indices are showing moderate volatility as investors digest economic data and corporate earnings reports.",
                "sentiment": "neutral",
                "key_topics": ["AI and technology growth", "Corporate earnings", "Economic indicators", "Federal Reserve policy", "Global markets"],
                "market_impact": "Overall market sentiment remains cautiously optimistic, with sector rotation favoring growth stocks. Investors should monitor upcoming economic data releases for potential market-moving events.",
                "notable_stories": [
                    "Technology sector continues to benefit from AI investment surge",
                    "Major earnings reports exceed analyst expectations",
                    "Economic indicators suggest resilient consumer spending"
                ]
            })

        if "analyze this stock" in user_msg.lower():
            return json.dumps({
                "action": "hold",
                "confidence": 0.72,
                "risk_level": "medium",
                "target_price": 250.00,
                "time_horizon": "long_term",
                "reasoning": "The stock shows solid fundamentals with steady revenue growth. Technical indicators suggest it is trading near fair value. Consider accumulating on pullbacks for long-term positions.",
                "key_factors": [
                    "Strong earnings growth and consistent revenue increases",
                    "Favorable industry tailwinds and market positioning",
                    "Technical indicators showing consolidation near support levels"
                ],
                "risks": [
                    "Elevated valuation multiples relative to historical averages",
                    "Macroeconomic headwinds including interest rate uncertainty",
                    "Increased competition in key market segments"
                ]
            })

        if "market conditions" in user_msg.lower() or "investment insights" in user_msg.lower():
            return json.dumps({
                "market_outlook": "Markets are showing mixed signals with technology leading gains while defensive sectors lag. Investors should maintain balanced positions.",
                "sentiment": "neutral",
                "sectors_to_watch": ["Technology", "Healthcare", "Energy"],
                "sectors_to_avoid": ["Real Estate", "Utilities"],
                "key_themes": ["AI-driven growth", "Interest rate expectations", "Earnings season momentum"],
                "risk_factors": ["Inflation persistence", "Geopolitical tensions", "Valuation concerns in growth stocks"],
                "actionable_tips": [
                    "Consider dollar-cost averaging into quality tech names",
                    "Review portfolio allocation for overexposure to any single sector",
                    "Keep 5-10% in cash for buying opportunities on pullbacks"
                ]
            })

        if "provide your analysis in json" in user_msg.lower() and "recommendation" in user_msg.lower():
            return json.dumps({
                "recommendations": [
                    {
                        "action": "buy",
                        "symbol": "NVDA",
                        "reasoning": "Strong AI chip demand and data center growth. Technical indicators show bullish momentum.",
                        "confidence": 0.85,
                        "risk_level": "medium",
                        "target_price": 950.00
                    },
                    {
                        "action": "hold",
                        "symbol": "AAPL",
                        "reasoning": "Solid fundamentals but trading near fair value. Wait for better entry point.",
                        "confidence": 0.75,
                        "risk_level": "low",
                        "target_price": 195.00
                    }
                ]
            })

        # Context-aware Q&A mock responses
        # Extract just the user's question if embedded in a prompt template
        question_text = user_msg
        if "User Question:" in user_msg:
            question_text = user_msg.split("User Question:")[-1].strip()
            # Remove any trailing instructions after the question
            for cutoff in ["Provide a helpful", "Please provide", "Be concise"]:
                if cutoff in question_text:
                    question_text = question_text[:question_text.index(cutoff)].strip()
        lower = question_text.lower()
        print(f"[MOCK] Full user_msg length: {len(user_msg)}")
        print(f"[MOCK] Extracted question_text: '{question_text[:100]}'")
        print(f"[MOCK] lower: '{lower[:100]}'")

        if any(kw in lower for kw in ["dollar-cost", "dollar cost", "dca", "regular invest", "monthly invest", "averaging"]):
            return (
                "Dollar-cost averaging (DCA) is a proven strategy for building wealth over time:\n\n"
                "**How it works:**\n"
                "Invest a fixed amount at regular intervals (e.g., ₦50,000 monthly) regardless of market conditions. This means you buy more shares when prices are low and fewer when prices are high.\n\n"
                "**Benefits:**\n"
                "- Removes the stress of timing the market\n"
                "- Reduces the impact of volatility on your portfolio\n"
                "- Builds disciplined investing habits\n"
                "- Works well with automated investment plans\n\n"
                "**Example:**\n"
                "Investing ₦100,000 monthly in an S&P 500 index fund over 10 years would have historically outperformed most attempts to time the market.\n\n"
                "**Best suited for:** ETFs, index funds, and blue-chip stocks. Set up automatic investments through your brokerage for consistency."
            )

        if any(kw in lower for kw in ["dividend", "income", "passive", "yield"]):
            return (
                "Dividend investing can provide a steady income stream while building long-term wealth:\n\n"
                "**Top Dividend Strategies:**\n"
                "1. **Dividend Aristocrats** — Companies that have increased dividends for 25+ consecutive years (e.g., Johnson & Johnson, Coca-Cola, Procter & Gamble)\n"
                "2. **High-yield ETFs** — SCHD, VYM, or HDV offer diversified dividend exposure\n"
                "3. **REITs** — Real estate investment trusts often pay higher yields (4-8%)\n\n"
                "**Key Metrics to Watch:**\n"
                "- Dividend yield (2-5% is generally healthy)\n"
                "- Payout ratio (below 60% suggests sustainability)\n"
                "- Dividend growth rate (consistent increases are a positive sign)\n\n"
                "**Dividend Reinvestment (DRIP):**\n"
                "Automatically reinvesting dividends can significantly boost returns through compounding. A ₦1,000,000 investment with a 3% yield reinvested over 20 years can nearly double compared to taking dividends as cash.\n\n"
                "Remember: Very high yields (above 8%) can be a warning sign of financial distress."
            )

        if any(kw in lower for kw in ["tech", "technology", "artificial intelligence", "nvidia", "nvda", "semiconductor"]):
            return (
                "The technology sector continues to be a major driver of market performance:\n\n"
                "**Key Tech Themes:**\n"
                "- **AI & Machine Learning:** Companies like NVIDIA (NVDA), Microsoft (MSFT), and Alphabet (GOOGL) are at the forefront of AI infrastructure\n"
                "- **Cloud Computing:** AWS, Azure, and Google Cloud continue to see strong demand\n"
                "- **Semiconductors:** TSMC, AMD, and Intel are critical to the global tech supply chain\n\n"
                "**Considerations:**\n"
                "- Tech stocks can be volatile — the Nasdaq has historically had larger swings than the S&P 500\n"
                "- Valuations in AI stocks are elevated; consider whether growth justifies the premium\n"
                "- Diversify within tech across hardware, software, and services\n\n"
                "**Ways to invest in tech:**\n"
                "- Individual stocks (higher risk, higher potential reward)\n"
                "- Tech ETFs like QQQ, VGT, or XLK (diversified exposure)\n"
                "- Thematic ETFs focused on AI, cybersecurity, or cloud computing"
            )

        if any(kw in lower for kw in ["diversif", "spread", "allocation", "balance portfolio"]):
            return (
                "Diversification is one of the most important principles in investing. Here's how to build a well-diversified portfolio:\n\n"
                "**Asset Class Diversification:**\n"
                "- Stocks (60-80% for growth-oriented investors)\n"
                "- Bonds (15-30% for stability)\n"
                "- Cash/Money Market (5-10% for liquidity)\n"
                "- Alternative assets like REITs or commodities (5-10%)\n\n"
                "**Sector Diversification:**\n"
                "Spread stock holdings across technology, healthcare, financials, consumer goods, energy, and industrials. Avoid putting more than 25% in any single sector.\n\n"
                "**Geographic Diversification:**\n"
                "Consider international exposure through ETFs like VXUS (Total International) alongside domestic holdings.\n\n"
                "A simple starting point: the '3-fund portfolio' — a total US stock fund, a total international fund, and a total bond fund."
            )

        if any(kw in lower for kw in ["long-term", "long term", "growth stock", "grow"]):
            return (
                "For long-term growth, consider these strategies:\n\n"
                "**Blue-chip stocks** like Apple (AAPL), Microsoft (MSFT), and Alphabet (GOOGL) have historically delivered strong long-term returns with lower volatility than smaller companies.\n\n"
                "**Growth ETFs** such as VUG (Vanguard Growth ETF) or QQQ (Nasdaq-100) provide diversified exposure to high-growth companies.\n\n"
                "**Emerging sectors** — AI, clean energy, and biotechnology are areas with significant growth potential, though they carry higher risk.\n\n"
                "**Key principles for long-term investing:**\n"
                "- Start early to benefit from compound returns\n"
                "- Reinvest dividends for accelerated growth\n"
                "- Stay invested through market downturns\n"
                "- Review and rebalance your portfolio annually\n\n"
                "Remember: Past performance doesn't guarantee future results. Always consider your risk tolerance and investment timeline."
            )

        if any(kw in lower for kw in ["sentiment", "current market", "market today", "outlook", "trend"]):
            return (
                "Here's a snapshot of the current market environment:\n\n"
                "**Market Trends:**\n"
                "- Technology and AI stocks continue to drive market gains\n"
                "- Interest rate expectations are influencing bond and stock valuations\n"
                "- Corporate earnings have generally exceeded analyst expectations\n\n"
                "**Sectors to Watch:**\n"
                "- Technology (AI infrastructure and cloud computing)\n"
                "- Healthcare (biotech innovation and aging demographics)\n"
                "- Energy (transition to renewables)\n\n"
                "**Risk Factors:**\n"
                "- Inflation data and Federal Reserve policy decisions\n"
                "- Geopolitical uncertainties\n"
                "- High valuations in some growth stocks\n\n"
                "Consider maintaining a balanced portfolio and having cash ready for potential buying opportunities during pullbacks."
            )

        if any(kw in lower for kw in ["risk", "volatile", "volatility", "safe", "protect", "hedge"]):
            return (
                "Managing risk is crucial for long-term investment success:\n\n"
                "**Risk Assessment:**\n"
                "- Conservative investors: Focus on bonds, dividend stocks, and blue-chips\n"
                "- Moderate investors: Mix of growth and value stocks with some bonds\n"
                "- Aggressive investors: Higher allocation to growth stocks and emerging markets\n\n"
                "**Risk Mitigation Strategies:**\n"
                "1. **Stop-loss orders** — Set automatic sell points to limit losses (e.g., 10-15% below purchase price)\n"
                "2. **Position sizing** — Never put more than 5-10% of your portfolio in a single stock\n"
                "3. **Hedging** — Consider inverse ETFs or options for downside protection\n"
                "4. **Cash reserves** — Keep 3-6 months of expenses in liquid savings\n\n"
                "**Low-risk investment options:**\n"
                "- Treasury bonds and TIPS\n"
                "- High-yield savings accounts\n"
                "- Dividend aristocrat ETFs (e.g., NOBL)\n\n"
                "Your risk tolerance should align with your investment timeline and financial goals."
            )

        if any(kw in lower for kw in ["buy", "sell", "when to", "timing", "enter", "exit"]):
            return (
                "Timing the market is extremely difficult — even professional fund managers rarely do it consistently. Here's a practical approach:\n\n"
                "**When to consider buying:**\n"
                "- When a quality stock drops 10-20% from recent highs without fundamental deterioration\n"
                "- When you have a long time horizon (5+ years)\n"
                "- When the stock trades below its intrinsic value based on earnings and growth\n\n"
                "**When to consider selling:**\n"
                "- When the original reason for buying no longer applies\n"
                "- When the stock becomes significantly overvalued\n"
                "- When you need to rebalance your portfolio\n"
                "- When you've reached your target return\n\n"
                "**Better than timing:**\n"
                "Use dollar-cost averaging to invest regularly, and focus on the quality of what you buy rather than when you buy it.\n\n"
                "As the saying goes: 'Time in the market beats timing the market.'"
            )

        # General fallback
        return (
            "That's a great question! Here are some key investment principles to keep in mind:\n\n"
            "**Getting Started:**\n"
            "- Define your investment goals and time horizon\n"
            "- Determine your risk tolerance\n"
            "- Start with low-cost index funds or ETFs for broad market exposure\n\n"
            "**Building Your Portfolio:**\n"
            "- Diversify across sectors, asset classes, and geographies\n"
            "- Keep investment costs low (look for funds with expense ratios below 0.2%)\n"
            "- Invest consistently using dollar-cost averaging\n\n"
            "**Common Mistakes to Avoid:**\n"
            "- Emotional trading based on fear or greed\n"
            "- Chasing past performance\n"
            "- Neglecting to rebalance your portfolio\n"
            "- Ignoring fees and tax implications\n\n"
            "Feel free to ask me about specific topics like stock analysis, portfolio strategies, market trends, or risk management!\n\n"
            "Disclaimer: This is general information, not personalized financial advice. Consult a licensed financial advisor for guidance tailored to your situation."
        )

    def analyze_stock(self, symbol: str) -> dict:
        """Get AI analysis for a specific stock."""
        # Fetch real market data
        stock_info = self.market_service.get_stock_info(symbol)
        technicals = self.market_service.calculate_technical_indicators(symbol)

        if "error" in stock_info:
            return {"error": f"Could not fetch data for {symbol}"}

        # Prepare context for AI
        def fmt_price(val):
            return f"${val:,.2f}" if val else "N/A"

        def fmt_cap(val):
            return f"${val:,.0f}" if val else "N/A"

        prompt = f"""Analyze this stock and provide an investment recommendation.

Stock: {stock_info['name']} ({stock_info['symbol']})
Sector: {stock_info.get('sector', 'Unknown')}
Industry: {stock_info.get('industry', 'Unknown')}

Current Price: {fmt_price(stock_info.get('current_price'))}
52-Week High: {fmt_price(stock_info.get('fifty_two_week_high'))}
52-Week Low: {fmt_price(stock_info.get('fifty_two_week_low'))}
50-Day Average: {fmt_price(stock_info.get('fifty_day_avg'))}
200-Day Average: {fmt_price(stock_info.get('two_hundred_day_avg'))}

P/E Ratio: {stock_info.get('pe_ratio') or 'N/A'}
Forward P/E: {stock_info.get('forward_pe') or 'N/A'}
Market Cap: {fmt_cap(stock_info.get('market_cap'))}

Technical Indicators:
- RSI (14): {technicals.get('rsi', 'N/A')} ({technicals.get('rsi_signal', 'N/A')})
- 20-Day SMA: {fmt_price(technicals.get('sma_20'))}
- Above 20-SMA: {technicals.get('above_sma_20', 'N/A')}
- 1-Week Momentum: {technicals.get('momentum_1w', 'N/A')}%
- 1-Month Momentum: {technicals.get('momentum_1m', 'N/A')}%
- Volatility (Annualized): {technicals.get('volatility', 'N/A')}%

Analyst Recommendation: {stock_info.get('recommendation', 'N/A')}
Analyst Target Price: {fmt_price(stock_info.get('target_mean_price'))}

Provide your analysis in JSON format with these fields:
- action: "buy", "hold", or "sell"
- confidence: 0.0 to 1.0
- risk_level: "low", "medium", or "high"
- target_price: your price target
- time_horizon: "short_term" (1-3 months) or "long_term" (6+ months)
- reasoning: detailed explanation (2-3 sentences)
- key_factors: list of 3 key factors influencing your recommendation
- risks: list of 2-3 main risks to consider
"""

        messages = [
            {
                "role": "system",
                "content": """You are a professional financial analyst providing stock recommendations.
                Always respond with valid JSON. Be balanced and objective in your analysis.
                Consider both technical and fundamental factors. Always mention risks.
                Never guarantee returns - investments carry risk."""
            },
            {"role": "user", "content": prompt}
        ]

        response = self._call_gemini(messages, max_tokens=800)

        try:
            # Try to parse JSON from response
            analysis = json.loads(response)
        except json.JSONDecodeError:
            # If response isn't JSON, wrap it
            analysis = {
                "action": "hold",
                "confidence": 0.6,
                "risk_level": "medium",
                "reasoning": response,
                "target_price": stock_info.get('current_price', 0),
                "time_horizon": "long_term",
                "key_factors": ["Market conditions", "Company fundamentals", "Technical indicators"],
                "risks": ["Market volatility", "Economic uncertainty"]
            }

        # Merge with stock data
        return {
            "symbol": symbol.upper(),
            "name": stock_info.get('name', symbol),
            "current_price": stock_info.get('current_price', 0),
            "sector": stock_info.get('sector', 'Unknown'),
            "analysis": analysis,
            "technicals": technicals,
            "generated_at": datetime.utcnow().isoformat(),
        }

    def generate_recommendations(self, symbols: Optional[list[str]] = None, count: int = 5) -> list[dict]:
        """Generate AI recommendations for multiple stocks."""
        if not symbols:
            # Use popular stocks
            symbols = POPULAR_STOCKS[:15]

        recommendations = []

        # Get market context
        market_summary = self.market_service.get_market_summary()

        for symbol in symbols[:count * 2]:  # Analyze more to filter best
            try:
                analysis = self.analyze_stock(symbol)
                if "error" not in analysis and analysis.get("analysis"):
                    recommendations.append(analysis)
            except Exception as e:
                print(f"Error analyzing {symbol}: {e}")
                continue

            if len(recommendations) >= count:
                break

        # Sort by confidence
        recommendations.sort(
            key=lambda x: x.get("analysis", {}).get("confidence", 0),
            reverse=True
        )

        return recommendations[:count]

    def analyze_portfolio(self, holdings: list[dict]) -> dict:
        """Analyze a user's portfolio and provide recommendations."""
        if not holdings:
            return {"error": "No holdings provided"}

        # Fetch data for all holdings
        portfolio_data = []
        total_value = 0
        sectors = {}

        for holding in holdings:
            symbol = holding.get("symbol", "")
            quantity = holding.get("quantity", 0)
            avg_cost = holding.get("average_cost", 0)

            stock_info = self.market_service.get_stock_info(symbol)
            if "error" not in stock_info:
                current_value = stock_info["current_price"] * quantity
                cost_basis = avg_cost * quantity
                gain_loss = current_value - cost_basis
                gain_loss_pct = (gain_loss / cost_basis * 100) if cost_basis > 0 else 0

                portfolio_data.append({
                    "symbol": symbol,
                    "name": stock_info["name"],
                    "sector": stock_info["sector"],
                    "quantity": quantity,
                    "current_price": stock_info["current_price"],
                    "current_value": current_value,
                    "gain_loss": gain_loss,
                    "gain_loss_percent": gain_loss_pct,
                })

                total_value += current_value

                # Track sector allocation
                sector = stock_info["sector"]
                sectors[sector] = sectors.get(sector, 0) + current_value

        # Calculate sector percentages
        sector_allocation = {
            sector: round(value / total_value * 100, 1)
            for sector, value in sectors.items()
        } if total_value > 0 else {}

        # Prepare AI analysis prompt
        portfolio_summary = "\n".join([
            f"- {h['symbol']}: {h['quantity']} shares, ${h['current_value']:,.2f} ({h['gain_loss_percent']:+.1f}%)"
            for h in portfolio_data
        ])

        sector_summary = "\n".join([
            f"- {sector}: {pct}%"
            for sector, pct in sorted(sector_allocation.items(), key=lambda x: x[1], reverse=True)
        ])

        prompt = f"""Analyze this investment portfolio and provide recommendations.

Portfolio Holdings:
{portfolio_summary}

Total Value: ${total_value:,.2f}

Sector Allocation:
{sector_summary}

Provide your analysis in JSON format with these fields:
- overall_assessment: brief portfolio health assessment (1-2 sentences)
- risk_level: "conservative", "moderate", or "aggressive"
- diversification_score: 1-10 rating
- top_performers: list of best performing symbols
- underperformers: list of worst performing symbols
- rebalancing_suggestions: list of 2-3 specific rebalancing actions
- opportunities: list of 2-3 investment opportunities to consider
- risks: list of 2-3 portfolio risks to monitor
"""

        messages = [
            {
                "role": "system",
                "content": """You are a portfolio analyst providing investment advice.
                Always respond with valid JSON. Be specific and actionable.
                Consider diversification, risk management, and growth potential."""
            },
            {"role": "user", "content": prompt}
        ]

        response = self._call_gemini(messages, max_tokens=1000)

        try:
            ai_analysis = json.loads(response)
        except json.JSONDecodeError:
            ai_analysis = {
                "overall_assessment": response,
                "risk_level": "moderate",
                "diversification_score": 6,
                "rebalancing_suggestions": ["Review sector allocation"],
                "opportunities": ["Consider diversification"],
                "risks": ["Market volatility"]
            }

        return {
            "total_value": total_value,
            "holdings": portfolio_data,
            "sector_allocation": sector_allocation,
            "ai_analysis": ai_analysis,
            "generated_at": datetime.utcnow().isoformat(),
        }

    def get_market_insights(self) -> dict:
        """Get AI-generated market insights based on current conditions."""
        market_summary = self.market_service.get_market_summary()

        indices_text = "\n".join([
            f"- {idx['name']}: ${idx['price']:,.2f} ({idx['change_percent']:+.2f}%)"
            for idx in market_summary["indices"]
        ])

        prompt = f"""Based on today's market conditions, provide investment insights.

Market Indices:
{indices_text}

Overall Sentiment: {market_summary['market_sentiment']}

Provide your analysis in JSON format with these fields:
- market_outlook: brief outlook (1-2 sentences)
- sentiment: "bullish", "bearish", or "neutral"
- sectors_to_watch: list of 3 sectors with potential
- sectors_to_avoid: list of 2 sectors to be cautious about
- key_themes: list of 3 market themes/trends
- risk_factors: list of 3 current market risks
- actionable_tips: list of 3 specific tips for investors today
"""

        messages = [
            {
                "role": "system",
                "content": """You are a market analyst providing daily market insights.
                Always respond with valid JSON. Be current and relevant.
                Focus on actionable insights for retail investors."""
            },
            {"role": "user", "content": prompt}
        ]

        response = self._call_gemini(messages, max_tokens=800)

        try:
            ai_insights = json.loads(response)
        except json.JSONDecodeError:
            ai_insights = {
                "market_outlook": response,
                "sentiment": market_summary["market_sentiment"],
                "sectors_to_watch": ["Technology", "Healthcare", "Energy"],
                "key_themes": ["AI growth", "Interest rates", "Earnings season"],
                "risk_factors": ["Inflation", "Geopolitical tensions", "Recession fears"]
            }

        return {
            "market_summary": market_summary,
            "ai_insights": ai_insights,
            "generated_at": datetime.utcnow().isoformat(),
        }

    def summarize_news(self, articles: list[dict]) -> dict:
        """Use Gemini to summarize and analyze financial news articles."""
        if not articles:
            return {
                "summary": "No recent news articles available.",
                "sentiment": "neutral",
                "key_topics": [],
                "market_impact": "No significant news to analyze.",
            }

        news_text = "\n".join([
            f"- [{a['publisher']}] {a['title']}"
            for a in articles[:15]
        ])

        prompt = f"""Analyze these financial news headlines and provide a summary.

Recent Financial News:
{news_text}

Provide your analysis in JSON format with these fields:
- summary: 2-3 sentence overview of the key financial news themes
- sentiment: "bullish", "bearish", or "neutral" overall market sentiment from the news
- key_topics: list of 3-5 key topics/themes from the news
- market_impact: 1-2 sentence assessment of potential market impact
- notable_stories: list of 2-3 most important headlines with brief explanation
"""

        messages = [
            {
                "role": "system",
                "content": """You are a financial news analyst. Summarize news objectively.
                Always respond with valid JSON. Focus on market-moving stories.
                Be balanced in sentiment analysis."""
            },
            {"role": "user", "content": prompt}
        ]

        response = self._call_gemini(messages, max_tokens=600)

        try:
            return json.loads(response)
        except json.JSONDecodeError:
            return {
                "summary": response,
                "sentiment": "neutral",
                "key_topics": ["Market news", "Financial updates"],
                "market_impact": "See individual articles for details.",
            }

    def answer_question(self, question: str, context: Optional[dict] = None) -> str:
        """Answer a user's investment question."""
        context_str = ""
        if context:
            context_str = f"User's portfolio context:\n{json.dumps(context, indent=2)}\n\n"

        prompt = f"{context_str}{question}"

        messages = [
            {
                "role": "system",
                "content": (
                    "You are ClearFlow AI, an intelligent investment advisor powered by Google Gemini. "
                    "You have deep knowledge of finance, investing, stock markets, economics, and financial planning.\n\n"
                    "Guidelines:\n"
                    "- Answer questions thoroughly and conversationally, like a knowledgeable financial expert\n"
                    "- Use markdown formatting: **bold** for key terms, bullet points for lists, ## headings for sections\n"
                    "- Give specific, actionable insights — not vague generalities\n"
                    "- When discussing specific stocks or investments, give a balanced view (upside, risks, key metrics)\n"
                    "- Answer any finance or economics question the user asks — don't deflect unnecessarily\n"
                    "- Only add a risk disclaimer when recommending a specific investment action, and keep it brief\n"
                    "- Be direct and helpful. Do not pad responses with excessive warnings or repetitive caveats."
                ),
            },
            {"role": "user", "content": prompt}
        ]

        return self._call_gemini(messages, max_tokens=1200)


# Singleton instance
_ai_advisor: Optional[AIAdvisorService] = None


def get_ai_advisor() -> AIAdvisorService:
    """Get or create AI advisor instance."""
    global _ai_advisor
    if _ai_advisor is None:
        _ai_advisor = AIAdvisorService()
    return _ai_advisor
