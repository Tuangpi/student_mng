import { describe, expect, it } from "vitest";
import { config, required } from "./env.js";

describe("environment validation", () => {
  it("loads required configuration from the environment", () => {
    expect(typeof config.DATABASE_URL).toBe("string");
    expect(config.DATABASE_URL.length).toBeGreaterThan(0);
    expect(config.SESSION_SECRET.length).toBeGreaterThan(0);
    expect(config.PORT).toBe(4000);
    expect(["development", "test", "production"]).toContain(config.NODE_ENV);
  });

  it("throws when a required variable is missing", () => {
    const original = process.env.DATABASE_URL;
    delete process.env.DATABASE_URL;
    expect(() => required("DATABASE_URL")).toThrow(
      /Missing required environment variable: DATABASE_URL/,
    );
    process.env.DATABASE_URL = original;
  });
});
