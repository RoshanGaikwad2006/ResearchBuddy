import { prisma } from "../config/db.js";
import type { ApprovalStatus, ResearchStatus } from "@prisma/client";

export class ApprovalService {
  static async processDecision(params: {
    researchId: string;
    reviewerId: string;
    status: ApprovalStatus;
    comments?: string;
  }) {
    const { researchId, reviewerId, status, comments } = params;

    const research = await prisma.research.findUnique({ where: { id: researchId } });
    if (!research) {
      throw new Error("Research publication not found");
    }

    // Map ApprovalStatus to ResearchStatus
    let targetResearchStatus: ResearchStatus = "UNDER_REVIEW";
    if (status === "APPROVED") {
      targetResearchStatus = "ACCEPTED";
    } else if (status === "REJECTED") {
      targetResearchStatus = "REJECTED";
    } else if (status === "NEEDS_REVISION") {
      targetResearchStatus = "NEEDS_REVISION";
    }

    return prisma.$transaction(async (tx) => {
      // 1. Update Research Status
      const updatedResearch = await tx.research.update({
        where: { id: researchId },
        data: { status: targetResearchStatus },
      });

      // 2. Create Audit Approval Record
      const approvalRecord = await tx.approval.create({
        data: {
          researchId,
          reviewerId,
          status,
          comments: comments || null,
        },
        include: {
          reviewer: { select: { id: true, name: true, email: true, role: true } },
        },
      });

      // 3. Create Notification for Research Creator
      await tx.notification.create({
        data: {
          userId: research.createdById,
          title: `Research Submission ${status}`,
          message: `Your research "${research.title}" has been set to ${status} by Research Cell.${
            comments ? ` Feedback: ${comments}` : ""
          }`,
          type: "APPROVAL_UPDATE",
        },
      });

      return {
        research: updatedResearch,
        approval: approvalRecord,
      };
    });
  }

  static async getHistory(researchId: string) {
    return prisma.approval.findMany({
      where: { researchId },
      orderBy: { createdAt: "desc" },
      include: {
        reviewer: { select: { id: true, name: true, email: true, role: true } },
      },
    });
  }

  static async getPendingQueue(page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const where = {
      status: {
        in: ["SUBMITTED", "UNDER_REVIEW", "NEEDS_REVISION"] as ResearchStatus[],
      },
    };

    const [items, total] = await Promise.all([
      prisma.research.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "asc" },
        include: {
          createdBy: { select: { name: true, email: true, role: true } },
          department: true,
          authors: true,
        },
      }),
      prisma.research.count({ where }),
    ]);

    return {
      items,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
