import type { Request, Response, NextFunction } from "express";
import { z } from "zod";

export const paginationQuerySchema = z.object({
  page: z.string().optional().transform((val) => {
    if (!val) return 1;
    const num = parseInt(val, 10);
    return isNaN(num) || num < 1 ? 1 : num;
  }),
  limit: z.string().optional().transform((val) => {
    if (!val) return 10;
    const num = parseInt(val, 10);
    return isNaN(num) || num < 1 ? 10 : num > 100 ? 100 : num; // Caps maximum query limit at 100 records
  }),
  search: z.string().optional(),
  departmentId: z.string().optional(),
  publicationYear: z.string().optional().transform((val) => {
    if (!val) return undefined;
    const num = parseInt(val, 10);
    return isNaN(num) ? undefined : num;
  }),
  status: z.string().optional(),
});

export const validatePaginationQuery = (req: Request, res: Response, next: NextFunction): void => {
  const result = paginationQuerySchema.safeParse(req.query);
  if (!result.success) {
    res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid query parameter supplied",
        details: result.error.errors,
      },
    });
    return;
  }
  
  // Attach sanitized values to req.query
  req.query = result.data as any;
  next();
};
