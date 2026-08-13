import type { Response } from "express";
import type { AuthenticatedRequest } from "../../middleware/auth.middleware.js";
import { GoogleScholarService } from "./googleScholar.service.js";
import { prisma } from "../../config/db.js";

const getParamId = (param: string | string[] | undefined): string => {
  if (Array.isArray(param)) return param[0] || "";
  return param || "";
};

const COOLDOWN_SECONDS = 0; // Removed 5-minute cooldown limit as requested

const checkCooldown = (_lastSyncTime: Date | null): { inCooldown: boolean; retryAfterSeconds: number } => {
  return { inCooldown: false, retryAfterSeconds: 0 };
};

import { ScholarSyncAgent } from "./scholarSyncAgent.service.js";

export const getScholarPreview = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const input = (req.query.scholarUrl as string) || (req.query.authorId as string) || req.query.url;

    if (!input || typeof input !== "string") {
      res.status(400).json({ message: "Google Scholar Profile URL or Author ID parameter is required" });
      return;
    }

    const preview = await GoogleScholarService.fetchProfilePreview(input);
    res.status(200).json({ message: "Google Scholar profile preview fetched successfully", preview });
  } catch (error: any) {
    res.status(400).json({ message: error.message || "Failed to fetch Google Scholar profile preview" });
  }
};

export const syncMyScholar = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const faculty = await prisma.faculty.findUnique({ where: { userId: req.user.id } });
    if (!faculty) {
      res.status(404).json({ message: "Faculty profile not found for authenticated user" });
      return;
    }

    const { scholarUrl, force } = req.body || {};
    if (scholarUrl) {
      await prisma.faculty.update({
        where: { id: faculty.id },
        data: { scholarUrl },
      });
    }

    const result = await ScholarSyncAgent.syncSingleFaculty(faculty.id, {
      force: force === true || req.user.role === "ADMIN",
      triggerType: "MANUAL_FACULTY",
      triggeredById: req.user.id,
    });

    if (result.status === "RATE_LIMITED") {
      res.status(429).json({ message: result.error, result });
      return;
    }

    res.status(200).json({ message: "Scholar sync completed", result });
  } catch (error: any) {
    res.status(500).json({ message: error.message || "Google Scholar synchronization failed" });
  }
};

export const syncFacultyScholar = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const facultyId = getParamId(req.params.facultyId);
    const { scholarUrl, force } = req.body || {};

    if (!facultyId) {
      res.status(400).json({ message: "Faculty ID is required" });
      return;
    }

    const targetFaculty = await prisma.faculty.findUnique({ where: { id: facultyId } });
    if (!targetFaculty) {
      res.status(404).json({ message: "Faculty record not found" });
      return;
    }

    // Role Security: Faculty members can ONLY sync their own profile. Admin/Research Cell can sync any profile.
    if (req.user?.role !== "ADMIN" && req.user?.role !== "RESEARCH_CELL" && targetFaculty.userId !== req.user?.id) {
      res.status(403).json({ message: "Forbidden: Cannot sync Google Scholar profile of another faculty member" });
      return;
    }

    if (scholarUrl) {
      await prisma.faculty.update({
        where: { id: facultyId },
        data: { scholarUrl },
      });
    }

    const result = await ScholarSyncAgent.syncSingleFaculty(facultyId, {
      force: force === true || req.user?.role === "ADMIN" || req.user?.role === "RESEARCH_CELL",
      triggerType: req.user?.role === "ADMIN" || req.user?.role === "RESEARCH_CELL" ? "ADMIN_FACULTY" : "MANUAL_FACULTY",
      triggeredById: req.user?.id,
    });

    if (result.status === "RATE_LIMITED") {
      res.status(429).json({ message: result.error, result });
      return;
    }

    res.status(200).json({ message: "Faculty Scholar sync completed", result });
  } catch (error: any) {
    res.status(500).json({ message: error.message || "Google Scholar synchronization failed" });
  }
};

export const syncInstitutionScholar = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (req.user?.role !== "ADMIN" && req.user?.role !== "RESEARCH_CELL") {
      res.status(403).json({ message: "Forbidden: Only Admin or Research Cell can trigger institutional sync" });
      return;
    }

    const { force, concurrency } = req.body || {};
    const run = await ScholarSyncAgent.runInstitutionalSync({
      force: force === true,
      triggerType: "INSTITUTIONAL_MANUAL",
      triggeredById: req.user.id,
      concurrency: concurrency ? Number(concurrency) : undefined,
    });

    res.status(200).json({ message: "Institutional Scholar Sync completed", run });
  } catch (error: any) {
    res.status(500).json({ message: error.message || "Institutional Scholar synchronization failed" });
  }
};

export const getScholarSyncRuns = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (req.user?.role !== "ADMIN" && req.user?.role !== "RESEARCH_CELL") {
      res.status(403).json({ message: "Forbidden: Access restricted to Admin and Research Cell" });
      return;
    }

    const runs = await prisma.scholarSyncRun.findMany({
      orderBy: { startedAt: "desc" },
      take: 20,
      include: {
        triggeredBy: { select: { id: true, name: true, email: true } },
        items: {
          include: { faculty: { include: { user: true } } },
        },
      },
    });

    res.status(200).json({ runs });
  } catch (error: any) {
    res.status(500).json({ message: error.message || "Failed to fetch Scholar sync runs history" });
  }
};

export const getScholarSyncRunById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const runId = getParamId(req.params.id);
    if (req.user?.role !== "ADMIN" && req.user?.role !== "RESEARCH_CELL") {
      res.status(403).json({ message: "Forbidden: Access restricted to Admin and Research Cell" });
      return;
    }

    const run = await prisma.scholarSyncRun.findUnique({
      where: { id: runId },
      include: {
        triggeredBy: { select: { id: true, name: true, email: true } },
        items: {
          include: { faculty: { include: { user: true, department: true } } },
        },
      },
    });

    if (!run) {
      res.status(404).json({ message: "Scholar Sync Run not found" });
      return;
    }

    res.status(200).json({ run });
  } catch (error: any) {
    res.status(500).json({ message: error.message || "Failed to fetch Scholar sync run details" });
  }
};
