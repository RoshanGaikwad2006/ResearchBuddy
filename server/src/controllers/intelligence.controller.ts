import type { Request, Response } from "express";
import { ResearchEmbeddingService } from "../services/researchEmbedding.service.js";
import { ResearchTopicService } from "../services/researchTopic.service.js";
import { ResearchGapFinderService } from "../services/researchGapFinder.service.js";
import { CollaborationFinderService } from "../services/collaborationFinder.service.js";
import { RAGResearchCopilotService } from "../services/ragResearchCopilot.service.js";
import { prisma } from "../config/db.js";

interface AuthRequest extends Request {
  user?: {
    id: string;
    role: string;
    email: string;
  };
}

export const getIntelligenceOverview = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    let facultyId: string | undefined;
    let departmentId: string | undefined;

    if (user.role === "FACULTY") {
      const fac = await prisma.faculty.findUnique({ where: { userId: user.id } });
      if (fac) {
        facultyId = fac.id;
        departmentId = fac.departmentId;
      }
    }

    const topics = await ResearchTopicService.getTopTopics(10);
    const gaps = await ResearchGapFinderService.getStoredGaps(departmentId);
    const collaborations = await CollaborationFinderService.getStoredCollaborations(facultyId);

    const totalIndexed = await prisma.researchEmbedding.count();
    const totalTopics = await prisma.researchTopic.count();

    res.status(200).json({
      metrics: {
        totalIndexed,
        totalTopics,
        openGapsCount: gaps.length,
        potentialCollaborationsCount: collaborations.length,
      },
      topics,
      gaps,
      collaborations,
    });
  } catch (error: any) {
    console.error("Intelligence Overview Error:", error);
    res.status(500).json({ message: error.message || "Failed to fetch research intelligence overview" });
  }
};

export const analyzeGaps = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const { domainQuery, departmentId } = req.body;

    let targetDeptId = departmentId;
    let targetFacultyId: string | undefined;

    if (user.role === "FACULTY") {
      const fac = await prisma.faculty.findUnique({ where: { userId: user.id } });
      if (fac) {
        targetDeptId = fac.departmentId;
        targetFacultyId = fac.id;
      }
    }

    const gaps = await ResearchGapFinderService.analyzeGaps({
      domainQuery,
      departmentId: targetDeptId,
      facultyId: targetFacultyId,
    });

    res.status(200).json({ gaps });
  } catch (error: any) {
    console.error("Analyze Gaps Error:", error);
    res.status(500).json({ message: error.message || "Failed to analyze research gaps" });
  }
};

export const analyzeCollaborations = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    let targetDeptId: string | undefined;
    let targetFacultyId: string | undefined;

    if (user.role === "FACULTY") {
      const fac = await prisma.faculty.findUnique({ where: { userId: user.id } });
      if (fac) {
        targetDeptId = fac.departmentId;
        targetFacultyId = fac.id;
      }
    } else {
      targetDeptId = req.query.departmentId as string | undefined;
    }

    const collaborations = await CollaborationFinderService.analyzeCollaborations(targetDeptId, targetFacultyId);

    res.status(200).json({ collaborations });
  } catch (error: any) {
    console.error("Analyze Collaborations Error:", error);
    res.status(500).json({ message: error.message || "Failed to analyze research collaborations" });
  }
};

export const queryCopilot = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const { query, departmentId } = req.body;
    if (!query) {
      res.status(400).json({ message: "Query string is required" });
      return;
    }

    let targetDeptId = departmentId;
    if (user.role === "FACULTY") {
      const fac = await prisma.faculty.findUnique({ where: { userId: user.id } });
      if (fac) targetDeptId = fac.departmentId;
    }

    const result = await RAGResearchCopilotService.queryCopilot(query, user.id, targetDeptId);

    res.status(200).json(result);
  } catch (error: any) {
    console.error("Copilot Query Error:", error);
    res.status(500).json({ message: error.message || "Failed to execute copilot query" });
  }
};

export const reindexEmbeddings = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const embeddingStatus = await ResearchEmbeddingService.indexAllResearches();
    const topicStatus = await ResearchTopicService.syncInstitutionalTopics();

    res.status(200).json({
      message: "Research Intelligence re-indexed successfully",
      embeddingStatus,
      topicStatus,
    });
  } catch (error: any) {
    console.error("Reindex Error:", error);
    res.status(500).json({ message: error.message || "Failed to reindex research intelligence" });
  }
};
