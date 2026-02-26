import uuid
from datetime import datetime
from sqlalchemy import String, Float, DateTime, Text, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base
import enum


class FundingMethod(str, enum.Enum):
    bank = "bank"
    card = "card"
    mobile_money = "mobile_money"


class FundRequestStatus(str, enum.Enum):
    pending = "pending"
    approved = "approved"
    rejected = "rejected"
    canceled = "canceled"


class FundRequest(Base):
    __tablename__ = "fund_requests"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)

    amount: Mapped[float] = mapped_column(Float, nullable=False)
    method: Mapped[FundingMethod] = mapped_column(SQLEnum(FundingMethod), nullable=False)
    status: Mapped[FundRequestStatus] = mapped_column(SQLEnum(FundRequestStatus), default=FundRequestStatus.pending)

    user_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    admin_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    reviewed_by: Mapped[str | None] = mapped_column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    reviewed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="fund_requests", foreign_keys=[user_id])
    reviewer: Mapped["User"] = relationship("User", foreign_keys=[reviewed_by])

    def __repr__(self) -> str:
        return f"<FundRequest {self.amount} - {self.status.value}>"
