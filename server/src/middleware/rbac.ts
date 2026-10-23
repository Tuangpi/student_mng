import type { NextFunction, Request, Response } from "express";
import { AppError } from "../error.js";

export type Role =
  | "super-admin"
  | "school-admin"
  | "principal"
  | "teacher"
  | "accountant"
  | "parent"
  | "student";

// Role -> permissions. "*" grants every permission (super-admin).
export const ROLE_PERMISSIONS: Record<Role, string[]> = {
  "super-admin": ["*"],
  "school-admin": [
    "school:manage",
    "users:manage",
    "students:view",
    "teachers:view",
    "classes:view",
    "fees:manage",
    "invoices:manage",
    "payments:record",
    "reports:view",
    "audit:view",
  ],
  principal: [
    "students:view",
    "teachers:view",
    "classes:manage",
    "attendance:view",
    "grades:view",
    "reports:view",
  ],
  teacher: [
    "students:view",
    "classes:manage:own",
    "attendance:record:own",
    "grades:record:own",
  ],
  accountant: ["fees:manage", "invoices:manage", "payments:record", "reports:view"],
  parent: ["children:view:linked"],
  student: ["self:view"],
};

export function hasRole(userRole: string, allowed: Role[]): boolean {
  return allowed.includes(userRole as Role);
}

export function hasPermission(userRole: string, permission: string): boolean {
  const permissions = ROLE_PERMISSIONS[userRole as Role] ?? [];
  return permissions.includes("*") || permissions.includes(permission);
}

export function requireRole(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AppError("Authentication required", 401));
    }
    if (!hasRole(req.user.role, roles)) {
      return next(new AppError("Forbidden", 403));
    }
    next();
  };
}

export function requirePermission(permission: string) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AppError("Authentication required", 401));
    }
    if (!hasPermission(req.user.role, permission)) {
      return next(new AppError("Forbidden", 403));
    }
    next();
  };
}

export function requireSameSchool(param = "schoolId") {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AppError("Authentication required", 401));
    }
    if (req.user.role === "super-admin") {
      return next();
    }
    const schoolIdParam =
      req.params[param] ??
      (req.body as Record<string, unknown> | undefined)?.[param] ??
      (req.query as Record<string, unknown> | undefined)?.[param];
    if (req.user.schoolId !== schoolIdParam) {
      return next(
        new AppError("Forbidden: cannot access another school's data", 403),
      );
    }
    next();
  };
}
