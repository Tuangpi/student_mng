import { type NextFunction, type Request, type Response } from "express";
import { ZodError, type ZodSchema } from "zod";
import { AppError } from "../error.js";

export const validateRequest = (schema: ZodSchema) => (
  req: Request,
  _res: Response,
  next: NextFunction,
): void => {
  try {
    schema.parse(req.body);
    next();
  } catch (err) {
    if (err instanceof ZodError) {
      next(
        new AppError(
          `Validation error: ${err.issues.map((e) => e.message).join(", ")}`,
          400,
        ),
      );
      return;
    }
    next(err);
  }
};
