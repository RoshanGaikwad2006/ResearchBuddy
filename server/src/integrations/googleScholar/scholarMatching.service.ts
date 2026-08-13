import { ScholarNormalizationService } from "./scholarNormalization.service.js";

export interface ExistingPublicationCandidate {
  id: string;
  title: string;
  doi?: string | null;
  publicationYear: number;
  authors?: { authorName: string; facultyId?: string | null }[];
}

export interface ScholarPublicationCandidate {
  scholarId?: string;
  title: string;
  doi?: string | null;
  year?: number;
  authors?: string; // e.g. "C Patil, K Birla"
}

export class ScholarMatchingService {
  /**
   * Evaluates candidate against list of existing KRIYA publications using 5-tier deterministic priority hierarchy.
   */
  static findBestMatch(
    incoming: ScholarPublicationCandidate,
    existingPublications: ExistingPublicationCandidate[]
  ): { match: ExistingPublicationCandidate | null; matchType: string | null } {
    const normIncomingDoi = ScholarNormalizationService.normalizeDoi(incoming.doi);
    const normIncomingTitle = ScholarNormalizationService.normalizeTitle(incoming.title);
    const incomingYear = incoming.year || new Date().getFullYear();

    // 1. Tier 1: Exact Canonical DOI Match
    if (normIncomingDoi) {
      const doiMatch = existingPublications.find((p) => {
        const pDoi = ScholarNormalizationService.normalizeDoi(p.doi);
        return pDoi && pDoi === normIncomingDoi;
      });
      if (doiMatch) {
        return { match: doiMatch, matchType: "EXACT_DOI" };
      }
    }

    // 2. Tier 2: Exact Normalized Title + Publication Year Match
    const titleYearMatch = existingPublications.find((p) => {
      const pTitle = ScholarNormalizationService.normalizeTitle(p.title);
      return pTitle === normIncomingTitle && p.publicationYear === incomingYear;
    });
    if (titleYearMatch) {
      return { match: titleYearMatch, matchType: "TITLE_AND_YEAR" };
    }

    // 3. Tier 3: Normalized Title Match (within +-1 year)
    const titleNearYearMatch = existingPublications.find((p) => {
      const pTitle = ScholarNormalizationService.normalizeTitle(p.title);
      return pTitle === normIncomingTitle && Math.abs(p.publicationYear - incomingYear) <= 1;
    });
    if (titleNearYearMatch) {
      return { match: titleNearYearMatch, matchType: "TITLE_NEAR_YEAR" };
    }

    // 4. Tier 4: High Title Similarity (>= 0.85) + Author Overlap
    if (incoming.authors) {
      const incomingAuthorList = incoming.authors
        .split(/,|\band\b|&/i)
        .map((a) => ScholarNormalizationService.normalizeAuthorName(a))
        .filter((a) => a.length > 2);

      const highSimMatch = existingPublications.find((p) => {
        const sim = ScholarNormalizationService.titleSimilarity(incoming.title, p.title);
        if (sim < 0.85) return false;

        const pAuthorList = (p.authors || []).map((a) => ScholarNormalizationService.normalizeAuthorName(a.authorName));
        const hasAuthorOverlap = incomingAuthorList.some((ia) =>
          pAuthorList.some((pa) => pa.includes(ia) || ia.includes(pa))
        );
        return hasAuthorOverlap;
      });
      if (highSimMatch) {
        return { match: highSimMatch, matchType: "TITLE_AUTHOR_OVERLAP" };
      }
    }

    // 5. Tier 5: Strict Fuzzy Title Match (Levenshtein similarity >= 0.95)
    const strictFuzzyMatch = existingPublications.find((p) => {
      const sim = ScholarNormalizationService.titleSimilarity(incoming.title, p.title);
      return sim >= 0.95;
    });
    if (strictFuzzyMatch) {
      return { match: strictFuzzyMatch, matchType: "STRICT_FUZZY_TITLE" };
    }

    return { match: null, matchType: null };
  }
}
