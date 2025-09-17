// src/middlewares/validate.ts
import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";

export const validate =
  (schema: ZodSchema<any>) =>
  (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (err: any) {
      if (err instanceof ZodError) {
        const errors = err.issues.map((e) => ({
          field: e.path.join(".") || "unknown",
          message: e.message,
        }));
        return res.status(400).json({
          message: "Validation failed",
          errors,
        });
      }

      // fallback สำหรับ error อื่น ๆ
      return res.status(500).json({ message: "Internal server error" });
    }
  };
