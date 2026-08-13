import { prisma } from "../config/db.js";

export interface NormalizedTopic {
  raw: string;
  normalized: string;
  category: string;
}

export class ResearchTopicService {
  private static topicSynonymMap: Record<string, string> = {
    ai: "Artificial Intelligence",
    "artificial intelligence": "Artificial Intelligence",
    ml: "Machine Learning",
    "machine learning": "Machine Learning",
    dl: "Deep Learning",
    "deep learning": "Deep Learning",
    iot: "Internet of Things",
    "internet of things": "Internet of Things",
    nlp: "Natural Language Processing",
    "natural language processing": "Natural Language Processing",
    cv: "Computer Vision",
    "computer vision": "Computer Vision",
    blockchain: "Blockchain Technology",
    cybersecurity: "Cybersecurity",
    security: "Cybersecurity",
    robotics: "Robotics & Automation",
    automation: "Robotics & Automation",
    cloud: "Cloud Computing",
    "cloud computing": "Cloud Computing",
    datascience: "Data Science",
    "data science": "Data Science",
    bioinformatics: "Bioinformatics",
  };

  /**
   * Normalizes a raw topic string into a standardized topic entity
   */
  static normalizeTopicName(rawTopic: string): string {
    if (!rawTopic) return "";
    const clean = rawTopic.trim().toLowerCase().replace(/[^a-z0-9\s]/g, "");
    return this.topicSynonymMap[clean] || rawTopic.trim();
  }

  /**
   * Syncs and updates ResearchTopic counts across all published papers
   */
  static async syncInstitutionalTopics(): Promise<{ totalTopicsSynced: number }> {
    const researches = await prisma.research.findMany({
      select: { keywords: true, researchArea: true },
    });

    const topicCounts = new Map<string, { normalized: string; count: number }>();

    researches.forEach((r) => {
      const topics = [...(r.keywords || []), r.researchArea].filter(Boolean);
      topics.forEach((raw) => {
        const norm = this.normalizeTopicName(raw);
        if (norm) {
          const existing = topicCounts.get(norm) || { normalized: norm, count: 0 };
          existing.count++;
          topicCounts.set(norm, existing);
        }
      });
    });

    let totalTopicsSynced = 0;
    for (const [normName, data] of topicCounts.entries()) {
      await prisma.researchTopic.upsert({
        where: { normalizedName: normName },
        update: {
          researchCount: data.count,
          updatedAt: new Date(),
        },
        create: {
          name: normName,
          normalizedName: normName,
          category: "Research Area",
          researchCount: data.count,
        },
      });
      totalTopicsSynced++;
    }

    return { totalTopicsSynced };
  }

  /**
   * Retrieves top research topics with paper counts
   */
  static async getTopTopics(limit = 20): Promise<any[]> {
    return prisma.researchTopic.findMany({
      orderBy: { researchCount: "desc" },
      take: limit,
    });
  }
}
