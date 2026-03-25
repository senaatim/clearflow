from fastapi import APIRouter, Depends, HTTPException, status
from datetime import datetime

from app.models.user import User, RiskTolerance
from app.schemas.user import UserResponse, UserUpdate, PasswordChange
from app.api.deps import get_current_user
from app.utils.security import verify_password, get_password_hash, is_strong_password

router = APIRouter()

_ALLOWED_PROFILE_FIELDS = {
    "first_name", "last_name", "phone", "avatar_url",
    "risk_tolerance", "investment_goal",
}


@router.get("/profile", response_model=UserResponse)
async def get_profile(current_user: User = Depends(get_current_user)):
    return UserResponse.model_validate(current_user)


@router.patch("/profile", response_model=UserResponse)
async def update_profile(
    updates: UserUpdate,
    current_user: User = Depends(get_current_user),
):
    update_data = updates.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        if field not in _ALLOWED_PROFILE_FIELDS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Field '{field}' cannot be updated via this endpoint",
            )
        setattr(current_user, field, value)

    current_user.updated_at = datetime.utcnow()
    await current_user.save()

    return UserResponse.model_validate(current_user)


@router.patch("/password")
async def change_password(
    password_data: PasswordChange,
    current_user: User = Depends(get_current_user),
):
    if not verify_password(password_data.current_password, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect",
        )

    valid, error_msg = is_strong_password(password_data.new_password)
    if not valid:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=error_msg)

    if password_data.new_password == password_data.current_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be different from the current password",
        )

    current_user.password_hash = get_password_hash(password_data.new_password)
    current_user.updated_at = datetime.utcnow()
    await current_user.save()

    return {"success": True, "message": "Password changed successfully"}


@router.get("/settings")
async def get_settings(current_user: User = Depends(get_current_user)):
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
):
    return {**settings, "updated": True}
