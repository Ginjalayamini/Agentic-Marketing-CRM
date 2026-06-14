import dotenv from "dotenv";

dotenv.config();

const mongoUri =
  process.env.MONGODB_URI ??
  process.env.DATABASE_URL ??
  "mongodb://127.0.0.1:27017/xeno-campaign-copilot";

if (!process.env.MONGODB_URI && !process.env.DATABASE_URL && process.env.NODE_ENV === "production") {
  throw new Error(
    "Missing MongoDB connection string in production. Set MONGODB_URI or DATABASE_URL."
  );
}

export const config = {
  port: Number(process.env.PORT ?? 8000),
  mongoUri,
  openAiKey: process.env.OPENAI_API_KEY,
  openAiModel: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
  channelServiceUrl: process.env.CHANNEL_SERVICE_URL ?? "http://localhost:8010",
  publicApiUrl: process.env.PUBLIC_API_URL ?? "http://localhost:8000",
  corsOrigin: process.env.CORS_ORIGIN ?? "http://localhost:3000"
};
