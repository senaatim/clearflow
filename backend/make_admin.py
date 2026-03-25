"""
Bootstrap script — promotes a user to admin and approves their account.
Run once from the backend/ directory:

    python make_admin.py your@email.com
"""

import asyncio
import sys
from datetime import datetime
from app.database import init_db
from app.models.user import User, UserRole, AccountStatus
from app.models.subscription import Subscription, SubscriptionTier, SubscriptionStatus


async def make_admin(email: str):
    await init_db()

    user = await User.find_one(User.email == email.lower().strip())
    if not user:
        print(f"[ERROR] No user found with email: {email}")
        return

    user.role = UserRole.admin
    user.account_status = AccountStatus.approved
    user.is_active = True
    await user.save()

    # Ensure a Free subscription exists
    existing_sub = await Subscription.find_one(Subscription.user_id == user.id)
    if not existing_sub:
        free_sub = Subscription(
            user_id=user.id,
            tier=SubscriptionTier.basic,
            status=SubscriptionStatus.active,
            current_period_start=datetime.utcnow(),
            current_period_end=datetime(2099, 12, 31),
        )
        await free_sub.insert()
        print("[OK] Free subscription created")

    print(f"[OK] {user.first_name} {user.last_name} ({user.email})")
    print(f"     role           = {user.role.value}")
    print(f"     account_status = {user.account_status.value}")
    print(f"     is_active      = {user.is_active}")
    print()
    print("You can now log in and access /admin/dashboard")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python make_admin.py <email>")
        sys.exit(1)
    asyncio.run(make_admin(sys.argv[1]))
