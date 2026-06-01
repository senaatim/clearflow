import uuid
from datetime import datetime
from beanie import Document
from pydantic import Field
from pymongo import IndexModel, ASCENDING


class SupportMessage(Document):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str                          # the user this conversation belongs to
    content: str
    sender_role: str                      # "user" or "admin"
    sender_name: str
    is_read: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "support_messages"
        indexes = [
            IndexModel([("user_id", ASCENDING)]),
            IndexModel([("created_at", ASCENDING)]),
        ]
