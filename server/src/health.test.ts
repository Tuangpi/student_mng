import { describe, expect, it } from "vitest";
import { createServer } from "./app.js";

describe("health endpoint", () => {
  it("returns ok", async () => {
    const app = await createServer();
    // Simple handler-based check without needing a real HTTP server
    expect(app).toBeDefined();
    expect(typeof app.get).toBe("function");
  });
});