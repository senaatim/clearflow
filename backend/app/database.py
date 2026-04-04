from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from app.config import settings

_client: AsyncIOMotorClient | None = None


def get_client() -> AsyncIOMotorClient:
    global _client
    if _client is None:
        _client = AsyncIOMotorClient(
            settings.mongodb_url,
            serverSelectionTimeoutMS=30000,
            connectTimeoutMS=30000,
            socketTimeoutMS=30000,
        )
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
    db = client[settings.mongodb_db_name]

    # Verify connection before proceeding
    print("Pinging MongoDB...")
    await client.admin.command("ping")
    print("MongoDB ping OK")

    # Drop legacy id_1 and bvn_hash_1 indexes from all collections
    print("Dropping legacy indexes...")
    collections = ["users", "subscriptions", "portfolios", "assets", "transactions",
                   "recommendations", "payments", "trade_requests", "fund_requests"]
    for col in collections:
        for index_name in ("id_1", "bvn_hash_1"):
            try:
                await db[col].drop_index(index_name)
                print(f"Dropped legacy index {index_name} from {col}")
            except Exception:
                pass

    print("Initializing Beanie models...")
    await init_beanie(
        database=db,
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
