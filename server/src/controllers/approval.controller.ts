import type { Response } from "express";
import type { AuthenticatedRequest } from "../middleware/auth.middleware.js";
import { ApprovalService } from "../services/approval.service.js";
import type { ApprovalStatus } from "@prisma/client";

const getParamId = (param: string | string[] | undefined): string => {
  if (Array.isArray(param)) return param[0] || "";
  return param || "";
};

export const processDecision = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (req.user?.role !== "RESEARCH_CELL" && req.user?.role !== "ADMIN") {
      res.status(403).json({
        message: "Forbidden: Only Research Cell Administrators can process research approval decisions.",
      });
      return;
    }

    const researchId = getParamId(req.params.researchId);
    const { status, comments } = req.body;

    if (!status || !["APPROVED", "REJECTED", "NEEDS_REVISION"].includes(status)) {
      res.status(400).json({ message: "Invalid approval status provided" });
      return;
    }

    const result = await ApprovalService.processDecision({
      researchId,
      reviewerId: req.user.id,
      status: status as ApprovalStatus,
      comments,
    });

    res.status(200).json({
      message: `Research submission successfully marked as ${status}`,
      data: result,
    });
  } catch (error: any) {
    res.status(400).json({ message: error.message || "Failed to process approval decision" });
  }
};

export const getHistory = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const researchId = getParamId(req.params.researchId);
    const history = await ApprovalService.getHistory(researchId);
    res.status(200).json({ history });
  } catch (error: any) {
    res.status(500).json({ message: error.message || "Failed to retrieve approval history" });
  }
};

export const getPendingQueue = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (req.user?.role !== "RESEARCH_CELL" && req.user?.role !== "ADMIN") {
      res.status(403).json({ message: "Forbidden: Access restricted to Research Cell" });
      return;
    }

    const { page, limit } = req.query;
    const result = await ApprovalService.getPendingQueue(
      page ? Number(page) : 1,
      limit ? Number(limit) : 10
    );

    res.status(200).json(result);
  } catch (error: any) {
    res.status(500).json({ message: error.message || "Failed to fetch pending approval queue" });
  }
};
