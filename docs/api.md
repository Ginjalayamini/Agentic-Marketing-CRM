# API Reference

Base URL: `http://localhost:8000`

## Health

`GET /health`

## Overview

`GET /api/overview`

Returns dashboard KPIs, recent campaigns, and chart-ready revenue data.

## Customers

`GET /api/customers?limit=50&offset=0`

`GET /api/customers/{customer_id}/twin`

Returns predicted purchase probability, favorite category, suggested offer, preferred channel, churn risk, and reasoning.

## AI Segments

`POST /api/segments/preview`

```json
{
  "prompt": "Customers inactive for 90 days"
}
```

Returns generated filter logic and matching customers.

## AI Copilot

`POST /api/copilot`

```json
{
  "goal": "Bring back inactive customers"
}
```

Returns audience reasoning, recommended campaign, generated messages, channel, and launch payload.

## Campaigns

`GET /api/campaigns`

`POST /api/campaigns/launch`

```json
{
  "name": "Winback June",
  "goal": "Bring back inactive customers",
  "channel": "whatsapp",
  "message": "Hi {{name}}, enjoy 20% OFF this week.",
  "customer_ids": [1, 2, 3]
}
```

## Receipts

`POST /api/receipts`

Called by the channel simulator.

```json
{
  "external_id": "communication-id",
  "event_type": "DELIVERED",
  "timestamp": "2026-06-10T10:00:00Z"
}
```

## Analytics

`GET /api/analytics`

`GET /api/campaigns/{campaign_id}/analytics`

## Next Best Campaign

`GET /api/next-best-campaign`
