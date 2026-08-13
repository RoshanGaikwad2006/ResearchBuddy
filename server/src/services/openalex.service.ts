import { FieldReconciliationService } from "./fieldReconciliation.service.js";

export interface StandardDoiMetadata {
  doi: string;
  title: string;
  abstract: string;
  authors: { authorName: string; authorOrder: number }[];
  journal?: string;
  conference?: string;
  publicationYear: number;
  citationCount: number;
  keywords: string[];
  publisher?: string;
  sourceApi: "OpenAlex" | "Crossref";
}

export class OpenAlexService {
  static async fetchMetadata(doi: string): Promise<StandardDoiMetadata | null> {
    const cleanDoi = doi.replace(/^https?:\/\/(dx\.)?doi\.org\//i, "").trim();
    const url = `https://api.openalex.org/works/https://doi.org/${cleanDoi}`;

    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent": "KRIYA-Research-Platform/1.0 (mailto:admin@university.edu)",
        },
      });

      if (!response.ok) {
        return null;
      }

      const data: any = await response.json();

      // Reconstruct & Validate Abstract from OpenAlex Inverted Index if available
      const rawAbstract = FieldReconciliationService.reconstructOpenAlexAbstract(data.abstract_inverted_index);
      const abstractText = FieldReconciliationService.isValidAbstract(rawAbstract, data.title) ? rawAbstract! : "";

      // Extract Authors
      const authors = (data.authorships || []).map((a: any, idx: number) => ({
        authorName: a.author?.display_name || "Unknown Author",
        authorOrder: idx + 1,
      }));

      // Extract Venue / Source
      const sourceName = data.primary_location?.source?.display_name || "";
      const isConference = data.type === "proceedings-article" || sourceName.toLowerCase().includes("conference");

      // Extract Topics / Keywords
      const keywords: string[] = (data.concepts || [])
        .slice(0, 5)
        .map((c: any) => c.display_name);

      return {
        doi: cleanDoi,
        title: data.title || "Untitled Publication",
        abstract: abstractText || "Abstract unavailable.",
        authors: authors.length > 0 ? authors : [{ authorName: "Unknown Author", authorOrder: 1 }],
        journal: isConference ? undefined : sourceName,
        conference: isConference ? sourceName : undefined,
        publicationYear: data.publication_year || new Date().getFullYear(),
        citationCount: data.cited_by_count || 0,
        keywords: keywords.length > 0 ? keywords : ["Research"],
        publisher: data.primary_location?.source?.host_organization_name || undefined,
        sourceApi: "OpenAlex",
      };
    } catch (error) {
      console.warn("OpenAlex API fetch failed:", error);
      return null;
    }
  }

  static async fetchMetadataByTitle(title: string): Promise<StandardDoiMetadata | null> {
    if (!title || title.length < 5) return null;
    const cleanTitle = encodeURIComponent(title.trim());
    const url = `https://api.openalex.org/works?search=${cleanTitle}`;

    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent": "KRIYA-Research-Platform/1.0 (mailto:admin@university.edu)",
        },
      });

      if (!response.ok) return null;

      const resData: any = await response.json();
      if (!resData.results || resData.results.length === 0) return null;

      const data = resData.results[0];

      // Strict Title Similarity Safeguard: Prevent random or mismatching DOI assignment
      const normTargetTitle = title.toLowerCase().replace(/[^a-z0-9]/g, "");
      const normFoundTitle = (data.title || "").toLowerCase().replace(/[^a-z0-9]/g, "");

      if (!normFoundTitle || (!normTargetTitle.includes(normFoundTitle) && !normFoundTitle.includes(normTargetTitle))) {
        // Calculate basic word overlap
        const wordsTarget = title.toLowerCase().split(/\s+/).filter((w: string) => w.length > 3);
        const wordsFound = (data.title || "").toLowerCase().split(/\s+/).filter((w: string) => w.length > 3);
        const matchCount = wordsTarget.filter((w: string) => wordsFound.includes(w)).length;
        if (wordsTarget.length > 0 && matchCount / wordsTarget.length < 0.6) {
          return null; // Reject candidate - do NOT assign random DOI
        }
      }

      const rawAbstract = FieldReconciliationService.reconstructOpenAlexAbstract(data.abstract_inverted_index);
      const abstractText = FieldReconciliationService.isValidAbstract(rawAbstract, data.title) ? rawAbstract! : "";

      const authors = (data.authorships || []).map((a: any, idx: number) => ({
        authorName: a.author?.display_name || "Unknown Author",
        authorOrder: idx + 1,
      }));

      const sourceName = data.primary_location?.source?.display_name || "";
      const isConference = data.type === "proceedings-article" || sourceName.toLowerCase().includes("conference");
      const keywords: string[] = (data.concepts || []).slice(0, 5).map((c: any) => c.display_name);
      const cleanDoi = data.doi ? data.doi.replace(/^https?:\/\/(dx\.)?doi\.org\//i, "").trim() : "";

      return {
        doi: cleanDoi,
        title: data.title || title,
        abstract: abstractText || "Abstract unavailable.",
        authors: authors.length > 0 ? authors : [{ authorName: "Unknown Author", authorOrder: 1 }],
        journal: isConference ? undefined : sourceName,
        conference: isConference ? sourceName : undefined,
        publicationYear: data.publication_year || new Date().getFullYear(),
        citationCount: data.cited_by_count || 0,
        keywords: keywords.length > 0 ? keywords : ["Research"],
        publisher: data.primary_location?.source?.host_organization_name || undefined,
        sourceApi: "OpenAlex",
      };
    } catch {
      return null;
    }
  }

  static async fetchWorksByOrcid(orcid: string): Promise<StandardDoiMetadata[]> {
    if (!orcid) return [];
    const cleanOrcid = orcid.replace(/^https?:\/\/orcid\.org\//i, "").trim();
    const url = `https://api.openalex.org/works?filter=author.orcid:https://orcid.org/${cleanOrcid}`;

    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent": "KRIYA-Research-Platform/1.0 (mailto:admin@university.edu)",
        },
      });

      if (!response.ok) return [];

      const resData: any = await response.json();
      if (!resData.results) return [];

      return resData.results.map((data: any) => {
        let abstractText = "";
        if (data.abstract_inverted_index) {
          const indexMap: { [word: string]: number[] } = data.abstract_inverted_index;
          const wordsWithPositions: { word: string; pos: number }[] = [];
          for (const [word, positions] of Object.entries(indexMap)) {
            for (const pos of positions) {
              wordsWithPositions.push({ word, pos });
            }
          }
          wordsWithPositions.sort((a, b) => a.pos - b.pos);
          abstractText = wordsWithPositions.map((w) => w.word).join(" ");
        }

        const authors = (data.authorships || []).map((a: any, idx: number) => ({
          authorName: a.author?.display_name || "Unknown Author",
          authorOrder: idx + 1,
        }));

        const sourceName = data.primary_location?.source?.display_name || "";
        const isConference = data.type === "proceedings-article" || sourceName.toLowerCase().includes("conference");
        const keywords: string[] = (data.concepts || []).slice(0, 5).map((c: any) => c.display_name);
        const cleanDoi = data.doi ? data.doi.replace(/^https?:\/\/(dx\.)?doi\.org\//i, "").trim() : "";

        return {
          doi: cleanDoi,
          title: data.title || "Untitled Publication",
          abstract: abstractText || "Abstract unavailable.",
          authors: authors.length > 0 ? authors : [{ authorName: "Unknown Author", authorOrder: 1 }],
          journal: isConference ? undefined : sourceName,
          conference: isConference ? sourceName : undefined,
          publicationYear: data.publication_year || new Date().getFullYear(),
          citationCount: data.cited_by_count || 0,
          keywords: keywords.length > 0 ? keywords : ["Research"],
          publisher: data.primary_location?.source?.host_organization_name || undefined,
          sourceApi: "OpenAlex" as const,
        };
      });
    } catch {
      return [];
    }
  }
}
