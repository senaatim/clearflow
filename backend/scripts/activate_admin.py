"""
Run this script to activate the admin user and set their role.
Usage: python scripts/activate_admin.py
"""
import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.database import init_db
from app.models.user import User, UserRole, AccountStatus


ADMIN_EMAIL = "senaatim10@gmail.com"


async def main():
    await init_db()

    user = await User.find_one(User.email == ADMIN_EMAIL)
    if not user:
        print(f"User {ADMIN_EMAIL} not found.")
        return

    user.role = UserRole.admin
    user.is_active = True
    user.account_status = AccountStatus.approved
    await user.save()

    print(f"Done. {ADMIN_EMAIL} -> role=admin, is_active=True, account_status=approved")


if __name__ == "__main__":
    asyncio.run(main())
