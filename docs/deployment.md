# Deployment Guide

## Neon PostgreSQL

1. Create a Neon project.
2. Copy the connection string.
3. Set `DATABASE_URL` in Render for the CRM API.

## Render: Python CRM API (optional)

- Root directory: `services/api`
- Build command: `pip install -r requirements.txt`
- Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- Environment:
  - `DATABASE_URL`
  - `GEMINI_API_KEY`
  - `CHANNEL_SIMULATOR_URL`
  - `PUBLIC_API_URL`
  - `CORS_ORIGINS`

## Render: Node CRM API

- Root directory: `services/node-api`
- Build command: `npm install && npm run build`
- Start command: `npm start`
- Environment:
  - `MONGODB_URI` or `DATABASE_URL`
  - `OPENAI_API_KEY`
  - `OPENAI_MODEL`
  - `CHANNEL_SERVICE_URL`
  - `PUBLIC_API_URL`
  - `CORS_ORIGIN`
  - `NODE_ENV=production`

## Render: Node Channel Simulator

- Root directory: `services/node-channel-simulator`
- Build command: `npm install && npm run build`
- Start command: `npm start`
- Environment:
  - `CORS_ORIGIN`

Run seed once from a Render shell:

```bash
python -m app.seed
```

## Render: Channel Simulator

- Root directory: `services/channel-simulator`
- Build command: `pip install -r requirements.txt`
- Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

Set the CRM `CHANNEL_SIMULATOR_URL` to the simulator service URL.

## Vercel: Frontend

- Root directory: `apps/web`
- Build command: `npm run build`
- Output: Next.js default
- Environment:
  - `NEXT_PUBLIC_API_URL=https://your-render-api.onrender.com`
