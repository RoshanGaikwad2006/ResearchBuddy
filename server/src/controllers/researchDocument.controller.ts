import type { Response } from "express";
import type { AuthenticatedRequest } from "../middleware/auth.middleware.js";
import { ResearchDocumentService } from "../services/researchDocument.service.js";

export const registerResearchDocument = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const document = await ResearchDocumentService.registerDocument(req.user.id, req.body);
    res.status(201).json({ message: "Document metadata registered successfully", document });
  } catch (error: any) {
    res.status(400).json({ message: error.message || "Failed to register document metadata" });
  }
};

export const getMyResearchDocuments = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const documents = await ResearchDocumentService.getMyDocuments(req.user.id);
    res.status(200).json({ documents, count: documents.length });
  } catch (error: any) {
    res.status(500).json({ message: error.message || "Failed to fetch research documents" });
  }
};

export const syncResearchDocumentsBatch = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const operations = Array.isArray(req.body.operations) ? req.body.operations : [];
    const result = await ResearchDocumentService.syncMetadataBatch(req.user.id, operations);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message || "Sync failed" });
  }
};

const getParamId = (param: string | string[] | undefined): string => {
  if (Array.isArray(param)) return param[0] || "";
  return param || "";
};

export const deleteResearchDocument = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const documentId = getParamId(req.params.id);
    if (!documentId) {
      res.status(400).json({ message: "Document ID required" });
      return;
    }

    const result = await ResearchDocumentService.deleteDocument(req.user.id, documentId);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(403).json({ message: error.message || "Failed to delete document metadata" });
  }
};

export const linkResearchDocument = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const documentId = getParamId(req.params.id);
    const { researchId } = req.body;

    const updated = await ResearchDocumentService.linkToResearch(req.user.id, documentId, researchId || null);
    res.status(200).json({ message: "Document link updated", document: updated });
  } catch (error: any) {
    res.status(400).json({ message: error.message || "Failed to link document" });
  }
};
