import { prisma } from "../config/db.js";
import { OpenRouterService } from "../integrations/ai/openrouter.service.js";
import { ResearchEmbeddingService } from "./researchEmbedding.service.js";

export interface RAGCopilotResponse {
  query: string;
  answer: string;
  evidence: Array<{
    researchId?: string;
    title: string;
    doi?: string;
    authors?: string;
    year?: number;
    source: string;
  }>;
  latencyMs: number;
  modelUsed: string;
  resultStatus: "SUCCESS" | "REFUSAL" | "FALLBACK";
}

export class RAGResearchCopilotService {
  /**
   * Main RAG Copilot execution: Retrieves verified evidence from PostgreSQL vector store,
   * constructs RAG context, invokes OpenRouter LLM, and formats citations.
   */
  static async queryCopilot(query: string, userId: string, departmentId?: string): Promise<RAGCopilotResponse> {
    const startTime = Date.now();
    const modelUsed = process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini";

    // 1. Mandatory Vector Retrieval from PostgreSQL Verified Database (Top 12 Matches)
    const topMatches = await ResearchEmbeddingService.searchTopK(query, 12, departmentId);

    // If zero relevant evidence found, return Controlled Refusal
    if (!topMatches || topMatches.length === 0) {
      const refusalResp: RAGCopilotResponse = {
        query,
        answer: "Insufficient evidence in the KRIYA institutional database to answer this research query accurately. Please refine your query or ensure research records are indexed.",
        evidence: [],
        latencyMs: Date.now() - startTime,
        modelUsed,
        resultStatus: "REFUSAL",
      };

      try {
        await prisma.aIQueryLog.create({
          data: {
            userId,
            query,
            response: refusalResp.answer,
            evidence: "[]",
            latencyMs: refusalResp.latencyMs,
            modelUsed,
            resultStatus: "REFUSAL",
          },
        });
      } catch {}

      return refusalResp;
    }

    // 2. Format Evidence Context & Source References
    const evidenceList = topMatches.map((m, idx) => {
      const authors = m.research.authors?.map((a: any) => a.authorName).join(", ") || "Institutional Authors";
      return {
        refNumber: idx + 1,
        researchId: m.research.id,
        title: m.research.title,
        doi: m.research.doi || undefined,
        authors,
        year: m.research.publicationYear,
        source: "KRIYA_Verified_DB",
        abstract: m.research.abstract,
        citationCount: m.research.citationCount,
      };
    });

    const contextText = evidenceList
      .map(
        (e) =>
          `[${e.refNumber}] Title: "${e.title}" (Year: ${e.year}, Citations: ${e.citationCount})\nAuthors: ${e.authors}\nAbstract: ${e.abstract}\nDOI: ${e.doi || "N/A"}`
      )
      .join("\n\n");

    // 3. Construct Evidence-Grounded Prompt
    const prompt = `
Act as the official KRIYA AI Research Intelligence Copilot.

USER QUERY: "${query}"

RETRIEVED INSTITUTIONAL EVIDENCE:
${contextText}

STRICT INSTRUCTIONS:
1. Answer the query GROUNDED STRICTLY in the provided RETRIEVED INSTITUTIONAL EVIDENCE.
2. Every factual claim MUST cite its evidence source using bracketed numbers like [1], [2].
3. Do NOT fabricate publications, author expertise, or citation statistics.
4. If the retrieved evidence does not fully cover the query, explicitly state the limitation.

Answer clearly and professionally in Github-flavored markdown format:
`;

    const rawAnswer = await OpenRouterService.invokeSafe(prompt, { temperature: 0.2, maxTokens: 1200 });

    let finalAnswer = rawAnswer;

    // Handle OpenRouter key missing fallback
    if (rawAnswer.includes("FALLBACK") || rawAnswer.includes("ERROR")) {
      finalAnswer = `### Institutional Research Summary\nBased on ${evidenceList.length} verified database records:\n\n` +
        evidenceList.map((e) => `- **[${e.refNumber}] ${e.title}** (${e.year}) by ${e.authors} — Citations: ${e.citationCount}`).join("\n");
    }

    const responseObj: RAGCopilotResponse = {
      query,
      answer: finalAnswer,
      evidence: evidenceList.map((e) => ({
        researchId: e.researchId,
        title: e.title,
        doi: e.doi,
        authors: e.authors,
        year: e.year,
        source: e.source,
      })),
      latencyMs: Date.now() - startTime,
      modelUsed,
      resultStatus: "SUCCESS",
    };

    // Log Query Telemetry to PostgreSQL
    try {
      await prisma.aIQueryLog.create({
        data: {
          userId,
          query,
          response: finalAnswer,
          evidence: JSON.stringify(responseObj.evidence),
          latencyMs: responseObj.latencyMs,
          modelUsed,
          resultStatus: responseObj.resultStatus,
        },
      });
    } catch {}

    return responseObj;
  }
}
