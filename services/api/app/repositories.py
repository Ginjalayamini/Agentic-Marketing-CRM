from __future__ import annotations

from datetime import UTC, datetime, timedelta

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app import models


class CustomerRepository:
    def __init__(self, db: Session):
        self.db = db

    def list(self, limit: int = 50, offset: int = 0) -> list[models.Customer]:
        return list(self.db.scalars(select(models.Customer).order_by(models.Customer.id).limit(limit).offset(offset)))

    def by_ids(self, ids: list[int]) -> list[models.Customer]:
        if not ids:
            return []
        return list(self.db.scalars(select(models.Customer).where(models.Customer.id.in_(ids))))

    def segment(self, logic: dict, limit: int = 100) -> list[models.Customer]:
        stmt = select(models.Customer)
        if min_spent := logic.get("min_total_spent"):
            stmt = stmt.where(models.Customer.total_spent >= min_spent)
        if city := logic.get("city"):
            stmt = stmt.where(func.lower(models.Customer.city) == city.lower())
        if inactive_days := logic.get("inactive_days"):
            cutoff = datetime.now(UTC) - timedelta(days=int(inactive_days))
            stmt = stmt.where(models.Customer.last_order_date < cutoff)
        if logic.get("top_percent"):
            stmt = stmt.order_by(models.Customer.total_spent.desc())
            total = self.db.scalar(select(func.count(models.Customer.id))) or 0
            limit = max(1, int(total * float(logic["top_percent"]) / 100))
        else:
            stmt = stmt.order_by(models.Customer.total_spent.desc())
        return list(self.db.scalars(stmt.limit(limit)))


class CampaignRepository:
    def __init__(self, db: Session):
        self.db = db

    def list(self) -> list[models.Campaign]:
        return list(self.db.scalars(select(models.Campaign).order_by(models.Campaign.created_at.desc()).limit(50)))

    def create(self, name: str, goal: str, channel: str, audience_size: int) -> models.Campaign:
        campaign = models.Campaign(name=name, goal=goal, channel=channel, audience_size=audience_size, status="running")
        self.db.add(campaign)
        self.db.flush()
        return campaign

    def add_communication(self, campaign_id: int, customer_id: int, channel: str, message: str) -> models.Communication:
        communication = models.Communication(
            campaign_id=campaign_id,
            customer_id=customer_id,
            channel=channel,
            message=message,
            status="SENT",
        )
        self.db.add(communication)
        self.db.flush()
        return communication
