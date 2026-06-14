import logging

import httpx

from app.config import get_settings
from app.models import Communication, Customer

logger = logging.getLogger(__name__)


class ChannelClient:
    def __init__(self) -> None:
        self.settings = get_settings()

    async def send(self, communication: Communication, customer: Customer) -> None:
        payload = {
            "external_id": str(communication.id),
            "recipient": customer.email if communication.channel == "email" else customer.phone,
            "message": communication.message.replace("{{name}}", customer.name),
            "channel": communication.channel,
            "callback_url": f"{self.settings.public_api_url}/api/receipts",
        }
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                await client.post(f"{self.settings.channel_simulator_url}/simulate", json=payload)
        except Exception:
            logger.exception("Failed to call channel simulator")
