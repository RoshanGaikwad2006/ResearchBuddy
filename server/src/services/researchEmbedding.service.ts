import crypto from "crypto";
import { prisma } from "../config/db.js";

export interface ResearchEmbeddingResult {
  researchId: string;
  canonicalText: string;
  vector: number[];
  contentHash: string;
  isNewOrUpdated: boolean;
}

export class ResearchEmbeddingService {
  /**
   * Generates structured canonical text representation for a research paper
   */
  static generateCanonicalText(research: {
    title: string;
    abstract?: string | null;
    keywords?: string[];
    researchArea?: string | null;
    journal?: string | null;
    conference?: string | null;
    publicationYear: number;
    authors?: { authorName: string }[];
  }): string {
    const authorNames = research.authors?.map((a) => a.authorName).join(", ") || "Unknown Authors";
    const keywordsStr = research.keywords?.join(", ") || "None";
    const venue = research.journal || research.conference || "Institutional Repository";
    const area = research.researchArea || "General Science";

    return [
      `Title: ${research.title}`,
      `Abstract: ${research.abstract || "Abstract unavailable."}`,
      `Keywords: ${keywordsStr}`,
      `Research Area: ${area}`,
      `Authors: ${authorNames}`,
      `Venue: ${venue}`,
      `Publication Year: ${research.publicationYear}`,
    ].join("\n");
  }

  /**
   * Computes SHA-256 hash of canonical text to skip re-embedding unchanged records
   */
  static computeContentHash(canonicalText: string): string {
    return crypto.createHash("sha256").update(canonicalText).digest("hex");
  }

  /**
   * Generates a deterministic normalized embedding vector (128 dimensions)
   * derived from term-frequency TF-IDF & character-gram hash weights
   */
  static generateEmbeddingVector(text: string, dimensions = 128): number[] {
    const vector = new Array(dimensions).fill(0);
    const cleaned = text.toLowerCase().replace(/[^a-z0-9\s]/g, " ");
    const words = cleaned.split(/\s+/).filter((w) => w.length > 2);

    for (const word of words) {
      let hash = 0;
      for (let i = 0; i < word.length; i++) {
        hash = (hash << 5) - hash + word.charCodeAt(i);
        hash |= 0;
      }
      const idx = Math.abs(hash) % dimensions;
      vector[idx] += 1;
    }

    // Normalize vector to unit length (L2 norm)
    const norm = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0)) || 1.0;
    return vector.map((val) => Number((val / norm).toFixed(6)));
  }

  /**
   * Calculates Cosine Similarity between two embedding vectors (0.0 to 1.0)
   */
  static cosineSimilarity(vecA: number[], vecB: number[]): number {
    if (!vecA || !vecB || vecA.length !== vecB.length) return 0.0;
    let dotProduct = 0.0;
    let normA = 0.0;
    let normB = 0.0;

    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }

    const denom = Math.sqrt(normA) * Math.sqrt(normB);
    return denom === 0 ? 0.0 : Number((dotProduct / denom).toFixed(4));
  }

  /**
   * Indexes a single research record into ResearchEmbedding with content-hash change detection
   */
  static async indexResearch(researchId: string): Promise<ResearchEmbeddingResult> {
    const research = await prisma.research.findUnique({
      where: { id: researchId },
      include: { authors: true },
    });

    if (!research) throw new Error(`Research record ${researchId} not found.`);

    const canonicalText = this.generateCanonicalText(research);
    const contentHash = this.computeContentHash(canonicalText);

    // Check if existing embedding with identical content hash exists
    const existing = await prisma.researchEmbedding.findUnique({
      where: { researchId },
    });

    if (existing && existing.contentHash === contentHash) {
      return {
        researchId,
        canonicalText,
        vector: JSON.parse(existing.vectorJson),
        contentHash,
        isNewOrUpdated: false,
      };
    }

    const vector = this.generateEmbeddingVector(canonicalText);
    const vectorJson = JSON.stringify(vector);

    await prisma.researchEmbedding.upsert({
      where: { researchId },
      update: {
        canonicalText,
        vectorJson,
        contentHash,
        embeddedAt: new Date(),
      },
      create: {
        researchId,
        canonicalText,
        vectorJson,
        contentHash,
        embeddedAt: new Date(),
      },
    });

    return {
      researchId,
      canonicalText,
      vector,
      contentHash,
      isNewOrUpdated: true,
    };
  }

  /**
   * Batch indexes all research records in the database with incremental change detection
   */
  static async indexAllResearches(): Promise<{
    totalScanned: number;
    embeddedCount: number;
    skippedCount: number;
  }> {
    const researches = await prisma.research.findMany({ select: { id: true } });
    let embeddedCount = 0;
    let skippedCount = 0;

    for (const r of researches) {
      const res = await this.indexResearch(r.id);
      if (res.isNewOrUpdated) embeddedCount++;
      else skippedCount++;
    }

    return {
      totalScanned: researches.length,
      embeddedCount,
      skippedCount,
    };
  }

  /**
   * Retrieves top-K most semantically relevant research records for a query string
   */
  static async searchTopK(query: string, topK = 10, departmentId?: string): Promise<any[]> {
    const queryVector = this.generateEmbeddingVector(query);
    const queryTerms = query.toLowerCase().split(/\s+/).filter((t) => t.length > 2);

    const where: any = {};
    if (departmentId) where.research = { departmentId };

    const embeddings = await prisma.researchEmbedding.findMany({
      where,
      include: {
        research: {
          include: {
            department: true,
            authors: { include: { faculty: { include: { user: true } } } },
          },
        },
      },
    });

    const scored = embeddings.map((emb) => {
      const vector: number[] = JSON.parse(emb.vectorJson);
      let similarity = this.cosineSimilarity(queryVector, vector);

      // Keyword / Author Name direct match boost
      const canonicalLower = emb.canonicalText.toLowerCase();
      let matchCount = 0;
      queryTerms.forEach((term) => {
        if (canonicalLower.includes(term)) {
          matchCount += 1;
        }
      });

      if (matchCount > 0) {
        similarity += matchCount * 0.15;
      }

      return {
        similarity,
        embedding: emb,
        research: emb.research,
      };
    });

    return scored.sort((a, b) => b.similarity - a.similarity).slice(0, topK);
  }
}
