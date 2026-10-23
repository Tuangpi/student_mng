import { describe, expect, it } from "vitest";
import { createServer } from "./app.js";

describe("health endpoint", () => {
  it("returns ok", () => {
    const app = createServer();
    expect(app).toBeDefined();
    expect(typeof app.get).toBe("function");
  });
});