import type { Response, NextFunction } from "express";
import type { AuthenticatedRequest } from "./auth.middleware.js";

export const requireRole = (...allowedRoles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        message: `Forbidden: Access denied. Required role: ${allowedRoles.join(" or ")}`,
      });
      return;
    }
    next();
  };
};
