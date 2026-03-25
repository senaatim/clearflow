from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from app.config import settings

_client: AsyncIOMotorClient | None = None


def get_client() -> AsyncIOMotorClient:
    global _client
    if _client is None:
        _client = AsyncIOMotorClient(settings.mongodb_url)
    return _client


async def init_db():
    from app.models.user import User
    from app.models.portfolio import Portfolio
    from app.models.asset import Asset
    from app.models.transaction import Transaction
    from app.models.recommendation import Recommendation
    from app.models.subscription import Subscription
    from app.models.payment import Payment
    from app.models.trade_request import TradeRequest
    from app.models.fund_request import FundRequest
    from app.models.chat_conversation import ChatConversation

    client = get_client()
    await init_beanie(
        database=client[settings.mongodb_db_name],
        document_models=[
            User,
            Portfolio,
            Asset,
            Transaction,
            Recommendation,
            Subscription,
            Payment,
            TradeRequest,
            FundRequest,
            ChatConversation,
        ],
    )
