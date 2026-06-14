from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app import models
from app.schemas import AnalyticsOut


EVENTS = ["SENT", "DELIVERED", "OPENED", "READ", "CLICKED", "CONVERTED"]


def campaign_analytics(db: Session, campaign_id: int | None = None) -> AnalyticsOut:
    stmt = (
        select(models.CommunicationEvent.event_type, func.count(models.CommunicationEvent.id))
        .join(models.Communication)
        .group_by(models.CommunicationEvent.event_type)
    )
    if campaign_id:
        stmt = stmt.where(models.Communication.campaign_id == campaign_id)

    counts = {event.lower(): 0 for event in EVENTS}
    for event_type, count in db.execute(stmt).all():
        counts[event_type.lower()] = count

    sent = max(counts["sent"], 1)
    clicked = counts["clicked"]
    converted = counts["converted"]
    return AnalyticsOut(
        sent=counts["sent"],
        delivered=counts["delivered"],
        opened=counts["opened"],
        read=counts["read"],
        clicked=clicked,
        converted=converted,
        delivery_rate=round(counts["delivered"] / sent * 100, 2),
        open_rate=round(counts["opened"] / sent * 100, 2),
        click_rate=round(clicked / sent * 100, 2),
        conversion_rate=round(converted / sent * 100, 2),
        revenue_generated=float(converted * 1450),
    )
