import OpenAI from "openai";
import { config } from "../config.js";

const client = config.openAiKey ? new OpenAI({ apiKey: config.openAiKey }) : null;

export async function generateCampaignPlan(objective: string, audienceSize: number) {
  const fallback = {
    subject: "We saved something special for you",
    message: "Hi {{name}}, we noticed you have not shopped with us recently. Enjoy 20% off your next order in {{city}}.",
    cta: "Shop Now",
    channel: "WhatsApp",
    expectedConversion: 11.2,
    expectedRevenue: 82000,
    confidence: 87,
    audienceSize
  };

  if (!client) return fallback;

  try {
    const response = await client.chat.completions.create({
      model: config.openAiModel,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "Return compact JSON with subject, message, cta, channel, expectedConversion, expectedRevenue, confidence for a retail CRM campaign."
        },
        { role: "user", content: `Objective: ${objective}. Audience size: ${audienceSize}. Use {{name}}, {{city}}, {{lastPurchase}}, {{totalSpend}}.` }
      ]
    });
    return { ...fallback, ...JSON.parse(response.choices[0]?.message?.content ?? "{}") };
  } catch {
    return fallback;
  }
}

export function generateInsights() {
  return [
    "WhatsApp performed 32% better than SMS.",
    "Customers aged 25-35 had highest engagement.",
    "Hyderabad customers converted most.",
    "Inactive high-spend customers should receive a 20% comeback offer."
  ];
}
