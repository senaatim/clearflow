"""
Seed the ClearFlow database with initial data.
Usage: python scripts/seed.py
"""
import asyncio
import sys
import uuid
from datetime import datetime, timedelta
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.database import init_db
from app.models.user import User, UserRole, KYCStatus, AccountStatus, RiskTolerance
from app.models.portfolio import Portfolio, PortfolioType
from app.models.asset import Asset, AssetType
from app.models.transaction import Transaction, TransactionType
from app.models.subscription import Subscription, SubscriptionTier, SubscriptionStatus
from app.utils.security import get_password_hash


# ── Seed data ────────────────────────────────────────────────────────────────

USERS = [
    {
        "email": "senaatim10@gmail.com",
        "password": "Admin@ClearFlow1",
        "first_name": "Sena",
        "last_name": "Atim",
        "phone": "+2348012345678",
        "role": UserRole.admin,
        "risk_tolerance": RiskTolerance.aggressive,
        "investment_goal": "Long-term wealth creation",
        "kyc_status": KYCStatus.verified,
        "account_status": AccountStatus.approved,
        "is_active": True,
        "is_verified": True,
        "subscription_tier": SubscriptionTier.premium,
    },
    {
        "email": "demo@clearflow.io",
        "password": "Demo@ClearFlow1",
        "first_name": "Demo",
        "last_name": "User",
        "phone": "+2348098765432",
        "role": UserRole.user,
        "risk_tolerance": RiskTolerance.moderate,
        "investment_goal": "Retirement savings",
        "kyc_status": KYCStatus.verified,
        "account_status": AccountStatus.approved,
        "is_active": True,
        "is_verified": True,
        "subscription_tier": SubscriptionTier.pro,
    },
    {
        "email": "investor@clearflow.io",
        "password": "Invest@ClearFlow1",
        "first_name": "Chidi",
        "last_name": "Okafor",
        "phone": "+2348055544433",
        "role": UserRole.user,
        "risk_tolerance": RiskTolerance.conservative,
        "investment_goal": "Passive income",
        "kyc_status": KYCStatus.verified,
        "account_status": AccountStatus.approved,
        "is_active": True,
        "is_verified": True,
        "subscription_tier": SubscriptionTier.basic,
    },
]

# Assets per portfolio: (symbol, name, type, category, quantity, avg_cost, current_price)
PORTFOLIOS = [
    {
        "name": "Growth Portfolio",
        "description": "High-growth tech and emerging market stocks",
        "type": PortfolioType.investment,
        "currency": "NGN",
        "target_allocation": {"stocks": 70, "etfs": 20, "crypto": 10},
        "auto_rebalance": True,
        "assets": [
            ("DANGCEM", "Dangote Cement Plc", AssetType.stock, "Materials", 500, 285.0, 310.5),
            ("GTCO", "Guaranty Trust Holding Co.", AssetType.stock, "Financials", 1000, 42.5, 48.2),
            ("AIRTELAFRI", "Airtel Africa Plc", AssetType.stock, "Telecom", 300, 1850.0, 2100.0),
            ("MTNN", "MTN Nigeria Communications", AssetType.stock, "Telecom", 250, 198.0, 220.0),
            ("ZENITHBANK", "Zenith Bank Plc", AssetType.stock, "Financials", 800, 35.0, 39.5),
        ],
    },
    {
        "name": "Income Portfolio",
        "description": "Dividend-focused stocks and bonds",
        "type": PortfolioType.retirement,
        "currency": "NGN",
        "target_allocation": {"stocks": 50, "bonds": 40, "etfs": 10},
        "auto_rebalance": False,
        "assets": [
            ("NESTLE", "Nestle Nigeria Plc", AssetType.stock, "Consumer Staples", 100, 1200.0, 1350.0),
            ("SEPLAT", "Seplat Energy Plc", AssetType.stock, "Energy", 200, 3200.0, 3750.0),
            ("ACCESSCORP", "Access Holdings Plc", AssetType.stock, "Financials", 600, 18.5, 22.0),
            ("FBNH", "FBN Holdings Plc", AssetType.stock, "Financials", 900, 14.0, 16.8),
        ],
    },
]

DEMO_PORTFOLIOS = [
    {
        "name": "My Main Portfolio",
        "description": "Balanced portfolio for steady growth",
        "type": PortfolioType.investment,
        "currency": "NGN",
        "target_allocation": {"stocks": 60, "etfs": 30, "bonds": 10},
        "auto_rebalance": True,
        "assets": [
            ("DANGCEM", "Dangote Cement Plc", AssetType.stock, "Materials", 200, 280.0, 310.5),
            ("GTCO", "Guaranty Trust Holding Co.", AssetType.stock, "Financials", 500, 40.0, 48.2),
            ("BUACEMENT", "BUA Cement Plc", AssetType.stock, "Materials", 150, 90.0, 105.0),
            ("TRANSCORP", "Transnational Corporation Plc", AssetType.stock, "Conglomerate", 2000, 8.5, 11.2),
        ],
    },
]


# ── Helpers ───────────────────────────────────────────────────────────────────

def make_transactions(portfolio_id: str, assets: list) -> list[Transaction]:
    txns = []
    base_date = datetime.utcnow() - timedelta(days=180)
    for i, (symbol, name, atype, category, qty, avg_cost, current_price) in enumerate(assets):
        # Buy transaction
        txns.append(Transaction(
            id=str(uuid.uuid4()),
            portfolio_id=portfolio_id,
            type=TransactionType.buy,
            symbol=symbol,
            quantity=qty,
            price=avg_cost,
            total_amount=qty * avg_cost,
            fees=qty * avg_cost * 0.001,
            notes=f"Initial buy of {symbol}",
            executed_at=base_date + timedelta(days=i * 10),
        ))
        # Dividend transaction for stocks
        if atype == AssetType.stock:
            txns.append(Transaction(
                id=str(uuid.uuid4()),
                portfolio_id=portfolio_id,
                type=TransactionType.dividend,
                symbol=symbol,
                quantity=None,
                price=None,
                total_amount=round(qty * avg_cost * 0.02, 2),
                fees=0,
                notes=f"Dividend payment from {symbol}",
                executed_at=base_date + timedelta(days=i * 10 + 90),
            ))
    return txns


async def create_user_with_data(user_data: dict, portfolios_data: list) -> None:
    email = user_data["email"]

    # Skip if already exists
    existing = await User.find_one(User.email == email)
    if existing:
        print(f"  Skipping {email} — already exists")
        return

    user_id = str(uuid.uuid4())
    user = User(
        id=user_id,
        email=email,
        password_hash=get_password_hash(user_data["password"]),
        first_name=user_data["first_name"],
        last_name=user_data["last_name"],
        phone=user_data.get("phone"),
        role=user_data["role"],
        risk_tolerance=user_data["risk_tolerance"],
        investment_goal=user_data.get("investment_goal"),
        kyc_status=user_data["kyc_status"],
        account_status=user_data["account_status"],
        is_active=user_data["is_active"],
        is_verified=user_data["is_verified"],
    )
    await user.insert()
    print(f"  Created user: {email}")

    # Subscription
    tier = user_data["subscription_tier"]
    sub = Subscription(
        id=str(uuid.uuid4()),
        user_id=user_id,
        tier=tier,
        status=SubscriptionStatus.active,
        current_period_start=datetime.utcnow(),
        current_period_end=datetime.utcnow() + timedelta(days=365),
    )
    await sub.insert()
    print(f"    Subscription: {tier.value}")

    # Portfolios
    for p_data in portfolios_data:
        portfolio_id = str(uuid.uuid4())
        portfolio = Portfolio(
            id=portfolio_id,
            user_id=user_id,
            name=p_data["name"],
            description=p_data.get("description"),
            type=p_data["type"],
            currency=p_data["currency"],
            target_allocation=p_data.get("target_allocation"),
            auto_rebalance=p_data.get("auto_rebalance", False),
        )
        await portfolio.insert()
        print(f"    Portfolio: {p_data['name']}")

        # Assets
        for symbol, name, atype, category, qty, avg_cost, current_price in p_data["assets"]:
            asset = Asset(
                id=str(uuid.uuid4()),
                portfolio_id=portfolio_id,
                symbol=symbol,
                name=name,
                asset_type=atype,
                category=category,
                quantity=qty,
                average_cost=avg_cost,
                current_price=current_price,
                last_price_update=datetime.utcnow(),
            )
            await asset.insert()

        print(f"      {len(p_data['assets'])} assets inserted")

        # Transactions
        txns = make_transactions(portfolio_id, p_data["assets"])
        for txn in txns:
            await txn.insert()
        print(f"      {len(txns)} transactions inserted")


# ── Main ──────────────────────────────────────────────────────────────────────

async def main():
    print("Connecting to database...")
    await init_db()
    print("Connected.\n")

    print("Seeding admin user...")
    await create_user_with_data(USERS[0], PORTFOLIOS)

    print("\nSeeding demo user...")
    await create_user_with_data(USERS[1], DEMO_PORTFOLIOS)

    print("\nSeeding investor user...")
    await create_user_with_data(USERS[2], [])

    print("\nDone! Seed credentials:")
    print("  Admin   — senaatim10@gmail.com   / Admin@ClearFlow1")
    print("  Demo    — demo@clearflow.io       / Demo@ClearFlow1")
    print("  User    — investor@clearflow.io   / Invest@ClearFlow1")


if __name__ == "__main__":
    asyncio.run(main())
