import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import { AppError } from "../error.js";
import { validateRequest } from "../middleware/validate.js";
import { requireAuth } from "../middleware/auth.js";
import { requireCsrf } from "../csrf.js";
import {
  setSessionCookie,
  clearSessionCookie,
  setCsrfCookie,
  generateCsrfToken,
  extractSessionToken,
} from "../csrf.js";
import { requireRole, requireSameSchool } from "../middleware/rbac.js";
import { signIn, signOut, getCurrentUser } from "./service.js";

const router = Router();

const signInSchema = z.object({
  email: z.string().email({ message: "Enter a valid email address" }),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters" }),
});

router.post("/csrf-token", (_req, res) => {
  const token = generateCsrfToken();
  setCsrfCookie(res, token);
  res.json({ ok: true });
});

router.post(
  "/signin",
  validateRequest(signInSchema),
  async (req, res, next) => {
    try {
      const { email, password } = req.body as {
        email: string;
        password: string;
      };
      const { token, user } = await signIn({
        email,
        password,
        ip: req.ip,
        userAgent: req.get("user-agent"),
      });
      const csrfToken = generateCsrfToken();
      setCsrfCookie(res, csrfToken);
      setSessionCookie(res, token);
      res.status(200).json({ user });
    } catch (err) {
      next(err);
    }
  },
);

router.post(
  "/signout",
  requireAuth,
  requireCsrf,
  async (req, res, next) => {
    try {
      const token = extractSessionToken(req);
      if (token) {
        await signOut({
          token,
          userId: req.user!.userId,
          schoolId: req.user!.schoolId,
        });
      }
      clearSessionCookie(res);
      res.status(200).json({ ok: true });
    } catch (err) {
      next(err);
    }
  },
);

router.get("/me", requireAuth, async (req, res) => {
  const user = await getCurrentUser(req.user!);
  res.status(200).json({ user });
});

// Authorization probes for T003 role/tenant verification. T004 owns real admin
// routes; these probe routes enforce the role matrix and tenant boundary.
router.get(
  "/roles/super-admin",
  requireRole("super-admin"),
  async (req, res) => {
    res.status(200).json({ ok: true, role: req.user!.role });
  },
);

router.get(
  "/roles/school-admin",
  requireRole("school-admin"),
  async (req, res) => {
    res.status(200).json({ ok: true, role: req.user!.role });
  },
);

// Read-only tenant boundary: a caller can read only their own school, unless
// they are a super-admin. T004 owns full school management.
router.get(
  "/schools/:id",
  requireAuth,
  requireSameSchool("id"),
  async (req, res, next) => {
    try {
      const school = await prisma.school.findUnique({
        where: { id: req.params.id },
      });
      if (!school) {
        return next(new AppError("School not found", 404));
      }
      res.status(200).json({ id: school.id, name: school.name, code: school.code });
    } catch (err) {
      next(err);
    }
  },
);

export default router;
