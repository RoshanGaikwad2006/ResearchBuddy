import type { Request, Response } from "express";
import { ResearchKnowledgeGraphService } from "../services/researchKnowledgeGraph.service.js";
import { prisma } from "../config/db.js";

interface AuthRequest extends Request {
  user?: {
    id: string;
    role: string;
    email: string;
  };
}

export const getInstitutionalGraph = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const { departmentId, facultyId, topicName, yearStart, yearEnd, depth, nodeTypes, limitNodes } = req.query as any;

    let targetDeptId = departmentId;
    let targetFacultyId = facultyId;

    // Faculty Scoping: Faculty can only query permitted research subgraphs
    if (user.role === "FACULTY") {
      const fac = await prisma.faculty.findUnique({ where: { userId: user.id } });
      if (fac) {
        targetFacultyId = fac.id;
        targetDeptId = fac.departmentId;
      }
    }

    const graph = await ResearchKnowledgeGraphService.buildInstitutionalGraph({
      departmentId: targetDeptId,
      facultyId: targetFacultyId,
      topicName,
      yearStart: yearStart ? Number(yearStart) : undefined,
      yearEnd: yearEnd ? Number(yearEnd) : undefined,
      depth: depth ? Number(depth) : 2,
      nodeTypes: nodeTypes ? (Array.isArray(nodeTypes) ? nodeTypes : [nodeTypes]) : undefined,
      limitNodes: limitNodes ? Number(limitNodes) : 100,
    });

    res.status(200).json(graph);
  } catch (error: any) {
    console.error("Knowledge Graph Error:", error);
    res.status(500).json({ message: error.message || "Failed to build research knowledge graph" });
  }
};

export const getFacultySubgraph = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    let targetFacultyId = req.params.id as string;
    if (user.role === "FACULTY") {
      const fac = await prisma.faculty.findUnique({ where: { userId: user.id } });
      if (fac) targetFacultyId = fac.id;
    }

    const graph = await ResearchKnowledgeGraphService.buildFacultySubgraph(targetFacultyId);
    res.status(200).json(graph);
  } catch (error: any) {
    console.error("Faculty Subgraph Error:", error);
    res.status(500).json({ message: error.message || "Failed to fetch faculty subgraph" });
  }
};

export const getDepartmentSubgraph = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const departmentId = req.params.id as string;
    const graph = await ResearchKnowledgeGraphService.buildDepartmentSubgraph(departmentId);
    res.status(200).json(graph);
  } catch (error: any) {
    console.error("Department Subgraph Error:", error);
    res.status(500).json({ message: error.message || "Failed to fetch department subgraph" });
  }
};

export const getTopicSubgraph = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const topicName = req.params.name as string;
    const graph = await ResearchKnowledgeGraphService.buildTopicSubgraph(topicName);
    res.status(200).json(graph);
  } catch (error: any) {
    console.error("Topic Subgraph Error:", error);
    res.status(500).json({ message: error.message || "Failed to fetch topic subgraph" });
  }
};

export const getGraphAnalytics = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const analytics = await ResearchKnowledgeGraphService.getGraphAnalytics();
    res.status(200).json(analytics);
  } catch (error: any) {
    console.error("Graph Analytics Error:", error);
    res.status(500).json({ message: error.message || "Failed to fetch graph analytics" });
  }
};
