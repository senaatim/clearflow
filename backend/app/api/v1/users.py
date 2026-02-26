from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.user import User, RiskTolerance
from app.schemas.user import UserResponse, UserUpdate, PasswordChange
from app.api.deps import get_current_user
from app.utils.security import verify_password, get_password_hash, is_strong_password

router = APIRouter()

# Explicit whitelist of fields a user is allowed to update on their own profile.
# Role, is_active, is_verified, and email are NOT in this list.
_ALLOWED_PROFILE_FIELDS = {
    "first_name", "last_name", "phone", "avatar_url",
    "risk_tolerance", "investment_goal",
}


@router.get("/profile", response_model=UserResponse)
async def get_profile(current_user: User = Depends(get_current_user)):
    """Get the current user's profile."""
    return UserResponse.model_validate(current_user)


@router.patch("/profile", response_model=UserResponse)
async def update_profile(
    updates: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update the current user's profile. Only safe fields are allowed."""
    update_data = updates.model_dump(exclude_unset=True)

    # Explicitly assign only whitelisted fields — prevents mass assignment
    for field, value in update_data.items():
        if field not in _ALLOWED_PROFILE_FIELDS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Field '{field}' cannot be updated via this endpoint",
            )
        setattr(current_user, field, value)

    await db.commit()
    await db.refresh(current_user)

    return UserResponse.model_validate(current_user)


@router.patch("/password")
async def change_password(
    password_data: PasswordChange,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Change the current user's password."""
    if not verify_password(password_data.current_password, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect",
        )

    # Enforce strength on new password
    valid, error_msg = is_strong_password(password_data.new_password)
    if not valid:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=error_msg)

    if password_data.new_password == password_data.current_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be different from the current password",
        )

    current_user.password_hash = get_password_hash(password_data.new_password)
    await db.commit()

    return {"success": True, "message": "Password changed successfully"}


@router.get("/settings")
async def get_settings(current_user: User = Depends(get_current_user)):
    """Get user settings."""
    return {
        "notifications_enabled": True,
        "email_digest": "weekly",
        "auto_invest_enabled": False,
        "tax_optimization_enabled": True,
        "theme": "dark",
        "timezone": "UTC",
    }


@router.patch("/settings")
async def update_settings(
    settings: dict,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update user settings."""
    return {**settings, "updated": True}
