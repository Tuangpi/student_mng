import cors from "cors";
import dotenv from "dotenv";
import express, { type Express } from "express";
import helmet from "helmet";

dotenv.config();

export async function createServer(): Promise<Express> {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: process.env.CLIENT_URL ?? "*" }));
  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  return app;
}