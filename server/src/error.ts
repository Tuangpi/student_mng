import type { ErrorRequestHandler } from "express";
import { logger } from "./logger.js";

export class AppError extends Error {
  readonly statusCode: number;
  readonly isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorMiddleware: ErrorRequestHandler = (
  err,
  _req,
  res,
  _next,
): void => {
  const statusCode = err.statusCode ?? 500;
  // Only leak details for operational (expected) errors; hide unexpected errors.
  const message = err.isOperational ? err.message : "Internal server error";

  logger.error("Request error", {
    message: err.message,
    statusCode,
    stack: err.stack,
  });

  res.status(statusCode).json({ error: message });
};
