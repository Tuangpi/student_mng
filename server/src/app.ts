import cors from "cors";
import express, { type Express } from "express";
import helmet from "helmet";
import { config } from "./env.js";
import { errorMiddleware } from "./error.js";
import { logger } from "./logger.js";
import authRoutes from "./auth/routes.js";

export function createServer(): Express {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: config.CLIENT_URL }));
  app.use(express.json());

  app.use("/api", authRoutes);

  app.get("/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  app.use((_req, res) => {
    res.status(404).json({ error: "Not found" });
  });

  app.use(errorMiddleware);

  logger.info("Server initialized", { port: config.PORT, env: config.NODE_ENV });

  return app;
}
