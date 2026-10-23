import { describe, expect, it } from "vitest";
import type { NextFunction, Request, Response } from "express";
import { AppError, errorMiddleware } from "./error.js";

describe("error handling", () => {
  it("AppError carries status code, message, and operational flag", () => {
    const err = new AppError("Forbidden", 403);
    expect(err.message).toBe("Forbidden");
    expect(err.statusCode).toBe(403);
    expect(err.isOperational).toBe(true);
  });

  it("errorMiddleware does not leak unexpected error details to the client", () => {
    const secret = "super-secret-session-secret";
    const unexpected = new Error(`unexpected failure: ${secret}`);
    const statuses: number[] = [];
    const bodies: Record<string, unknown>[] = [];
    const res = {
      status: (code: number) => {
        statuses.push(code);
        return res;
      },
      json: (body: Record<string, unknown>) => {
        bodies.push(body);
        return res;
      },
    } as unknown as Response;
    errorMiddleware(
      unexpected,
      {} as unknown as Request,
      res,
      (() => {}) as unknown as NextFunction,
    );
    expect(statuses).toEqual([500]);
    expect(bodies[0]?.error).toBe("Internal server error");
    expect(JSON.stringify(bodies[0])).not.toContain(secret);
  });

  it("errorMiddleware returns the operational error message to the client", () => {
    const err = new AppError("Invalid input", 400);
    const statuses: number[] = [];
    const bodies: Record<string, unknown>[] = [];
    const res = {
      status: (code: number) => {
        statuses.push(code);
        return res;
      },
      json: (body: Record<string, unknown>) => {
        bodies.push(body);
        return res;
      },
    } as unknown as Response;
    errorMiddleware(
      err,
      {} as unknown as Request,
      res,
      (() => {}) as unknown as NextFunction,
    );
    expect(statuses).toEqual([400]);
    expect(bodies[0]?.error).toBe("Invalid input");
  });
});
