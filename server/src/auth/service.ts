import { prisma } from "../db.js";
import { AppError } from "../error.js";
import { comparePassword } from "./password.js";
import {
  createSession,
  hashToken,
  revokeSession,
} from "./session.js";
import { createAuditLog } from "../audit.js";
import type { SessionContext } from "./session.js";

export interface AuthUserView {
  id: string;
  email: string;
  role: string;
  schoolId: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
}

export async function signIn(input: {
  email: string;
  password: string;
  ip?: string | undefined;
  userAgent?: string | undefined;
}): Promise<{ token: string; user: AuthUserView }> {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  if (!user) {
    throw new AppError("Invalid email or password", 401);
  }

  const passwordValid = await comparePassword(input.password, user.passwordHash);
  if (!passwordValid || !user.isActive) {
    await createAuditLog({
      schoolId: user.schoolId,
      userId: user.id,
      action: "AUTH_SIGNIN_FAILED",
      entity: "User",
      entityId: user.id,
      metadata: { reason: passwordValid ? "inactive" : "invalid_password" },
    });
    throw new AppError("Invalid email or password", 401);
  }

  const { token } = await createSession({
    userId: user.id,
    schoolId: user.schoolId,
  });
  await createAuditLog({
    schoolId: user.schoolId,
    userId: user.id,
    action: "AUTH_SIGNIN",
    entity: "User",
    entityId: user.id,
    metadata: { ip: input.ip, userAgent: input.userAgent },
  });

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      schoolId: user.schoolId,
      firstName: user.firstName,
      lastName: user.lastName,
      isActive: user.isActive,
    },
  };
}

export async function signOut(input: {
  token: string;
  userId: string;
  schoolId: string;
}): Promise<void> {
  const tokenHash = hashToken(input.token);
  await revokeSession(tokenHash).catch(() => {
    // Already revoked or expired; signout stays idempotent.
  });
  await createAuditLog({
    schoolId: input.schoolId,
    userId: input.userId,
    action: "AUTH_SIGNOUT",
    entity: "Session",
    metadata: { revoked: true },
  });
}

export async function getCurrentUser(session: SessionContext): Promise<AuthUserView> {
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      email: true,
      role: true,
      schoolId: true,
      firstName: true,
      lastName: true,
      isActive: true,
    },
  });
  if (!user || !user.isActive) {
    throw new AppError("User not found or inactive", 401);
  }
  return user;
}
