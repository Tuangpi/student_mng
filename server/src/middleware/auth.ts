import type { NextFunction, Request, Response } from "express";
import { AppError } from "../error.js";
import { findValidSession } from "../auth/session.js";
import { extractSessionToken } from "../csrf.js";

export interface AuthUser {
  userId: string;
  schoolId: string;
  role: string;
  email: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
      schoolId?: string;
    }
  }
}

export async function requireAuth(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  const token = extractSessionToken(req);
  if (!token) {
    return next(new AppError("Authentication required", 401));
  }
  const context = await findValidSession(token);
  if (!context) {
    return next(new AppError("Session invalid or expired", 401));
  }
  req.user = context;
  req.schoolId = context.schoolId;
  next();
}
