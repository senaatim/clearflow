import uuid
from datetime import datetime
from sqlalchemy import String, DateTime, ForeignKey, Float, Enum as SQLEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base
import enum


class AssetType(str, enum.Enum):
    stock = "stock"
    etf = "etf"
    bond = "bond"
    crypto = "crypto"
    reit = "reit"


class Asset(Base):
    __tablename__ = "assets"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    portfolio_id: Mapped[str] = mapped_column(String(36), ForeignKey("portfolios.id", ondelete="CASCADE"), nullable=False, index=True)

    symbol: Mapped[str] = mapped_column(String(20), nullable=False)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    asset_type: Mapped[AssetType] = mapped_column(SQLEnum(AssetType), nullable=False)
    category: Mapped[str] = mapped_column(String(50), nullable=False)  # e.g., "Technology", "Healthcare"

    quantity: Mapped[float] = mapped_column(Float, nullable=False)
    average_cost: Mapped[float] = mapped_column(Float, nullable=False)
    current_price: Mapped[float | None] = mapped_column(Float, nullable=True)
    last_price_update: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    portfolio: Mapped["Portfolio"] = relationship("Portfolio", back_populates="assets")

    @property
    def current_value(self) -> float:
        if self.current_price:
            return self.quantity * self.current_price
        return self.quantity * self.average_cost

    @property
    def cost_basis(self) -> float:
        return self.quantity * self.average_cost

    @property
    def gain_loss(self) -> float:
        return self.current_value - self.cost_basis

    @property
    def gain_loss_percentage(self) -> float:
        if self.cost_basis == 0:
            return 0
        return (self.gain_loss / self.cost_basis) * 100

    def __repr__(self) -> str:
        return f"<Asset {self.symbol}>"
