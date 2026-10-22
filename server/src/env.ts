export const config = {
  DATABASE_URL: process.env.DATABASE_URL ?? "",
  PORT: Number(process.env.PORT) || 4000,
  CLIENT_URL: process.env.CLIENT_URL ?? "*",
  SESSION_SECRET: process.env.SESSION_SECRET ?? "",
  NODE_ENV: process.env.NODE_ENV ?? "development",
};