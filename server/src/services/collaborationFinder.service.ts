import { prisma } from "../config/db.js";
import { OpenRouterService } from "../integrations/ai/openrouter.service.js";

export interface CollaborationResult {
  id?: string;
  facultyA: { id: string; name: string; designation: string; departmentName: string };
  facultyB: { id: string; name: string; designation: string; departmentName: string };
  compatibilityScore: number;
  sharedTopics: string[];
  complementaryExpertise: string[];
  potentialDirection: string;
  evidence: { publicationCountA: number; publicationCountB: number; existingCoAuthorships: number };
  reasoning: string;
}

export class CollaborationFinderService {
  /**
   * Calculates a deterministic explainable Collaboration Compatibility Score (0 to 100)
   */
  static calculateCollaborationScore(params: {
    sharedTopicsCount: number;
    differentDepartments: boolean;
    existingCoAuthorships: number;
    citationsA: number;
    citationsB: number;
  }): number {
    const { sharedTopicsCount, differentDepartments, existingCoAuthorships, citationsA, citationsB } = params;

    // 1. Topic Compatibility (0-40 pts): Shared research topics
    const topicPts = Math.min(40, sharedTopicsCount * 15);

    // 2. Department Diversity (0-25 pts): Cross-department collaborations yield higher interdisciplinary value
    const deptPts = differentDepartments ? 25 : 10;

    // 3. Citation & Research Velocity (0-20 pts): Active researchers with non-zero citation velocity
    const velocityPts = Math.min(20, Math.round((citationsA + citationsB) / 10));

    // 4. Complementary Penalty/Boost (0-15 pts): New pairings are preferred over saturated existing co-authors
    const noveltyPts = existingCoAuthorships === 0 ? 15 : Math.max(0, 15 - existingCoAuthorships * 5);

    return Math.min(100, Math.max(20, topicPts + deptPts + velocityPts + noveltyPts));
  }

  /**
   * Main Collaboration Finder execution: Scans faculty pairs, computes compatibility,
   * synthesizes research directions via OpenRouter LLM, and persists recommendations.
   */
  static async analyzeCollaborations(departmentId?: string, targetFacultyId?: string): Promise<CollaborationResult[]> {
    const faculties = await prisma.faculty.findMany({
      where: departmentId ? { departmentId } : {},
      include: {
        user: true,
        department: true,
        researchAuthorships: {
          include: { research: true },
        },
      },
      take: 20,
    });

    if (faculties.length < 2) {
      return [];
    }

    const recommendations: CollaborationResult[] = [];

    // Filter focus faculty if specified
    const primaryFaculties = targetFacultyId
      ? faculties.filter((f) => f.id === targetFacultyId)
      : faculties.slice(0, 10);

    for (const facA of primaryFaculties) {
      const candidates = faculties.filter((f) => f.id !== facA.id);

      for (const facB of candidates) {
        // Extract interests & topics
        const topicsA = [...facA.researchInterests, ...facA.researchAuthorships.map((ra) => ra.research.researchArea)];
        const topicsB = [...facB.researchInterests, ...facB.researchAuthorships.map((ra) => ra.research.researchArea)];

        const normA = new Set(topicsA.map((t) => t.toLowerCase().trim()));
        const normB = new Set(topicsB.map((t) => t.toLowerCase().trim()));

        const shared = Array.from(normA).filter((t) => normB.has(t));
        const uniqueA = Array.from(normA).filter((t) => !normB.has(t));
        const uniqueB = Array.from(normB).filter((t) => !normB.has(t));

        // Count existing co-authorships
        const papersA = new Set(facA.researchAuthorships.map((ra) => ra.researchId));
        const existingCoAuthorships = facB.researchAuthorships.filter((ra) => papersA.has(ra.researchId)).length;

        // Skip pair if already published 3+ papers together (not a new collaboration opportunity)
        if (existingCoAuthorships >= 3) continue;

        const score = this.calculateCollaborationScore({
          sharedTopicsCount: shared.length || 1,
          differentDepartments: facA.departmentId !== facB.departmentId,
          existingCoAuthorships,
          citationsA: facA.totalCitations,
          citationsB: facB.totalCitations,
        });

        const sharedTopicsList = shared.length > 0 ? shared.map((s) => s.toUpperCase()) : ["INTERDISCIPLINARY SYSTEMS"];
        const compExpertiseList = [
          `${facA.user.name}: ${uniqueA.slice(0, 2).join(", ") || facA.designation}`,
          `${facB.user.name}: ${uniqueB.slice(0, 2).join(", ") || facB.designation}`,
        ];

        // Synthesize Joint Direction via OpenRouter
        const prompt = `
Synthesize a high-value potential research collaboration direction between two university faculty members:

FACULTY A: ${facA.user.name} (${facA.designation}, Department: ${facA.department.name})
Expertise: ${topicsA.slice(0, 4).join(", ") || "Engineering"}

FACULTY B: ${facB.user.name} (${facB.designation}, Department: ${facB.department.name})
Expertise: ${topicsB.slice(0, 4).join(", ") || "Computing"}

SHARED TOPICS: ${sharedTopicsList.join(", ")}
COMPATIBILITY SCORE: ${score}/100

Return ONLY JSON:
{
  "potentialDirection": "Concise 6-10 word title of joint research project",
  "reasoning": "2 sentence explanation of why combining Faculty A's domain with Faculty B's expertise creates high-impact research."
}
`;

        let direction = `Joint Interdisciplinary Research in ${sharedTopicsList[0] || "Advanced Systems"}`;
        let reasoning = `Combines ${facA.user.name}'s expertise in ${topicsA[0] || "systems"} with ${facB.user.name}'s domain background in ${topicsB[0] || "applied science"}.`;

        try {
          const raw = await OpenRouterService.invokeSafe(prompt, { temperature: 0.3, maxTokens: 300 });
          const clean = raw.replace(/```json|```/g, "").trim();
          const parsed = JSON.parse(clean);
          if (parsed.potentialDirection) direction = parsed.potentialDirection;
          if (parsed.reasoning) reasoning = parsed.reasoning;
        } catch {}

        const rec: CollaborationResult = {
          facultyA: {
            id: facA.id,
            name: facA.user.name,
            designation: facA.designation,
            departmentName: facA.department.name,
          },
          facultyB: {
            id: facB.id,
            name: facB.user.name,
            designation: facB.designation,
            departmentName: facB.department.name,
          },
          compatibilityScore: score,
          sharedTopics: sharedTopicsList,
          complementaryExpertise: compExpertiseList,
          potentialDirection: direction,
          evidence: {
            publicationCountA: facA.publicationCount,
            publicationCountB: facB.publicationCount,
            existingCoAuthorships,
          },
          reasoning,
        };

        recommendations.push(rec);

        // Store in PostgreSQL database
        try {
          await prisma.collaborationRecommendation.upsert({
            where: {
              facultyAId_facultyBId: { facultyAId: facA.id, facultyBId: facB.id },
            },
            update: {
              compatibilityScore: score,
              sharedTopics: JSON.stringify(sharedTopicsList),
              complementaryExpertise: JSON.stringify(compExpertiseList),
              potentialDirection: direction,
              evidence: JSON.stringify(rec.evidence),
              reasoning,
              generatedAt: new Date(),
            },
            create: {
              facultyAId: facA.id,
              facultyBId: facB.id,
              compatibilityScore: score,
              sharedTopics: JSON.stringify(sharedTopicsList),
              complementaryExpertise: JSON.stringify(compExpertiseList),
              potentialDirection: direction,
              evidence: JSON.stringify(rec.evidence),
              reasoning,
            },
          });
        } catch {}

        if (recommendations.length >= 8) break;
      }
      if (recommendations.length >= 8) break;
    }

    return recommendations.sort((a, b) => b.compatibilityScore - a.compatibilityScore);
  }

  /**
   * Retrieves stored collaboration recommendations from PostgreSQL
   */
  static async getStoredCollaborations(facultyId?: string): Promise<any[]> {
    const where: any = {};
    if (facultyId) {
      where.OR = [{ facultyAId: facultyId }, { facultyBId: facultyId }];
    }

    return prisma.collaborationRecommendation.findMany({
      where,
      orderBy: { compatibilityScore: "desc" },
      take: 10,
      include: {
        facultyA: { include: { user: true, department: true } },
        facultyB: { include: { user: true, department: true } },
      },
    });
  }
}
