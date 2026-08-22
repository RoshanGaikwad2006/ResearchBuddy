export class ScholarNormalizationService {
  /**
   * Canonicalize DOI format e.g. "10.1109/icbds61829.2024.10837557"
   */
  static normalizeDoi(doi?: string | null): string | null {
    if (!doi) return null;
    const clean = doi
      .replace(/^https?:\/\/(dx\.)?doi\.org\//i, "")
      .replace(/^(doi:|doi\s+)/i, "")
      .trim()
      .toLowerCase();

    // Strict ISO 26324 / Crossref DOI syntax validation guard
    const validDoiPattern = /^10\.\d{4,9}\/[-._;()/:A-Za-z0-9]+$/;
    if (!validDoiPattern.test(clean)) {
      return null;
    }

    if (clean.includes("xxx") || clean.includes("invalid") || clean.includes("placeholder")) {
      return null;
    }

    return clean;
  }

  /**
   * Normalize paper titles for deterministic matching (strips accents, punctuation, collapses spaces)
   */
  static normalizeTitle(title?: string | null): string {
    if (!title) return "";
    return title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // Remove diacritics
      .replace(/[^a-z0-9\s]/g, " ") // Punctuation to space
      .replace(/\s+/g, " ") // Collapse whitespace
      .trim();
  }

  /**
   * Normalize author names e.g. "Dr. Kushal P. Birla" -> "kushal p birla"
   */
  static normalizeAuthorName(name?: string | null): string {
    if (!name) return "";
    return name
      .toLowerCase()
      .replace(/^(dr\.|prof\.|mr\.|mrs\.|ms\.)\s+/i, "")
      .replace(/[^a-z0-9\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  /**
   * Levenshtein similarity distance between two string titles (0.0 to 1.0)
   */
  static titleSimilarity(titleA: string, titleB: string): number {
    const normA = this.normalizeTitle(titleA);
    const normB = this.normalizeTitle(titleB);

    if (normA === normB) return 1.0;
    if (!normA || !normB) return 0.0;

    const lenA = normA.length;
    const lenB = normB.length;
    const matrix: number[][] = Array.from({ length: lenA + 1 }, () => Array(lenB + 1).fill(0));

    for (let i = 0; i <= lenA; i++) matrix[i][0] = i;
    for (let j = 0; j <= lenB; j++) matrix[0][j] = j;

    for (let i = 1; i <= lenA; i++) {
      for (let j = 1; j <= lenB; j++) {
        const cost = normA[i - 1] === normB[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j - 1] + cost
        );
      }
    }

    const maxLen = Math.max(lenA, lenB);
    return maxLen === 0 ? 1.0 : (maxLen - matrix[lenA][lenB]) / maxLen;
  }

  /**
   * Strong Author Overlap Safeguard: Verify that local author names match candidate paper authors
   */
  static hasAuthorMatch(localAuthorNames: string[], remoteAuthorNames: string[]): boolean {
    if (!localAuthorNames || localAuthorNames.length === 0) return true;
    if (!remoteAuthorNames || remoteAuthorNames.length === 0) return false;

    const normalize = (s: string) => s.toLowerCase().replace(/[^a-z]/g, "");

    for (const local of localAuthorNames) {
      const localNorm = normalize(local);
      if (localNorm.length < 3) continue;

      const parts = local.trim().split(" ");
      const lastName = parts[parts.length - 1];
      const lastNameNorm = normalize(lastName);

      for (const remote of remoteAuthorNames) {
        const remoteNorm = normalize(remote);
        if (remoteNorm.includes(localNorm) || localNorm.includes(remoteNorm)) {
          return true;
        }
        if (lastNameNorm.length >= 3 && remoteNorm.includes(lastNameNorm)) {
          return true;
        }
      }
    }

    return false;
  }
}
