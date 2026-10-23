import { config as dotenvConfig } from "dotenv";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { defineConfig, env } from "prisma/config";

// Load the repo-root .env (one level above this file's server/ dir).
const __filename = fileURLToPath(import.meta.url);
const rootDir = resolve(dirname(__filename), "..");
dotenvConfig({ path: resolve(rootDir, ".env") });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
  datasource: { url: env("DATABASE_URL") },
});
