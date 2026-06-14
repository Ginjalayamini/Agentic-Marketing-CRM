# Interview Prep

## Why AI-native?

Traditional CRMs make marketers manually choose filters, write content, pick channels, and interpret reports. This product starts from intent and lets AI orchestrate the workflow from goal to segment to campaign to insight.

## Why separate channel service?

It mirrors real production architecture. CRMs do not directly control WhatsApp, SMS, Email, or RCS delivery. A separate delivery layer lets us isolate provider logic, retries, failures, callbacks, and scaling behavior.

## Why callbacks?

Delivery is asynchronous. A campaign send may succeed immediately, but delivery, opens, clicks, and conversions happen later. Callbacks let the CRM update communication state as events arrive.

## Why MongoDB?

Customer profiles, segment rules, campaign metadata, and event payloads can evolve quickly. MongoDB is flexible for a take-home CRM where schema iteration and nested rule storage matter.

## Why LangGraph?

The campaign copilot is not a single prompt. It is a multi-step workflow with explicit stages: goal analysis, audience discovery, RFM scoring, churn analysis, channel recommendation, message generation, approval, launch, and insight generation. LangGraph makes those stages visible and maintainable.

## Why LangChain?

LangChain provides model integration and structured AI workflow building blocks. In this project it pairs with OpenAI and LangGraph to support agentic campaign orchestration.

## How would this scale?

Campaign launch should move from direct API loops to queue-backed workers. Kafka or RabbitMQ can carry communication events. Redis can manage jobs and rate limits. Analytics can be streamed into materialized collections or a warehouse.

## Tradeoffs made

The project favors demo reliability and clear system design over heavy infrastructure. Direct API calls are easier to run locally, while the README documents the queue and event-streaming path for production scale.

## Future improvements

- Add authentication and tenant isolation.
- Add idempotency for receipt callbacks.
- Add real provider integrations.
- Add A/B testing and control groups.
- Add predictive models for churn and conversion.
- Add background workers for large campaigns.
