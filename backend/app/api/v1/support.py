from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from datetime import datetime
from typing import Optional

from app.models.user import User, UserRole
from app.models.support_message import SupportMessage
from app.api.deps import get_current_user, require_role

user_router = APIRouter()
admin_router = APIRouter()

broker_or_admin = require_role(UserRole.broker, UserRole.admin)


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class SendMessageRequest(BaseModel):
    content: str

class ReplyRequest(BaseModel):
    user_id: str
    content: str


# ---------------------------------------------------------------------------
# User endpoints  (prefix: /support)
# ---------------------------------------------------------------------------

@user_router.post("/messages", status_code=status.HTTP_201_CREATED)
async def send_message(
    body: SendMessageRequest,
    current_user: User = Depends(get_current_user),
):
    if not body.content.strip():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Message cannot be empty")

    msg = SupportMessage(
        user_id=current_user.id,
        content=body.content.strip(),
        sender_role="user",
        sender_name=f"{current_user.first_name} {current_user.last_name}",
    )
    await msg.insert()
    return {"success": True, "id": msg.id}


@user_router.get("/messages")
async def get_my_messages(current_user: User = Depends(get_current_user)):
    msgs = (
        await SupportMessage.find(SupportMessage.user_id == current_user.id)
        .sort(+SupportMessage.created_at)
        .to_list()
    )

    # Mark admin messages as read when the user views their inbox
    for m in msgs:
        if m.sender_role == "admin" and not m.is_read:
            m.is_read = True
            await m.save()

    return {
        "messages": [
            {
                "id": m.id,
                "content": m.content,
                "senderRole": m.sender_role,
                "senderName": m.sender_name,
                "createdAt": m.created_at.isoformat(),
                "isRead": m.is_read,
            }
            for m in msgs
        ]
    }


# ---------------------------------------------------------------------------
# Admin endpoints  (prefix: /admin/support)
# ---------------------------------------------------------------------------

@admin_router.get("/conversations")
async def list_conversations(
    search: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
    current_user: User = Depends(broker_or_admin),
):
    """Return one summary entry per user, sorted by latest message desc."""
    all_msgs = await SupportMessage.find().sort(-SupportMessage.created_at).to_list()

    # Group by user_id — keep latest message per user
    seen: dict[str, dict] = {}
    for m in all_msgs:
        uid = m.user_id
        if uid not in seen:
            seen[uid] = {
                "lastMessage": m.content,
                "lastMessageAt": m.created_at,
                "unreadCount": 0,
                "totalMessages": 0,
            }
        seen[uid]["totalMessages"] += 1
        # Unread = user messages that admin hasn't read
        if m.sender_role == "user" and not m.is_read:
            seen[uid]["unreadCount"] += 1

    # Attach user info
    conversations = []
    for uid, data in seen.items():
        user = await User.find_one(User.id == uid)
        if user is None:
            continue
        entry = {
            "userId": uid,
            "userName": f"{user.first_name} {user.last_name}",
            "userEmail": user.email,
            "lastMessage": data["lastMessage"],
            "lastMessageAt": data["lastMessageAt"].isoformat(),
            "unreadCount": data["unreadCount"],
            "totalMessages": data["totalMessages"],
        }
        if search:
            q = search.lower()
            if q not in entry["userName"].lower() and q not in entry["userEmail"].lower():
                continue
        conversations.append(entry)

    # Already sorted by latest message (we iterated in desc order)
    total = len(conversations)
    return {"conversations": conversations[offset: offset + limit], "total_count": total}


@admin_router.get("/conversations/{user_id}")
async def get_conversation(
    user_id: str,
    current_user: User = Depends(broker_or_admin),
):
    user = await User.find_one(User.id == user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    msgs = (
        await SupportMessage.find(SupportMessage.user_id == user_id)
        .sort(+SupportMessage.created_at)
        .to_list()
    )

    return {
        "messages": [
            {
                "id": m.id,
                "content": m.content,
                "senderRole": m.sender_role,
                "senderName": m.sender_name,
                "createdAt": m.created_at.isoformat(),
                "isRead": m.is_read,
            }
            for m in msgs
        ]
    }


@admin_router.post("/conversations/{user_id}/read")
async def mark_read(
    user_id: str,
    current_user: User = Depends(broker_or_admin),
):
    """Mark all user messages in this conversation as read (admin has seen them)."""
    msgs = await SupportMessage.find(
        SupportMessage.user_id == user_id,
        SupportMessage.sender_role == "user",
        SupportMessage.is_read == False,
    ).to_list()

    for m in msgs:
        m.is_read = True
        await m.save()

    return {"success": True, "marked": len(msgs)}


@admin_router.post("/reply", status_code=status.HTTP_201_CREATED)
async def reply_to_user(
    body: ReplyRequest,
    current_user: User = Depends(broker_or_admin),
):
    user = await User.find_one(User.id == body.user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    if not body.content.strip():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Message cannot be empty")

    msg = SupportMessage(
        user_id=body.user_id,
        content=body.content.strip(),
        sender_role="admin",
        sender_name="ClearFlow Support",
    )
    await msg.insert()
    return {"success": True, "id": msg.id}
