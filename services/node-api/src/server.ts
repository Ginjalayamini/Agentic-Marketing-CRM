import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { config } from "./config.js";
import { connectDb } from "./db.js";
import { router } from "./routes.js";

const app = express();

app.use(helmet());
app.use(cors({ origin: config.corsOrigin, credentials: true }));
app.use(express.json({ limit: "1mb" }));
app.use(rateLimit({ windowMs: 60_000, limit: 180 }));
app.use("/api", router);

app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(error);
  res.status(400).json({ error: error instanceof Error ? error.message : "Request failed" });
});

await connectDb();
app.listen(config.port, () => {
  console.log(`Xeno CRM API running on http://localhost:${config.port}`);
});
