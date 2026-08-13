import type { Response } from "express";
import type { AuthenticatedRequest } from "../middleware/auth.middleware.js";
import { DashboardService } from "../services/dashboard.service.js";

export const getDashboardMetrics = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const data = await DashboardService.getDashboardStats({
      id: req.user.id,
      role: req.user.role,
    });

    res.status(200).json(data);
  } catch (error: any) {
    res.status(500).json({ message: error.message || "Failed to fetch dashboard metrics" });
  }
};
