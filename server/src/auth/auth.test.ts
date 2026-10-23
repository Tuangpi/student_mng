import { describe, expect, it, beforeAll, afterAll } from "vitest";
import request from "supertest";
import type { Express } from "express";
import { createServer } from "../app.js";
import { prisma } from "../db.js";
import { hashPassword } from "./password.js";
import {
  createSession,
  findValidSession,
  hashToken,
  generateToken,
} from "./session.js";
import { hasRole, hasPermission, ROLE_PERMISSIONS } from "../middleware/rbac.js";
import type { Role } from "../middleware/rbac.js";

let app: Express;

const SCHOOL_A = "SCH-TEST-A";
const SCHOOL_B = "SCH-TEST-B";

let schoolAId: string;
let schoolBId: string;
let userAId: string;

async function createSchool(code: string) {
  return prisma.school.create({ data: { name: `Test School ${code}`, code } });
}

async function createUser(
  schoolId: string,
  email: string,
  role: string,
  password = "Secret1234",
) {
  const passwordHash = await hashPassword(password);
  return prisma.user.create({
    data: {
      schoolId,
      email,
      passwordHash,
      role,
      firstName: "Fn",
      lastName: "Ln",
      isActive: true,
    },
  });
}

async function cleanup(schoolIds: string[]) {
  for (const schoolId of schoolIds) {
    await prisma.session.deleteMany({ where: { schoolId } }).catch(() => {});
    await prisma.auditLog.deleteMany({ where: { schoolId } }).catch(() => {});
    await prisma.user.deleteMany({ where: { schoolId } }).catch(() => {});
    await prisma.school.delete({ where: { id: schoolId } }).catch(() => {});
  }
}

const cookieToken = (res: { headers: Record<string, unknown> }, name: string) => {
  const cookies = res.headers["set-cookie"] as string[] | undefined;
  if (!cookies) return undefined;
  const match = cookies[0]?.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match?.[1];
};

const cookieHasAttr = (
  res: { headers: Record<string, unknown> },
  cookieName: string,
  attr: string,
) => {
  const cookies = res.headers["set-cookie"] as string[] | undefined;
  return Boolean(
    cookies?.some((c) => c.startsWith(`${cookieName}=`) && c.includes(attr)),
  );
};

describe("password hashing", () => {
  it("hashes a password and verifies the correct password", async () => {
    const hash = await hashPassword("Secret1234");
    expect(hash).not.toBe("Secret1234");
    expect(await hashPassword("Secret1234")).not.toBe(hash);
  });
});

describe("role matrix", () => {
  it("maps every declared role to at least one permission", () => {
    const roles: Role[] = [
      "super-admin",
      "school-admin",
      "principal",
      "teacher",
      "accountant",
      "parent",
      "student",
    ];
    for (const role of roles) {
      expect(ROLE_PERMISSIONS[role].length).toBeGreaterThan(0);
    }
  });

  it("grants super-admin every permission and denies unrelated roles", () => {
    expect(hasPermission("super-admin", "payments:record")).toBe(true);
    expect(hasPermission("school-admin", "users:manage")).toBe(true);
    expect(hasPermission("teacher", "payments:record")).toBe(false);
    expect(hasPermission("parent", "fees:manage")).toBe(false);
    expect(hasRole("teacher", ["teacher", "principal"])).toBe(true);
    expect(hasRole("teacher", ["school-admin"])).toBe(false);
  });
});

describe("authentication (session cookies)", () => {
  beforeAll(async () => {
    app = createServer();
    const schoolA = await createSchool(SCHOOL_A);
    const schoolB = await createSchool(SCHOOL_B);
    schoolAId = schoolA.id;
    schoolBId = schoolB.id;
    const userA = await createUser(
      schoolAId,
      "teacher-a@school.test",
      "teacher",
    );
    userAId = userA.id;
  });

  afterAll(async () => {
    await cleanup([schoolAId, schoolBId]);
    await prisma.$disconnect();
  });

  it("rejects signin with an invalid body", async () => {
    const res = await request(app).post("/api/signin").send({});
    expect(res.status).toBe(400);
  });

  it("signs in a valid user and sets HttpOnly session + csrf cookies", async () => {
    const res = await request(app)
      .post("/api/signin")
      .send({ email: "teacher-a@school.test", password: "Secret1234" });
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe("teacher-a@school.test");
    expect(res.body.user.passwordHash).toBeUndefined();
    expect(res.body.user.schoolId).toBe(schoolAId);
    const sessionCookie = cookieToken(res, "session_token");
    const csrfCookie = cookieToken(res, "csrf-token");
    expect(sessionCookie).toBeDefined();
    expect(csrfCookie).toBeDefined();
    expect(cookieHasAttr(res, "session_token", "HttpOnly")).toBe(true);
    expect(cookieHasAttr(res, "session_token", "SameSite=Lax")).toBe(true);
    expect(cookieHasAttr(res, "csrf-token", "SameSite=Lax")).toBe(true);
  });

  it("rejects wrong password and unknown email with the same generic message", async () => {
    const wrong = await request(app)
      .post("/api/signin")
      .send({ email: "teacher-a@school.test", password: "WrongPass1234" });
    expect(wrong.status).toBe(401);
    const unknown = await request(app)
      .post("/api/signin")
      .send({ email: "nobody@school.test", password: "Secret1234" });
    expect(unknown.status).toBe(401);
  });

  it("gets the current user from the session cookie", async () => {
    await request(app)
      .post("/api/signin")
      .send({ email: "teacher-a@school.test", password: "Secret1234" });
    const res = await request(app).get("/api/me");
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe("teacher-a@school.test");
    expect(res.body.user.schoolId).toBe(schoolAId);
  });

  it("rejects /me without a session", async () => {
    const res = await request(app).get("/api/me");
    expect(res.status).toBe(401);
  });

  it("rejects an expired session", async () => {
    const expiredToken = "expired-session-token";
    await prisma.session.create({
      data: {
        userId: userAId,
        schoolId: schoolAId,
        tokenHash: hashToken(expiredToken),
        expiresAt: new Date(Date.now() - 1000),
      },
    });
    const res = await request(app)
      .get("/api/me")
      .set("Cookie", `session_token=${expiredToken}`);
    expect(res.status).toBe(401);
  });

  it('signs in a valid user and sets HttpOnly session + csrf cookies', async () => {
    const res = await request(app)
      .post('/api/signin')
      .send({ email: 'teacher-a@school.test', password: 'Secret1234' });
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe('teacher-a@school.test');
    expect(res.body.user.passwordHash).toBeUndefined();
    expect(res.body.user.schoolId).toBe(schoolAId);
    const sessionCookie = cookieToken(res, 'session_token');
    const csrfCookie = cookieToken(res, 'csrf-token');
    expect(sessionCookie).toBeDefined();
    expect(csrfCookie).toBeDefined();
    expect(cookieHasAttr(res, 'session_token', 'HttpOnly')).toBe(true);
    expect(cookieHasAttr(res, 'session_token', 'SameSite=Lax')).toBe(true);
    expect(cookieHasAttr(res, 'csrf-token', 'SameSite=Lax')).toBe(true);
  });

  it('rejects wrong password and unknown email with the same generic message', async () => {
    const wrong = await request(app)
      .post('/api/signin')
      .send({ email: 'teacher-a@school.test', password: 'WrongPass1234' });
    expect(wrong.status).toBe(401);
    const unknown = await request(app)
      .post('/api/signin')
      .send({ email: 'nobody@school.test', password: 'Secret1234' });
    expect(unknown.status).toBe(401);
  });

  it('gets the current user from the session cookie', async () => {
    await request(app)
      .post('/api/signin')
      .send({ email: 'teacher-a@school.test', password: 'Secret1234' });
    const res = await request(app).get('/api/me');
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe('teacher-a@school.test');
    expect(res.body.user.schoolId).toBe(schoolAId);
  });

  it('rejects /me without a session', async () => {
    const res = await request(app).get('/api/me');
    expect(res.status).toBe(401);
  });

  it('rejects an expired session', async () => {
    const expiredToken = 'expired-session-token';
    await prisma.session.create({
      data: {
        userId: userAId,
        schoolId: schoolAId,
        tokenHash: hashToken(expiredToken),
        expiresAt: new Date(Date.now() - 1000),
      },
    });
    const res = await request(app)
      .get('/api/me')
      .set('Cookie', `session_token=${expiredToken}`);
    expect(res.status).toBe(401);
  });

  it('findValidSession returns null for expired or unknown tokens', async () => {
    expect(await findValidSession('does-not-exist')).toBeNull();
    const expired = await createSession({ userId: userAId, schoolId: schoolAId });
    await prisma.session.update({
      where: { id: expired.sessionId },
      data: { expiresAt: new Date(Date.now() - 1000) },
    });
    expect(await findValidSession(expired.token)).toBeNull();
    await prisma.session.delete({ where: { id: expired.sessionId } });
  });

  it('revokes a session on signout and clears cookies', async () => {
    const signin = await request(app)
      .post('/api/signin')
      .send({ email: 'teacher-a@school.test', password: 'Secret1234' });
    const csrfToken = cookieToken(signin, 'csrf-token');
    expect(csrfToken).toBeDefined();

    const res = await request(app)
      .post('/api/signout')
      .set('x-csrf-token', csrfToken!);
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);

    const me = await request(app).get('/api/me');
    expect(me.status).toBe(401);
  });

  it('rejects signout without a valid CSRF token', async () => {
    await request(app)
      .post('/api/signin')
      .send({ email: 'teacher-a@school.test', password: 'Secret1234' });
    const res = await request(app).post('/api/signout');
    expect(res.status).toBe(403);
  });

  it('denies cross-school access to a school resource', async () => {
    const res = await request(app).get(`/api/schools/${schoolBId}`);
    expect(res.status).toBe(403);
  });

  it('allows access to the caller-owned school', async () => {
    const res = await request(app).get(`/api/schools/${schoolAId}`);
    expect(res.status).toBe(200);
    expect(res.body.code).toBe(SCHOOL_A);
  });

  it('denies teacher access to super-admin role route (signed in as teacher)', async () => {
    await request(app)
      .post('/api/signin')
      .send({ email: 'teacher-a@school.test', password: 'Secret1234' });
    const res = await request(app).get('/api/roles/super-admin');
    expect(res.status).toBe(403);
  });

  it('allows super-admin to access any school and super-admin route', async () => {
    const superAdmin = await createUser(
      schoolAId,
      'super-admin@school.test',
      'super-admin',
    );
    const superAgent = request(app);
    await superAgent.post('/api/signin').send({
      email: 'super-admin@school.test',
      password: 'Secret1234',
    });

    const roleRes = await superAgent.get('/api/roles/super-admin');
    expect(roleRes.status).toBe(200);

    const crossRes = await superAgent.get(`/api/schools/${schoolBId}`);
    expect(crossRes.status).toBe(200);

    await prisma.user.delete({ where: { id: superAdmin.id } });
  });
});

describe('audit logging', () => {
  it('writes audit records for signin and signout', async () => {
    const signinRes = await request(app)
      .post('/api/signin')
      .send({ email: 'teacher-a@school.test', password: 'Secret1234' });

    const signinAudit = await prisma.auditLog.findFirst({
      where: {
        schoolId: schoolAId,
        userId: userAId,
        action: 'AUTH_SIGNIN',
      },
    });
    expect(signinAudit).toBeDefined();

    const csrfToken = cookieToken(signinRes, 'csrf-token');
    const signoutRes = await request(app)
      .post('/api/signout')
      .set('x-csrf-token', csrfToken!);
    expect(signoutRes.status).toBe(200);

    const signoutAudit = await prisma.auditLog.findFirst({
      where: {
        schoolId: schoolAId,
        userId: userAId,
        action: 'AUTH_SIGNOUT',
      },
    });
    expect(signoutAudit).toBeDefined();

    await prisma.auditLog.deleteMany({ where: { schoolId: schoolAId } });
  });
});
