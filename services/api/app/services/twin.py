from datetime import UTC, datetime

from app.models import Customer


def customer_twin(customer: Customer) -> dict:
    days_since = 999
    if customer.last_order_date:
        days_since = (datetime.now(UTC) - customer.last_order_date).days

    spend = float(customer.total_spent or 0)
    probability = max(8, min(92, int((spend / 250) - (days_since * 0.35) + 45)))
    churn = max(5, min(95, int(days_since * 0.75 - spend / 400)))
    offer = "20% OFF comeback offer" if churn > 55 else "Early access to new arrivals"

    return {
        "predicted_purchase_probability": probability,
        "favorite_category": "Fashion",
        "suggested_offer": offer,
        "preferred_channel": customer.preferred_channel,
        "risk_of_churn": churn,
        "reasoning": [
            f"Lifetime spend is INR {spend:.0f}",
            f"Last purchase was {days_since} days ago",
            f"Preferred channel is {customer.preferred_channel}",
        ],
    }
