import logging
from datetime import UTC, datetime

from fastapi import BackgroundTasks, Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app import models
from app.config import get_settings
from app.database import create_all, get_db
from app.repositories import CampaignRepository, CustomerRepository
from app.schemas import (
    AnalyticsOut,
    CampaignOut,
    CopilotRequest,
    CopilotResponse,
    CustomerOut,
    LaunchCampaignRequest,
    ReceiptIn,
    SegmentPreview,
    SegmentPrompt,
)
from app.services.ai import AIService
from app.services.analytics import campaign_analytics
from app.services.channel import ChannelClient
from app.services.segmentation import explain_filter, prompt_to_filter
from app.services.twin import customer_twin

settings = get_settings()
logging.basicConfig(level=settings.log_level)

app = FastAPI(title="CampaignPilot AI API", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup() -> None:
    create_all()


@app.get("/health")
def health() -> dict:
    return {"status": "ok", "service": "campaignpilot-api"}


@app.get("/api/overview")
def overview(db: Session = Depends(get_db)) -> dict:
    customers = db.scalar(select(func.count(models.Customer.id))) or 0
    campaigns = db.scalar(select(func.count(models.Campaign.id))) or 0
    revenue = db.scalar(select(func.coalesce(func.sum(models.Order.amount), 0))) or 0
    analytics = campaign_analytics(db)
    recent = db.scalars(select(models.Campaign).order_by(models.Campaign.created_at.desc()).limit(5)).all()
    return {
        "kpis": {
            "customers": customers,
            "campaigns": campaigns,
            "lifetime_revenue": float(revenue),
            "conversion_rate": analytics.conversion_rate,
        },
        "analytics": analytics.model_dump(),
        "recent_campaigns": [CampaignOut.model_validate(item).model_dump(mode="json") for item in recent],
        "revenue_chart": [
            {"month": "Jan", "revenue": 420000},
            {"month": "Feb", "revenue": 510000},
            {"month": "Mar", "revenue": 470000},
            {"month": "Apr", "revenue": 620000},
            {"month": "May", "revenue": 760000},
            {"month": "Jun", "revenue": 830000},
        ],
    }


@app.get("/api/customers", response_model=list[CustomerOut])
def customers(limit: int = 50, offset: int = 0, db: Session = Depends(get_db)) -> list[models.Customer]:
    return CustomerRepository(db).list(limit=limit, offset=offset)


@app.get("/api/customers/{customer_id}/twin")
def twin(customer_id: int, db: Session = Depends(get_db)) -> dict:
    customer = db.get(models.Customer, customer_id)
    if not customer:
        return {"error": "Customer not found"}
    return customer_twin(customer)


@app.post("/api/segments/preview", response_model=SegmentPreview)
def segment_preview(payload: SegmentPrompt, db: Session = Depends(get_db)) -> SegmentPreview:
    logic = prompt_to_filter(payload.prompt)
    audience = CustomerRepository(db).segment(logic, limit=100)
    return SegmentPreview(prompt=payload.prompt, filter_logic=logic, audience_size=len(audience), customers=audience)


@app.post("/api/copilot", response_model=CopilotResponse)
def copilot(payload: CopilotRequest, db: Session = Depends(get_db)) -> CopilotResponse:
    logic = prompt_to_filter(payload.goal)
    audience = CustomerRepository(db).segment(logic, limit=150)
    reasons = explain_filter(logic)
    generated = AIService().generate_campaign(payload.goal, len(audience), reasons)
    return CopilotResponse(
        goal=payload.goal,
        audience_size=len(audience),
        reasoning=reasons,
        recommended_campaign=generated["recommended_campaign"],
        channel=generated["channel"],
        message=generated["message"],
        customer_ids=[customer.id for customer in audience],
    )


@app.get("/api/campaigns", response_model=list[CampaignOut])
def campaigns(db: Session = Depends(get_db)) -> list[models.Campaign]:
    return CampaignRepository(db).list()


@app.post("/api/campaigns/launch", response_model=CampaignOut)
async def launch_campaign(
    payload: LaunchCampaignRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
) -> models.Campaign:
    customers = CustomerRepository(db).by_ids(payload.customer_ids)
    repo = CampaignRepository(db)
    campaign = repo.create(payload.name, payload.goal, payload.channel, len(customers))
    client = ChannelClient()
    for customer in customers:
        communication = repo.add_communication(campaign.id, customer.id, payload.channel, payload.message)
        db.add(models.CommunicationEvent(communication_id=communication.id, event_type="SENT", timestamp=datetime.now(UTC)))
        background_tasks.add_task(client.send, communication, customer)
    db.commit()
    db.refresh(campaign)
    return campaign


@app.post("/api/receipts")
def receipts(payload: ReceiptIn, db: Session = Depends(get_db)) -> dict:
    communication = db.get(models.Communication, int(payload.external_id))
    if not communication:
        return {"accepted": False}
    communication.status = payload.event_type
    event = models.CommunicationEvent(
        communication_id=communication.id,
        event_type=payload.event_type,
        timestamp=payload.timestamp or datetime.now(UTC),
    )
    db.add(event)
    db.commit()
    return {"accepted": True}


@app.get("/api/analytics", response_model=AnalyticsOut)
def analytics(db: Session = Depends(get_db)) -> AnalyticsOut:
    return campaign_analytics(db)


@app.get("/api/campaigns/{campaign_id}/analytics", response_model=AnalyticsOut)
def campaign_detail_analytics(campaign_id: int, db: Session = Depends(get_db)) -> AnalyticsOut:
    return campaign_analytics(db, campaign_id)


@app.get("/api/next-best-campaign")
def next_best_campaign(db: Session = Depends(get_db)) -> dict:
    now = datetime.now(UTC)
    inactive_count = db.scalar(
        select(func.count(models.Customer.id)).where(models.Customer.last_order_date < now.replace(day=1))
    ) or 0
    vip_count = db.scalar(select(func.count(models.Customer.id)).where(models.Customer.total_spent > 15000)) or 0
    return AIService().next_best_campaign({"inactive_count": inactive_count, "vip_count": vip_count})
