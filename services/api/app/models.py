from datetime import datetime
from decimal import Decimal

from sqlalchemy import DateTime, ForeignKey, Numeric, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Customer(Base):
    __tablename__ = "customers"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(160), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    phone: Mapped[str] = mapped_column(String(32), nullable=False)
    city: Mapped[str] = mapped_column(String(80), index=True)
    preferred_channel: Mapped[str] = mapped_column(String(24), default="email")
    total_spent: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=0)
    last_order_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    orders: Mapped[list["Order"]] = relationship(back_populates="customer")
    communications: Mapped[list["Communication"]] = relationship(back_populates="customer")


class Order(Base):
    __tablename__ = "orders"

    id: Mapped[int] = mapped_column(primary_key=True)
    customer_id: Mapped[int] = mapped_column(ForeignKey("customers.id", ondelete="CASCADE"), index=True)
    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2))
    category: Mapped[str] = mapped_column(String(80), index=True)
    order_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)

    customer: Mapped[Customer] = relationship(back_populates="orders")


class Campaign(Base):
    __tablename__ = "campaigns"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(180), nullable=False)
    goal: Mapped[str] = mapped_column(Text, nullable=False)
    audience_size: Mapped[int] = mapped_column(default=0)
    status: Mapped[str] = mapped_column(String(32), default="draft")
    channel: Mapped[str] = mapped_column(String(24), default="email")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    communications: Mapped[list["Communication"]] = relationship(back_populates="campaign")


class Communication(Base):
    __tablename__ = "communications"

    id: Mapped[int] = mapped_column(primary_key=True)
    campaign_id: Mapped[int] = mapped_column(ForeignKey("campaigns.id", ondelete="CASCADE"), index=True)
    customer_id: Mapped[int] = mapped_column(ForeignKey("customers.id", ondelete="CASCADE"), index=True)
    channel: Mapped[str] = mapped_column(String(24), default="email")
    message: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(String(32), default="SENT")

    campaign: Mapped[Campaign] = relationship(back_populates="communications")
    customer: Mapped[Customer] = relationship(back_populates="communications")
    events: Mapped[list["CommunicationEvent"]] = relationship(back_populates="communication")


class CommunicationEvent(Base):
    __tablename__ = "communication_events"

    id: Mapped[int] = mapped_column(primary_key=True)
    communication_id: Mapped[int] = mapped_column(ForeignKey("communications.id", ondelete="CASCADE"), index=True)
    event_type: Mapped[str] = mapped_column(String(32), index=True)
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    communication: Mapped[Communication] = relationship(back_populates="events")
