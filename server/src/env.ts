import { config as dotenvConfig } from "dotenv";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

// Load environment variables from the repository root `.env` so validation works
// regardless of the working directory the server is started from.
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenvConfig({ path: resolve(__dirname, "../../.env") });

const required = (key: string): string => {
  const value = process.env[key];
  if (!value || value === "") {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};

export { required };

export const config = {
  DATABASE_URL: required("DATABASE_URL"),
  PORT: Number(process.env.PORT) || 4000,
  CLIENT_URL: process.env.CLIENT_URL ?? "*",
  SESSION_SECRET: required("SESSION_SECRET"),
  NODE_ENV: (process.env.NODE_ENV ?? "development") as "development" | "test" | "production",
  IS_PRODUCTION: process.env.NODE_ENV === "production",
} as const;
