import uuid
from datetime import datetime
from sqlalchemy import String, Boolean, DateTime, Text, ForeignKey, Float, JSON, Enum as SQLEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base
import enum


class PortfolioType(str, enum.Enum):
    investment = "investment"
    retirement = "retirement"
    savings = "savings"


class Portfolio(Base):
    __tablename__ = "portfolios"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)

    name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    type: Mapped[PortfolioType] = mapped_column(SQLEnum(PortfolioType), default=PortfolioType.investment)
    currency: Mapped[str] = mapped_column(String(3), default="USD")

    target_allocation: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    auto_rebalance: Mapped[bool] = mapped_column(Boolean, default=False)
    rebalance_threshold: Mapped[float] = mapped_column(Float, default=5.0)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="portfolios")
    assets: Mapped[list["Asset"]] = relationship("Asset", back_populates="portfolio", cascade="all, delete-orphan")
    transactions: Mapped[list["Transaction"]] = relationship("Transaction", back_populates="portfolio", cascade="all, delete-orphan")
    trade_requests: Mapped[list["TradeRequest"]] = relationship("TradeRequest", back_populates="portfolio", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<Portfolio {self.name}>"
