from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, EmailStr


class CustomerOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    email: EmailStr
    phone: str
    city: str
    preferred_channel: str
    total_spent: Decimal
    last_order_date: datetime | None
    created_at: datetime


class SegmentPrompt(BaseModel):
    prompt: str


class SegmentPreview(BaseModel):
    prompt: str
    filter_logic: dict
    audience_size: int
    customers: list[CustomerOut]


class CopilotRequest(BaseModel):
    goal: str


class CopilotResponse(BaseModel):
    goal: str
    audience_size: int
    reasoning: list[str]
    recommended_campaign: str
    channel: str
    message: str
    customer_ids: list[int]


class LaunchCampaignRequest(BaseModel):
    name: str
    goal: str
    channel: str
    message: str
    customer_ids: list[int]


class CampaignOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    goal: str
    audience_size: int
    status: str
    channel: str
    created_at: datetime


class ReceiptIn(BaseModel):
    external_id: str
    event_type: str
    timestamp: datetime | None = None


class AnalyticsOut(BaseModel):
    sent: int
    delivered: int
    opened: int
    read: int
    clicked: int
    converted: int
    delivery_rate: float
    open_rate: float
    click_rate: float
    conversion_rate: float
    revenue_generated: float
