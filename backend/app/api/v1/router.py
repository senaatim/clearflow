from fastapi import APIRouter
from app.api.v1 import (
    auth, users, portfolios, recommendations, analytics, risk, tax,
    subscriptions, payments, trades, ai, funds, admin,
    screener, health_cards, news, ngx, reports, automation,
)

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(users.router, prefix="/users", tags=["Users"])
api_router.include_router(subscriptions.router, prefix="/subscriptions", tags=["Subscriptions"])
api_router.include_router(payments.router, prefix="/payments", tags=["Payments"])
api_router.include_router(portfolios.router, prefix="/portfolios", tags=["Portfolios"])
api_router.include_router(recommendations.router, prefix="/recommendations", tags=["Recommendations"])
api_router.include_router(trades.router, prefix="/trades", tags=["Trade Requests"])
api_router.include_router(ai.router, prefix="/ai", tags=["AI Advisor"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["Analytics"])
api_router.include_router(risk.router, prefix="/risk", tags=["Risk Management"])
api_router.include_router(tax.router, prefix="/tax", tags=["Tax Optimization"])
api_router.include_router(funds.router, prefix="/funds", tags=["Fund Requests"])
api_router.include_router(admin.router, prefix="/admin", tags=["Admin"])
api_router.include_router(screener.router, prefix="/screener", tags=["Screener"])
api_router.include_router(health_cards.router, prefix="/health-cards", tags=["Health Cards"])
api_router.include_router(news.router, prefix="/news", tags=["News"])
api_router.include_router(ngx.router, prefix="/ngx", tags=["NGX Module"])
api_router.include_router(reports.router, prefix="/reports", tags=["Reports"])
api_router.include_router(automation.router, prefix="/automation", tags=["Automation"])
