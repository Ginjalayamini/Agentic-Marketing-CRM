import asyncio
import random
from datetime import UTC, datetime

import httpx
from fastapi import BackgroundTasks, FastAPI
from pydantic import BaseModel, HttpUrl

app = FastAPI(title="CampaignPilot Channel Simulator", version="1.0.0")


class SimulateRequest(BaseModel):
    external_id: str
    recipient: str
    message: str
    channel: str
    callback_url: HttpUrl


EVENT_FUNNELS = {
    "email": [("DELIVERED", 0.95), ("OPENED", 0.42), ("CLICKED", 0.16), ("CONVERTED", 0.06)],
    "whatsapp": [("DELIVERED", 0.97), ("READ", 0.72), ("CLICKED", 0.22), ("CONVERTED", 0.09)],
    "sms": [("DELIVERED", 0.93), ("READ", 0.55), ("CLICKED", 0.11), ("CONVERTED", 0.04)],
    "rcs": [("DELIVERED", 0.9), ("READ", 0.64), ("CLICKED", 0.2), ("CONVERTED", 0.08)],
}


@app.get("/health")
def health() -> dict:
    return {"status": "ok", "service": "channel-simulator"}


@app.post("/simulate")
def simulate(payload: SimulateRequest, background_tasks: BackgroundTasks) -> dict:
    background_tasks.add_task(run_simulation, payload)
    return {"accepted": True, "external_id": payload.external_id}


async def run_simulation(payload: SimulateRequest) -> None:
    funnel = EVENT_FUNNELS.get(payload.channel, EVENT_FUNNELS["email"])
    if random.random() < 0.04:
        await post_event(payload, "FAILED")
        return

    for event_type, probability in funnel:
        await asyncio.sleep(random.uniform(0.25, 1.25))
        if random.random() <= probability:
            await post_event(payload, event_type)
        else:
            break


async def post_event(payload: SimulateRequest, event_type: str) -> None:
    async with httpx.AsyncClient(timeout=10) as client:
        await client.post(
            str(payload.callback_url),
            json={
                "external_id": payload.external_id,
                "event_type": event_type,
                "timestamp": datetime.now(UTC).isoformat(),
            },
        )
