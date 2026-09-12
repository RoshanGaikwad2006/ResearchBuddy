import type { Response } from "express";
import type { AuthenticatedRequest } from "../middleware/auth.middleware.js";
import { ResearchService } from "../services/research.service.js";
import { createResearchSchema, updateResearchSchema } from "../validation/research.validation.js";
import type { ResearchStatus } from "@prisma/client";
import { prisma } from "../config/db.js";

const getParamId = (param: string | string[] | undefined): string => {
  if (Array.isArray(param)) return param[0] || "";
  return param || "";
};

export const getMyResearches = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const { search, status, publicationYear, page, limit } = req.query;
    const result = await ResearchService.listMyResearches(req.user.id, {
      search: search as string | undefined,
      status: status as ResearchStatus | undefined,
      publicationYear: publicationYear ? Number(publicationYear) : undefined,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 100,
    });

    res.status(200).json(result);
  } catch (error: any) {
    res.status(500).json({ message: error.message || "Failed to fetch personal research list" });
  }
};

export const createResearch = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const validatedData = createResearchSchema.parse(req.body);
    const research = await ResearchService.create(validatedData, req.user.id);

    res.status(201).json({ message: "Research submitted successfully", research });
  } catch (error: any) {
    res.status(400).json({ message: error.message || "Failed to create Research" });
  }
};

export const updateResearch = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = getParamId(req.params.id);
    const current = await prisma.research.findUnique({
      where: { id },
      include: {
        authors: {
          include: {
            faculty: true,
          },
        },
      },
    });

    if (!current) {
      res.status(404).json({ message: "Research publication not found" });
      return;
    }

    const isAuthor = current.authors.some((a) => a.faculty?.userId === req.user?.id);
    const isCreatorOrAdmin =
      current.createdById === req.user?.id ||
      req.user?.role === "ADMIN" ||
      req.user?.role === "RESEARCH_CELL";

    if (!isAuthor && !isCreatorOrAdmin) {
      res.status(403).json({ message: "You are not authorized to update this Research publication" });
      return;
    }

    const validatedData = updateResearchSchema.parse(req.body);
    const updated = await ResearchService.update(id, validatedData);

    res.status(200).json({ message: "Research publication updated successfully", research: updated });
  } catch (error: any) {
    res.status(400).json({ message: error.message || "Failed to update Research" });
  }
};

export const deleteResearch = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = getParamId(req.params.id);
    const current = await ResearchService.getById(id);

    if (req.user?.role !== "ADMIN" && current.createdById !== req.user?.id) {
      res.status(403).json({ message: "You are not authorized to delete this Research publication" });
      return;
    }

    await ResearchService.delete(id);
    res.status(200).json({ message: "Research publication deleted successfully" });
  } catch (error: any) {
    res.status(400).json({ message: error.message || "Failed to delete Research" });
  }
};

export const getResearchById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = getParamId(req.params.id);
    const research = await ResearchService.getById(id);
    res.status(200).json({ research });
  } catch (error: any) {
    res.status(404).json({ message: error.message || "Research publication not found" });
  }
};

export const listResearches = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { search, status, departmentId, publicationYear, createdById, page, limit } = req.query;

    let targetCreatedById = createdById as string | undefined;
    if (req.user?.role !== "ADMIN" && req.user?.role !== "RESEARCH_CELL" && !targetCreatedById) {
      targetCreatedById = req.user?.id;
    }

    const result = await ResearchService.list({
      search: search as string | undefined,
      status: status as ResearchStatus | undefined,
      departmentId: departmentId as string | undefined,
      publicationYear: publicationYear ? Number(publicationYear) : undefined,
      createdById: targetCreatedById,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 10,
    });

    res.status(200).json(result);
  } catch (error: any) {
    res.status(500).json({ message: error.message || "Failed to list Researches" });
  }
};

export const updateAuthorAffiliation = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "Unauthorized" } });
      return;
    }

    const authorId = getParamId(req.params.authorId);
    const { affiliation } = req.body;

    if (!affiliation || affiliation.trim() === "") {
      res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: "Affiliation text is required" } });
      return;
    }

    // Resolve Author & Parent Research ownership to prevent IDOR vulnerabilities
    const authorRecord = await prisma.researchAuthor.findUnique({
      where: { id: authorId },
      include: { research: true },
    });

    if (!authorRecord) {
      res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Research author record not found" } });
      return;
    }

    const isOwner = authorRecord.research.createdById === req.user.id;
    const isAdminOrResearchCell = req.user.role === "ADMIN" || req.user.role === "RESEARCH_CELL";

    if (!isOwner && !isAdminOrResearchCell) {
      res.status(403).json({
        success: false,
        error: {
          code: "FORBIDDEN",
          message: "Forbidden: You are not authorized to update author affiliations for this publication",
        },
      });
      return;
    }

    const updatedAuthor = await prisma.researchAuthor.update({
      where: { id: authorId },
      data: {
        affiliation: affiliation.trim(),
        affiliationSource: "MANUAL_ENTRY",
        affiliationStatus: "MANUALLY_ENTERED",
        enteredBy: req.user.id,
        enteredAt: new Date(),
      },
    });

    res.status(200).json({
      success: true,
      message: "Author affiliation updated successfully",
      data: { author: updatedAuthor },
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: { code: "VALIDATION_ERROR", message: error.message || "Failed to update author affiliation" },
    });
  }
};

export const enrichResearchAbstractController = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = getParamId(req.params.id);
    if (!id) {
      res.status(400).json({ message: "Research ID required" });
      return;
    }

    const updated = await ResearchService.enrichAbstract(id);
    res.status(200).json({ message: "Research paper abstract enriched successfully", research: updated });
  } catch (error: any) {
    res.status(400).json({ message: error.message || "Failed to enrich abstract" });
  }
};

export const refreshResearchCitationsController = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = getParamId(req.params.id);
    if (!id) {
      res.status(400).json({ message: "Research ID required" });
      return;
    }

    const updated = await ResearchService.refreshCitationsViaOpenRouter(id);
    res.status(200).json({
      message: "Publication citations successfully refreshed via OpenRouter AI engine",
      research: updated,
    });
  } catch (error: any) {
    res.status(400).json({ message: error.message || "Failed to refresh citations via OpenRouter" });
  }
};

