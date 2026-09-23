// STEP 4 - validation middleware (same as practice-c)
import { Request, Response, NextFunction } from "express";
import { z, ZodError } from "zod";

export const validateResource =
  (schema: z.ZodType) =>
  (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          error: "Validation failed",
          details: error.issues.map((issue) => ({
            path: issue.path.join("."),
            message: issue.message,
          })),
        });
      }

      next(error);
    }
  };
