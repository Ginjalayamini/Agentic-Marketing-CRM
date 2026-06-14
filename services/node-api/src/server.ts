import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { config } from "./config.js";
import { connectDb } from "./db.js";
import { router } from "./routes.js";

const app = express();
let dbConnected = false;

app.use(helmet());
app.use(cors({ origin: config.corsOrigin, credentials: true }));
app.use(express.json({ limit: "1mb" }));
app.use(rateLimit({ windowMs: 60_000, limit: 180 }));

// Root routes
app.get("/", (_req, res) => {
  res.json({ message: "Server is running", service: "xeno-crm-api", dbConnected });
});

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "xeno-crm-api", dbConnected });
});

// API routes
app.use("/api", router);

app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(error);
  res.status(400).json({ error: error instanceof Error ? error.message : "Request failed" });
});

// Connect to MongoDB with graceful error handling
(async () => {
  try {
    await connectDb();
    dbConnected = true;
    console.log("✓ MongoDB connected");
  } catch (error) {
    dbConnected = false;
    console.error("✗ MongoDB connection failed:", error instanceof Error ? error.message : error);
    console.warn("⚠ Server starting without database. API will return limited functionality.");
  }
  
  app.listen(config.port, () => {
    console.log(`Xeno CRM API running on http://localhost:${config.port}`);
    console.log(`  GET / → Server status`);
    console.log(`  GET /health → Health check`);
    console.log(`  /api/* → API routes`);
  });
})();
