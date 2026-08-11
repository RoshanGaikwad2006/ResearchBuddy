import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

export const authenticateToken = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    res.status(401).json({ message: "Access token missing or invalid" });
    return;
  }

  const secret = process.env.JWT_SECRET || "fallback_secret_kriya";

  jwt.verify(token, secret, (err, decoded) => {
    if (err || !decoded) {
      res.status(401).json({ message: "Session expired or token invalid" });
      return;
    }

    req.user = decoded as { id: string; email: string; role: string };
    next();
  });
};
