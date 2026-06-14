import dotenv from "dotenv";

dotenv.config();

export const config = {
  port: Number(process.env.PORT ?? 8000),
  mongoUri: process.env.MONGODB_URI ?? "mongodb://127.0.0.1:27017/xeno-campaign-copilot",
  openAiKey: process.env.OPENAI_API_KEY,
  openAiModel: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
  channelServiceUrl: process.env.CHANNEL_SERVICE_URL ?? "http://localhost:8010",
  publicApiUrl: process.env.PUBLIC_API_URL ?? "http://localhost:8000",
  corsOrigin: process.env.CORS_ORIGIN ?? "http://localhost:3000"
};
