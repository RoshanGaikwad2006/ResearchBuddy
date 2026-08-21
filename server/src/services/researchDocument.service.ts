import { prisma } from "../config/db.js";

export interface RegisterDocumentDTO {
  localFileId: string;
  originalFilename: string;
  fileSize: number;
  fileHash: string;
  relativePath: string;
  mimeType?: string;
  researchId?: string;
}

export interface SyncOperationDTO {
  operationId: string;
  type: "LOCAL_ADD" | "LOCAL_UPDATE" | "LOCAL_DELETE";
  localFileId: string;
  originalFilename?: string;
  fileSize?: number;
  fileHash?: string;
  relativePath?: string;
  mimeType?: string;
  researchId?: string;
  timestamp?: string;
}

export class ResearchDocumentService {
  /**
   * Register local research PDF metadata for authenticated user.
   * Strictly enforces req.user.id as ownerUserId.
   * DOES NOT ACCEPT OR STORE PDF BINARY CONTENT.
   */
  static async registerDocument(ownerUserId: string, dto: RegisterDocumentDTO) {
    if (!ownerUserId) {
      throw new Error("Unauthorized: Owner User ID required.");
    }

    if (!dto.localFileId || !dto.fileHash || !dto.originalFilename) {
      throw new Error("Invalid document metadata payload.");
    }

    // Check if document metadata already registered for this user and hash
    const existing = await prisma.researchDocument.findFirst({
      where: {
        ownerUserId,
        OR: [{ localFileId: dto.localFileId }, { fileHash: dto.fileHash }],
      },
    });

    if (existing) {
      // Update existing metadata timestamp and linking
      return prisma.researchDocument.update({
        where: { id: existing.id },
        data: {
          originalFilename: dto.originalFilename,
          fileSize: dto.fileSize,
          relativePath: dto.relativePath,
          researchId: dto.researchId || existing.researchId,
          lastSyncedAt: new Date(),
          syncStatus: "SYNCED",
        },
      });
    }

    // Verify linked research exists if researchId provided
    if (dto.researchId) {
      const researchExists = await prisma.research.findUnique({
        where: { id: dto.researchId },
      });
      if (!researchExists) {
        dto.researchId = undefined;
      }
    }

    return prisma.researchDocument.create({
      data: {
        ownerUserId,
        localFileId: dto.localFileId,
        originalFilename: dto.originalFilename,
        fileSize: dto.fileSize,
        fileHash: dto.fileHash,
        relativePath: dto.relativePath,
        mimeType: dto.mimeType || "application/pdf",
        researchId: dto.researchId || null,
        syncStatus: "SYNCED",
      },
    });
  }

  /**
   * Retrieve all registered local document metadata for logged-in faculty.
   */
  static async getMyDocuments(ownerUserId: string) {
    if (!ownerUserId) {
      throw new Error("Unauthorized");
    }

    return prisma.researchDocument.findMany({
      where: { ownerUserId },
      include: {
        research: {
          select: {
            id: true,
            title: true,
            doi: true,
            publicationYear: true,
            journal: true,
            conference: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Idempotent batch metadata sync processing for offline queue items.
   */
  static async syncMetadataBatch(ownerUserId: string, operations: SyncOperationDTO[]) {
    if (!ownerUserId) {
      throw new Error("Unauthorized");
    }

    const processedResults: Array<{ operationId: string; status: "SUCCESS" | "SKIPPED" | "ERROR"; message?: string }> = [];

    for (const op of operations) {
      try {
        if (op.type === "LOCAL_ADD" || op.type === "LOCAL_UPDATE") {
          if (!op.localFileId || !op.fileHash || !op.originalFilename) {
            processedResults.push({ operationId: op.operationId, status: "SKIPPED", message: "Incomplete operation data" });
            continue;
          }

          await this.registerDocument(ownerUserId, {
            localFileId: op.localFileId,
            originalFilename: op.originalFilename,
            fileSize: op.fileSize || 0,
            fileHash: op.fileHash,
            relativePath: op.relativePath || `papers/${op.localFileId}/${op.originalFilename}`,
            mimeType: op.mimeType || "application/pdf",
            researchId: op.researchId,
          });

          processedResults.push({ operationId: op.operationId, status: "SUCCESS" });
        } else if (op.type === "LOCAL_DELETE") {
          const doc = await prisma.researchDocument.findFirst({
            where: { ownerUserId, localFileId: op.localFileId },
          });

          if (doc) {
            await prisma.researchDocument.delete({ where: { id: doc.id } });
          }

          processedResults.push({ operationId: op.operationId, status: "SUCCESS" });
        }
      } catch (err: any) {
        processedResults.push({ operationId: op.operationId, status: "ERROR", message: err.message });
      }
    }

    const currentDocuments = await this.getMyDocuments(ownerUserId);

    return {
      syncedAt: new Date().toISOString(),
      processedCount: processedResults.length,
      results: processedResults,
      documents: currentDocuments,
    };
  }

  /**
   * Delete metadata record (does not affect physical PDF on faculty computer).
   */
  static async deleteDocument(ownerUserId: string, documentId: string) {
    const doc = await prisma.researchDocument.findUnique({
      where: { id: documentId },
    });

    if (!doc) {
      throw new Error("Document metadata not found.");
    }

    if (doc.ownerUserId !== ownerUserId) {
      throw new Error("Forbidden: You do not own this document metadata.");
    }

    await prisma.researchDocument.delete({
      where: { id: documentId },
    });

    return { message: "Metadata record deleted successfully. Physical local file remains untouched." };
  }

  /**
   * Link or unlink document metadata to a research paper.
   */
  static async linkToResearch(ownerUserId: string, documentId: string, researchId: string | null) {
    const doc = await prisma.researchDocument.findUnique({
      where: { id: documentId },
    });

    if (!doc || doc.ownerUserId !== ownerUserId) {
      throw new Error("Forbidden or document not found.");
    }

    if (researchId) {
      const research = await prisma.research.findUnique({ where: { id: researchId } });
      if (!research) throw new Error("Target Research paper not found.");
    }

    return prisma.researchDocument.update({
      where: { id: documentId },
      data: { researchId },
      include: { research: true },
    });
  }
}
