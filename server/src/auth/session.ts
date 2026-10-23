import { createHash, randomBytes } from "node:crypto";
import { prisma } from "../db.js";

export const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const TOKEN_BYTES = 32;

export interface SessionContext {
  userId: string;
  schoolId: string;
  role: string;
  email: string;
}

export function generateToken(): string {
  return randomBytes(TOKEN_BYTES).toString("base64url");
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function createSession(input: {
  userId: string;
  schoolId: string;
}): Promise<{ token: string; sessionId: string }> {
  const token = generateToken();
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  const session = await prisma.session.create({
    data: {
      userId: input.userId,
      schoolId: input.schoolId,
      tokenHash: hashToken(token),
      expiresAt,
    },
  });
  return { token, sessionId: session.id };
}

export async function findValidSession(token: string): Promise<SessionContext | null> {
  const tokenHash = hashToken(token);
  const session = await prisma.session.findUnique({
    where: { tokenHash },
    include: { user: true },
  });
  if (!session) return null;
  if (session.expiresAt < new Date()) return null;
  if (!session.user.isActive) return null;
  return {
    userId: session.userId,
    schoolId: session.schoolId,
    role: session.user.role,
    email: session.user.email,
  };
}

export async function revokeSession(tokenHash: string): Promise<void> {
  await prisma.session.delete({ where: { tokenHash } });
}

export async function revokeAllSessionsForUser(userId: string): Promise<void> {
  await prisma.session.deleteMany({ where: { userId } });
}

export async function deleteExpiredSessions(): Promise<number> {
  const result = await prisma.session.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  });
  return result.count;
}
