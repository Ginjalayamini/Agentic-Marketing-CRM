import express from "express";
import { z } from "zod";
import { config } from "./config.js";
import { Campaign, Communication, CommunicationEvent, Customer, Order, Segment } from "./models.js";
import { dashboardMetrics } from "./services/analytics.js";
import { generateCampaignPlan, generateInsights } from "./services/ai.js";
import { persistSegment } from "./services/agent-tools.js";
import { runCampaignAgent } from "./services/agent.js";
import { predictCampaignPerformance } from "./services/prediction.js";
import { previewAudience, promptToRules, rulesToMongoQuery } from "./services/segmentation.js";

export const router = express.Router();

router.get("/health", (_req, res) => res.json({ status: "ok", service: "xeno-crm-api" }));

router.get("/dashboard", async (_req, res, next) => {
  try {
    res.json({
      metrics: await dashboardMetrics(),
      charts: {
        revenueTrend: [
          { label: "Mon", revenue: 82000 },
          { label: "Tue", revenue: 97000 },
          { label: "Wed", revenue: 76000 },
          { label: "Thu", revenue: 112000 },
          { label: "Fri", revenue: 141000 },
          { label: "Sat", revenue: 128000 },
          { label: "Sun", revenue: 154000 }
        ],
        channelComparison: [
          { channel: "WhatsApp", value: 43 },
          { channel: "Email", value: 29 },
          { channel: "SMS", value: 18 },
          { channel: "RCS", value: 10 }
        ]
      },
      insights: generateInsights()
    });
  } catch (error) {
    next(error);
  }
});

router.get("/customers", async (req, res, next) => {
  try {
    const page = Math.max(1, Number(req.query.page ?? 1));
    const limit = Math.min(100, Math.max(10, Number(req.query.limit ?? 25)));
    const search = String(req.query.search ?? "");
    const query = search ? { $or: [{ name: new RegExp(search, "i") }, { email: new RegExp(search, "i") }, { city: new RegExp(search, "i") }] } : {};
    const [items, total] = await Promise.all([
      Customer.find(query).sort({ totalSpend: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      Customer.countDocuments(query)
    ]);
    res.json({ items, total, page, pages: Math.ceil(total / limit) });
  } catch (error) {
    next(error);
  }
});

router.get("/customers/:id", async (req, res, next) => {
  try {
    const [customer, orders] = await Promise.all([
      Customer.findById(req.params.id).lean(),
      Order.find({ customerId: req.params.id }).sort({ date: -1 }).limit(10).lean()
    ]);
    if (!customer) return res.status(404).json({ error: "Customer not found" });
    res.json({
      customer,
      orders,
      summary: "Frequently purchases fashion products. High likelihood of responding to discount campaigns."
    });
  } catch (error) {
    next(error);
  }
});

router.post("/segments/preview", async (req, res, next) => {
  try {
    const body = z.object({ prompt: z.string().min(3) }).parse(req.body);
    const rules = promptToRules(body.prompt);
    const audience = await previewAudience(rules);
    res.json({ prompt: body.prompt, rules, ...audience });
  } catch (error) {
    next(error);
  }
});

router.post("/segments", async (req, res, next) => {
  try {
    const body = z.object({ name: z.string().min(2), rules: z.record(z.unknown()) }).parse(req.body);
    const audienceSize = await Customer.countDocuments(rulesToMongoQuery(body.rules));
    const segment = await Segment.create({ name: body.name, rules: body.rules, audienceSize });
    res.status(201).json(segment);
  } catch (error) {
    next(error);
  }
});

router.get("/segments", async (_req, res, next) => {
  try {
    res.json(await Segment.find().sort({ createdAt: -1 }).lean());
  } catch (error) {
    next(error);
  }
});

router.post("/ai/message", async (req, res, next) => {
  try {
    const body = z.object({ objective: z.string().min(3), audienceSize: z.number().default(421) }).parse(req.body);
    res.json(await generateCampaignPlan(body.objective, body.audienceSize));
  } catch (error) {
    next(error);
  }
});

router.post("/copilot", async (req, res, next) => {
  try {
    const body = z.object({ prompt: z.string().min(3) }).parse(req.body);
    const rules = promptToRules(body.prompt);
    const audience = await previewAudience(rules, 5);
    const plan = await generateCampaignPlan(body.prompt, audience.audienceSize);
    res.json({ rules, audienceSize: audience.audienceSize, customers: audience.customers, plan });
  } catch (error) {
    next(error);
  }
});

router.post("/agent/run", async (req, res, next) => {
  try {
    const body = z.object({ goal: z.string().min(3) }).parse(req.body);
    res.json(await runCampaignAgent(body.goal));
  } catch (error) {
    next(error);
  }
});

router.post("/agent/approve", async (req, res, next) => {
  try {
    const body = z
      .object({
        goal: z.string().min(3),
        segment: z.object({ name: z.string(), rules: z.record(z.unknown()), audienceSize: z.number() }),
        campaignDraft: z.object({ name: z.string(), message: z.string(), channel: z.string() })
      })
      .parse(req.body);
    const segment = await persistSegment(body.segment);
    const campaign = await Campaign.create({
      name: body.campaignDraft.name,
      objective: body.goal,
      segmentId: segment._id,
      channel: body.campaignDraft.channel,
      message: body.campaignDraft.message,
      status: "APPROVED"
    });
    res.status(201).json({ approved: true, segment, campaign });
  } catch (error) {
    next(error);
  }
});

router.post("/agent/launch", async (req, res, next) => {
  try {
    const body = z.object({ campaignId: z.string() }).parse(req.body);
    const campaign = await Campaign.findById(body.campaignId);
    if (!campaign) return res.status(404).json({ error: "Campaign not found" });
    const segment = await Segment.findById(campaign.segmentId).lean();
    const customers = await Customer.find(rulesToMongoQuery((segment?.rules ?? {}) as Record<string, unknown>)).limit(500).lean();
    campaign.status = "RUNNING";
    await campaign.save();
    for (const customer of customers) {
      const communication = await Communication.create({
        campaignId: campaign._id,
        customerId: customer._id,
        channel: campaign.channel,
        status: "SENT"
      });
      await CommunicationEvent.create({ communicationId: communication._id, campaignId: campaign._id, eventType: "SENT" });
      await fetch(`${config.channelServiceUrl}/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          communicationId: communication._id,
          campaignId: campaign._id,
          customerId: customer._id,
          recipient: campaign.channel === "Email" ? customer.email : customer.phone,
          message: campaign.message,
          channel: campaign.channel,
          callbackUrl: `${config.publicApiUrl}/api/receipt`
        })
      }).catch(() => undefined);
    }
    res.json({ launched: true, campaign, sent: customers.length });
  } catch (error) {
    next(error);
  }
});

router.post("/campaigns/predict", async (req, res, next) => {
  try {
    const body = z.object({ audienceSize: z.number(), channel: z.string(), rules: z.record(z.unknown()).optional() }).parse(req.body);
    res.json(predictCampaignPerformance({ audienceSize: body.audienceSize, channel: body.channel, rules: body.rules }));
  } catch (error) {
    next(error);
  }
});

router.get("/insights", async (_req, res, next) => {
  try {
    const [segments, cityRevenue] = await Promise.all([
      Customer.aggregate([{ $group: { _id: "$lifecycleSegment", customers: { $sum: 1 }, avgHealth: { $avg: "$healthScore" } } }]),
      Customer.aggregate([{ $group: { _id: "$city", revenue: { $sum: "$totalSpend" } } }, { $sort: { revenue: -1 } }, { $limit: 5 }])
    ]);
    res.json({
      recommendations: generateInsights(),
      segments,
      cityRevenue,
      nextActions: [
        "Launch WhatsApp winback for high-value inactive customers.",
        "Create retention journey for At Risk customers with health score below 55.",
        "Use RCS rich cards for new shoppers in fashion and shoes."
      ]
    });
  } catch (error) {
    next(error);
  }
});

router.post("/campaigns", async (req, res, next) => {
  try {
    const body = z
      .object({
        name: z.string().min(2),
        objective: z.string().min(3),
        segmentId: z.string(),
        channel: z.enum(["WhatsApp", "SMS", "Email", "RCS"]),
        message: z.string().min(3)
      })
      .parse(req.body);
    const campaign = await Campaign.create({ ...body, status: "DRAFT" });
    res.status(201).json(campaign);
  } catch (error) {
    next(error);
  }
});

router.post("/campaigns/:id/launch", async (req, res, next) => {
  try {
    const campaign = await Campaign.findById(req.params.id);
    if (!campaign) return res.status(404).json({ error: "Campaign not found" });
    const segment = await Segment.findById(campaign.segmentId).lean();
    const customers = await Customer.find(rulesToMongoQuery((segment?.rules ?? {}) as Record<string, unknown>)).limit(500).lean();
    campaign.status = "RUNNING";
    await campaign.save();

    for (const customer of customers) {
      const communication = await Communication.create({
        campaignId: campaign._id,
        customerId: customer._id,
        channel: campaign.channel,
        status: "SENT"
      });
      await CommunicationEvent.create({ communicationId: communication._id, campaignId: campaign._id, eventType: "SENT" });
      await fetch(`${config.channelServiceUrl}/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          communicationId: communication._id,
          campaignId: campaign._id,
          recipient: campaign.channel === "Email" ? customer.email : customer.phone,
          message: campaign.message,
          channel: campaign.channel,
          callbackUrl: `${config.publicApiUrl}/api/receipt`
        })
      }).catch(() => undefined);
    }
    res.json({ campaign, sent: customers.length });
  } catch (error) {
    next(error);
  }
});

router.get("/campaigns", async (_req, res, next) => {
  try {
    res.json(await Campaign.find().sort({ createdAt: -1 }).lean());
  } catch (error) {
    next(error);
  }
});

router.post("/receipt", async (req, res, next) => {
  try {
    const body = z.object({ communicationId: z.string(), campaignId: z.string(), eventType: z.string(), timestamp: z.string().optional() }).parse(req.body);
    await Communication.findByIdAndUpdate(body.communicationId, { status: body.eventType, timestamp: body.timestamp ? new Date(body.timestamp) : new Date() });
    await CommunicationEvent.create({
      communicationId: body.communicationId,
      campaignId: body.campaignId,
      eventType: body.eventType,
      timestamp: body.timestamp ? new Date(body.timestamp) : new Date()
    });
    res.json({ accepted: true });
  } catch (error) {
    next(error);
  }
});

router.get("/analytics", async (_req, res, next) => {
  try {
    res.json(await dashboardMetrics());
  } catch (error) {
    next(error);
  }
});
