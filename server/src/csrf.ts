import { config } from "./env.js";
import { randomBytes } from "node:crypto";
import { SESSION_TTL_MS } from "./session.js";
import type { NextFunction, Request, Response } from "express";
import { AppError } from "./error.js";

const CSRF_COOKIE = "csrf-token";
const CSRF_HEADER = "x-csrf-token";
const SESSION_COOKIE = "session_token";

export function generateCsrfToken(): string {
  return randomBytes(24).toString("base64url");
}

export function setCsrfCookie(res: Response, token: string): void {
  res.cookie(CSRF_COOKIE, token, {
    httpOnly: false,
    sameSite: "lax",
    secure: config.IS_PRODUCTION,
    path: "/",
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });
}

export function extractCsrfCookie(req: Request): string | undefined {
  const cookie = req.headers.cookie;
  if (!cookie) return undefined;
  const match = cookie.match(/(?:^|;\s*)csrf-token=([^;]+)/);
  return match?.[1];
}

export function validateCsrf(req: Request): string | undefined {
  const cookieToken = extractCsrfCookie(req);
  const headerToken = Array.isArray(req.headers[CSRF_HEADER])
    ? req.headers[CSRF_HEADER][0]
    : req.headers[CSRF_HEADER];
  if (!cookieToken || !headerToken || headerToken !== cookieToken) {
    return undefined;
  }
  return cookieToken;
}

export function requireCsrf(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  const token = validateCsrf(req);
  if (!token) {
    return next(new AppError("CSRF token missing or invalid", 403));
  }
  next();
}

export function setSessionCookie(res: Response, token: string): void {
  res.cookie(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: config.IS_PRODUCTION,
    path: "/",
    maxAge: SESSION_TTL_MS,
  });
}

export function clearSessionCookie(res: Response): void {
  res.clearCookie(SESSION_COOKIE, { path: "/", secure: config.IS_PRODUCTION, sameSite: "lax", httpOnly: true });
  res.clearCookie(CSRF_COOKIE, { path: "/", secure: config.IS_PRODUCTION });
}

export function extractSessionToken(req: Request): string | undefined {
  const cookie = req.headers.cookie;
  if (!cookie) return undefined;
  const match = cookie.match(/(?:^|;\s*)session_token=([^;]+)/);
  return match?.[1];
}
