from fastapi import APIRouter, Depends, HTTPException, status
from datetime import datetime
import uuid

from app.models.user import User
from app.api.deps import get_current_user

router = APIRouter()

# In-memory store (resets on restart)
_rules: dict[str, dict] = {}


@router.get("/rules")
async def list_rules(current_user: User = Depends(get_current_user)):
    user_rules = [r for r in _rules.values() if r["user_id"] == current_user.id]
    user_rules.sort(key=lambda r: r["created_at"], reverse=True)
    return [_serialize(r) for r in user_rules]


@router.post("/rules", status_code=status.HTTP_201_CREATED)
async def create_rule(data: dict, current_user: User = Depends(get_current_user)):
    rule_id = str(uuid.uuid4())
    now = datetime.utcnow().isoformat()
    rule = {
        "id": rule_id,
        "user_id": current_user.id,
        "name": data.get("name", "Unnamed Rule"),
        "type": data.get("type", "alert"),
        "conditions": data.get("conditions", {}),
        "actions": data.get("actions", {}),
        "is_active": True,
        "created_at": now,
        "updated_at": now,
    }
    _rules[rule_id] = rule
    return _serialize(rule)


@router.patch("/rules/{rule_id}")
async def update_rule(rule_id: str, data: dict, current_user: User = Depends(get_current_user)):
    rule = _rules.get(rule_id)
    if not rule or rule["user_id"] != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Rule not found.")
    for field in ("name", "conditions", "actions"):
        if field in data:
            rule[field] = data[field]
    rule["updated_at"] = datetime.utcnow().isoformat()
    return _serialize(rule)


@router.delete("/rules/{rule_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_rule(rule_id: str, current_user: User = Depends(get_current_user)):
    rule = _rules.get(rule_id)
    if not rule or rule["user_id"] != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Rule not found.")
    del _rules[rule_id]


@router.post("/rules/{rule_id}/toggle")
async def toggle_rule(rule_id: str, data: dict, current_user: User = Depends(get_current_user)):
    rule = _rules.get(rule_id)
    if not rule or rule["user_id"] != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Rule not found.")
    rule["is_active"] = data.get("isActive", not rule["is_active"])
    rule["updated_at"] = datetime.utcnow().isoformat()
    return _serialize(rule)


def _serialize(r: dict) -> dict:
    return {
        "id": r["id"],
        "user_id": r["user_id"],
        "name": r["name"],
        "type": r["type"],
        "conditions": r["conditions"],
        "actions": r["actions"],
        "is_active": r["is_active"],
        "created_at": r["created_at"],
        "updated_at": r["updated_at"],
    }
