import type { StandardDoiMetadata } from "./openalex.service.js";
import { resilientFetch } from "../utils/resilientFetch.js";

export class CrossrefService {
  static async fetchMetadata(doi: string): Promise<StandardDoiMetadata | null> {
    const cleanDoi = doi.replace(/^https?:\/\/(dx\.)?doi\.org\//i, "").trim();
    const url = `https://api.crossref.org/works/${cleanDoi}`;

    try {
      const response = await resilientFetch(url, {
        headers: {
          "User-Agent": "KRIYA-Research-Platform/1.0 (mailto:admin@university.edu)",
        },
        maxRetries: 3,
        timeoutMs: 10000,
      });

      if (!response || !response.ok) {
        return null;
      }

      const payload: any = await response.json();
      const item = payload.message;

      if (!item) return null;

      // Extract Title
      const title = Array.isArray(item.title) ? item.title[0] : item.title || "Untitled Publication";

      // Extract Abstract
      let abstract = item.abstract || "";
      abstract = abstract.replace(/<[^>]*>?/gm, "").trim(); // Strip JATS XML tags if present

      // Extract Authors
      const authors = (item.author || []).map((a: any, idx: number) => ({
        authorName: `${a.given || ""} ${a.family || ""}`.trim() || "Unknown Author",
        authorOrder: idx + 1,
      }));

      // Extract Container / Journal / Conference
      const containerName = Array.isArray(item["container-title"])
        ? item["container-title"][0]
        : item["container-title"] || "";
      const isConference = item.type === "proceedings-article" || containerName.toLowerCase().includes("conference");

      // Extract Year
      const year =
        item.published?.["date-parts"]?.[0]?.[0] ||
        item["published-print"]?.["date-parts"]?.[0]?.[0] ||
        item.created?.["date-parts"]?.[0]?.[0] ||
        new Date().getFullYear();

      // Extract Keywords / Subject
      const keywords = (item.subject || []).slice(0, 5);

      return {
        doi: cleanDoi,
        title,
        abstract: abstract || "Abstract unavailable.",
        authors: authors.length > 0 ? authors : [{ authorName: "Unknown Author", authorOrder: 1 }],
        journal: isConference ? undefined : containerName,
        conference: isConference ? containerName : undefined,
        publicationYear: Number(year),
        citationCount: item["is-referenced-by-count"] || 0,
        keywords: keywords.length > 0 ? keywords : ["Research"],
        publisher: item.publisher || undefined,
        sourceApi: "Crossref",
      };
    } catch (error) {
      console.warn("Crossref API fetch failed:", error);
      return null;
    }
  }
}
