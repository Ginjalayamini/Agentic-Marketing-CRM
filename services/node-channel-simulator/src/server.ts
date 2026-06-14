import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { z } from "zod";

dotenv.config();

const app = express();
const port = Number(process.env.PORT ?? 8010);

const probabilities = {
  DELIVERED: Number(process.env.DELIVERED_PROBABILITY ?? 0.94),
  OPENED: Number(process.env.OPENED_PROBABILITY ?? 0.58),
  READ: Number(process.env.READ_PROBABILITY ?? 0.68),
  CLICKED: Number(process.env.CLICKED_PROBABILITY ?? 0.22),
  CONVERTED: Number(process.env.CONVERTED_PROBABILITY ?? 0.09)
};

const sendSchema = z.object({
  communicationId: z.string(),
  campaignId: z.string(),
  recipient: z.string(),
  message: z.string(),
  channel: z.enum(["WhatsApp", "SMS", "Email", "RCS"]),
  callbackUrl: z.string().url()
});

app.use(cors({ origin: process.env.CORS_ORIGIN ?? "*" }));
app.use(express.json());

app.get("/health", (_req, res) => res.json({ status: "ok", service: "xeno-channel-simulator" }));

app.post("/send", (req, res) => {
  const payload = sendSchema.parse(req.body);
  void simulate(payload);
  res.status(202).json({ accepted: true, communicationId: payload.communicationId });
});

async function simulate(payload: z.infer<typeof sendSchema>) {
  const funnel = payload.channel === "SMS" ? ["DELIVERED", "READ", "CLICKED", "CONVERTED"] : ["DELIVERED", "OPENED", "CLICKED", "CONVERTED"];
  for (const eventType of funnel) {
    await wait(400 + Math.random() * 1600);
    if (Math.random() > probabilities[eventType as keyof typeof probabilities]) {
      await callback(payload, "FAILED");
      return;
    }
    await callback(payload, eventType);
  }
}

async function callback(payload: z.infer<typeof sendSchema>, eventType: string) {
  await fetch(payload.callbackUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      communicationId: payload.communicationId,
      campaignId: payload.campaignId,
      eventType,
      timestamp: new Date().toISOString()
    })
  }).catch(() => undefined);
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

app.listen(port, () => {
  console.log(`Channel simulator running on http://localhost:${port}`);
});
