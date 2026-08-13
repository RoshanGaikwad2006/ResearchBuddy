import type { Request, Response } from "express";
import { AuditorService } from "../services/auditor.service.js";
import { prisma } from "../config/db.js";

interface AuthRequest extends Request {
  user?: {
    id: string;
    role: string;
    email: string;
  };
}

export const runAudit = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const { scopeType = "INSTITUTIONAL", targetId = null } = req.body;
    const result = await AuditorService.runAudit(scopeType, targetId, user);

    res.status(200).json(result);
  } catch (error: any) {
    console.error("Audit Execution Error:", error);
    res.status(400).json({ message: error.message || "Failed to execute audit run" });
  }
};

export const getAuditHealth = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const { scopeType = "INSTITUTIONAL", targetId } = req.query as any;

    let targetScope: "INSTITUTIONAL" | "DEPARTMENT" | "FACULTY" = scopeType;
    let targetIdVal: string | undefined = targetId;

    if (user.role === "FACULTY") {
      const fac = await prisma.faculty.findUnique({ where: { userId: user.id } });
      if (fac) {
        targetScope = "FACULTY";
        targetIdVal = fac.id;
      }
    }

    const health = await AuditorService.calculateHealthScore(targetScope, targetIdVal);

    // Department Health Comparison list for Admin / Research Cell
    let departmentHealthList: any[] = [];
    if (user.role === "ADMIN" || user.role === "RESEARCH_CELL") {
      const departments = await prisma.department.findMany();
      departmentHealthList = await Promise.all(
        departments.map(async (d) => {
          const dh = await AuditorService.calculateHealthScore("DEPARTMENT", d.id);
          const issueCount = await prisma.auditIssue.count({
            where: { departmentId: d.id, status: "OPEN" },
          });
          return {
            id: d.id,
            code: d.code,
            name: d.name,
            healthScore: dh.overallHealth,
            openIssues: issueCount,
          };
        })
      );
    }

    res.status(200).json({
      health,
      departmentHealth: departmentHealthList,
    });
  } catch (error: any) {
    console.error("Audit Health Error:", error);
    res.status(500).json({ message: error.message || "Failed to fetch audit health metrics" });
  }
};

export const getAuditRuns = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const runs = await prisma.auditRun.findMany({
      orderBy: { startedAt: "desc" },
      take: 20,
      include: {
        triggeredBy: { select: { id: true, name: true, email: true } },
      },
    });

    res.status(200).json({ runs });
  } catch (error: any) {
    console.error("Audit Runs Error:", error);
    res.status(500).json({ message: error.message || "Failed to fetch audit runs" });
  }
};

export const getAuditIssues = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const { severity, issueType, status, facultyId, departmentId } = req.query as any;

    const where: any = {};
    if (severity && severity !== "ALL") where.severity = severity;
    if (issueType && issueType !== "ALL") where.issueType = issueType;
    if (status && status !== "ALL") where.status = status;
    if (departmentId && departmentId !== "ALL") where.departmentId = departmentId;

    // Faculty Scoping
    if (user.role === "FACULTY") {
      const fac = await prisma.faculty.findUnique({ where: { userId: user.id } });
      if (fac) {
        where.facultyId = fac.id;
      }
    } else if (facultyId && facultyId !== "ALL") {
      where.facultyId = facultyId;
    }

    const issues = await prisma.auditIssue.findMany({
      where,
      orderBy: { detectedAt: "desc" },
      take: 100,
      include: {
        research: { select: { id: true, title: true, doi: true, publicationYear: true } },
        faculty: { select: { id: true, employeeId: true, user: { select: { name: true } } } },
        department: { select: { id: true, code: true, name: true } },
      },
    });

    res.status(200).json({ issues });
  } catch (error: any) {
    console.error("Audit Issues Error:", error);
    res.status(500).json({ message: error.message || "Failed to fetch audit issues" });
  }
};

export const getAuditIssueById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const issueId = req.params.id as string;
    const issue = await prisma.auditIssue.findUnique({
      where: { id: issueId },
      include: {
        research: { include: { authors: true } },
        faculty: { include: { user: true } },
        department: true,
        resolvedBy: { select: { id: true, name: true, email: true } },
        history: {
          orderBy: { actionAt: "desc" },
          include: { actionBy: { select: { name: true, email: true } } },
        },
      },
    });

    if (!issue) {
      res.status(404).json({ message: "Audit issue not found" });
      return;
    }

    res.status(200).json({ issue });
  } catch (error: any) {
    console.error("Audit Issue Detail Error:", error);
    res.status(500).json({ message: error.message || "Failed to fetch audit issue detail" });
  }
};

export const resolveAuditIssue = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const issueId = req.params.id as string;
    const { action, reason } = req.body;

    const result = await AuditorService.resolveIssue(issueId, action, reason, user);
    res.status(200).json(result);
  } catch (error: any) {
    console.error("Resolve Audit Issue Error:", error);
    res.status(400).json({ message: error.message || "Failed to resolve audit issue" });
  }
};

export const runAutoFix = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const result = await AuditorService.runAutoFix(user);
    res.status(200).json(result);
  } catch (error: any) {
    console.error("Run Auto-Fix Error:", error);
    res.status(400).json({ message: error.message || "Failed to execute auto-fix" });
  }
};
