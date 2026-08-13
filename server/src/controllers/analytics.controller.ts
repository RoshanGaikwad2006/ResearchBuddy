import type { Response } from "express";
import type { AuthenticatedRequest } from "../middleware/auth.middleware.js";
import { AnalyticsService } from "../services/analytics.service.js";

export const getOverviewAnalytics = async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const analytics = await AnalyticsService.getOverviewAnalytics();
    res.status(200).json(analytics);
  } catch (error: any) {
    res.status(500).json({ message: error.message || "Failed to fetch analytics metrics" });
  }
};
