export type SourceType = "MANUAL_KRIYA" | "OPENALEX" | "CROSSREF" | "GOOGLE_SCHOLAR" | "RECONCILED";

export interface FieldProvenance<T = any> {
  value: T;
  source: SourceType;
  confidence?: number;
  notes?: string;
}

export interface PublicationCandidates {
  manual?: {
    title?: string;
    abstract?: string;
    doi?: string;
    venue?: string;
    citationCount?: number;
    authors?: string[];
    publicationYear?: number;
  };
  openAlex?: {
    title?: string;
    abstract?: string;
    doi?: string;
    venue?: string;
    citationCount?: number;
    authors?: string[];
    publicationYear?: number;
  };
  crossref?: {
    title?: string;
    abstract?: string;
    doi?: string;
    venue?: string;
    citationCount?: number;
    authors?: string[];
    publicationYear?: number;
  };
  scholar?: {
    title?: string;
    snippet?: string;
    doi?: string;
    venue?: string;
    citationCount?: number;
    authors?: string[];
    publicationYear?: number;
  };
}

export type VenueType = "JOURNAL" | "CONFERENCE" | "PATENT" | "BOOK" | "OTHER";

export interface ReconciledMasterRecord {
  title: FieldProvenance<string>;
  abstract: FieldProvenance<string>;
  scholarSnippet?: string;
  doi: FieldProvenance<string | null>;
  citationCount: FieldProvenance<number>;
  venue: FieldProvenance<string | null>;
  venueType: VenueType;
  patentNumber?: string;
  isbn?: string;
  publicationYear: FieldProvenance<number>;
  authors: FieldProvenance<string[]>;
  isJournal: boolean;
  provenanceSummary: string;
}

export class PublicationClassifierService {
  static classifyPublication(data: {
    title?: string;
    venue?: string | null;
    snippet?: string | null;
    openAlexType?: string | null;
  }): { venueType: VenueType; patentNumber?: string; isbn?: string } {
    const text = `${data.title || ""} ${data.venue || ""} ${data.snippet || ""}`.toLowerCase();

    // 1. Patent Check
    const patentMatch = text.match(/(in patent|patent app|patent no\.?|us patent|patent)\s*([cbr0-9,\s\/]+)?/i);
    if (patentMatch || data.openAlexType === "patent" || /\bpatent\b/i.test(text)) {
      return {
        venueType: "PATENT",
        patentNumber: patentMatch ? patentMatch[0].trim() : undefined,
      };
    }

    // 2. Book / Textbook / Chapter Check
    const isbnMatch = text.match(/(isbn\s*:?\s*978-?[0-9-]{10,17})/i);
    if (
      isbnMatch ||
      /\bisbn\b|book chapter|springer book|textbook|monograph/i.test(text) ||
      data.openAlexType === "book" ||
      data.openAlexType === "book-chapter"
    ) {
      return {
        venueType: "BOOK",
        isbn: isbnMatch ? isbnMatch[1].trim() : undefined,
      };
    }

    // 3. Conference Check
    if (
      /\b(conference|proceedings|symposium|cpgcon|icbds|ieee int|workshop|proc\.)\b/i.test(text) ||
      data.openAlexType === "proceedings-article"
    ) {
      return { venueType: "CONFERENCE" };
    }

    // 4. Journal Check
    if (
      /\b(journal|transactions|ijca|ijettecs|ijrar|ijrem|letters|periodical)\b/i.test(text) ||
      data.openAlexType === "journal-article"
    ) {
      return { venueType: "JOURNAL" };
    }

    return { venueType: "OTHER" };
  }
}

export class FieldReconciliationService {
  /**
   * Reconstructs abstract from OpenAlex inverted index structure safely
   */
  static reconstructOpenAlexAbstract(invertedIndex?: { [word: string]: number[] } | null): string | null {
    if (!invertedIndex || typeof invertedIndex !== "object") return null;

    try {
      const wordsWithPositions: { word: string; pos: number }[] = [];
      for (const [word, positions] of Object.entries(invertedIndex)) {
        if (Array.isArray(positions)) {
          for (const pos of positions) {
            if (typeof pos === "number") {
              wordsWithPositions.push({ word, pos });
            }
          }
        }
      }

      if (wordsWithPositions.length === 0) return null;

      wordsWithPositions.sort((a, b) => a.pos - b.pos);
      const text = wordsWithPositions.map((w) => w.word).join(" ");
      return text.trim();
    } catch {
      return null;
    }
  }

  /**
   * Abstract Validation Engine
   * Validates non-empty, meaningful length, not just title/snippet, reasonable content
   */
  static isValidAbstract(text?: string | null, title?: string): boolean {
    if (!text || typeof text !== "string") return false;
    const trimmed = text.trim();

    if (/^(abstract unavailable|no abstract|null|undefined)\.?$/i.test(trimmed) || trimmed.toLowerCase() === "abstract unavailable.") return false;
    if (trimmed.startsWith("{") || trimmed.startsWith("[")) return false; // Reject JSON dumps

    if (title) {
      const titleLower = title.trim().toLowerCase();
      const textLower = trimmed.toLowerCase();
      if (textLower === titleLower) return false;
      if (textLower.startsWith(titleLower) && textLower.length < titleLower.length + 25) return false;
    }

    if (trimmed.length < 20) return false;

    return true;
  }

  /**
   * Reconciles a publication across all candidate sources with independent field-level provenance
   */
  static reconcilePublication(candidates: PublicationCandidates): ReconciledMasterRecord {
    // 1. ABSTRACT RECONCILIATION PRIORITY
    // Priority: 1. Manual KRIYA -> 2. OpenAlex -> 3. Crossref -> 4. Google Scholar snippet -> 5. Unavailable
    let selectedAbstract: FieldProvenance<string> = {
      value: "Abstract unavailable.",
      source: "GOOGLE_SCHOLAR",
    };

    const titleHint = candidates.manual?.title || candidates.openAlex?.title || candidates.scholar?.title;

    if (candidates.manual?.abstract && this.isValidAbstract(candidates.manual.abstract, titleHint)) {
      selectedAbstract = { value: candidates.manual.abstract.trim(), source: "MANUAL_KRIYA" };
    } else if (candidates.openAlex?.abstract && this.isValidAbstract(candidates.openAlex.abstract, titleHint)) {
      selectedAbstract = { value: candidates.openAlex.abstract.trim(), source: "OPENALEX" };
    } else if (candidates.crossref?.abstract && this.isValidAbstract(candidates.crossref.abstract, titleHint)) {
      selectedAbstract = { value: candidates.crossref.abstract.trim(), source: "CROSSREF" };
    } else if (candidates.scholar?.snippet && this.isValidAbstract(candidates.scholar.snippet, titleHint)) {
      selectedAbstract = { value: candidates.scholar.snippet.trim(), source: "GOOGLE_SCHOLAR" };
    }

    // 2. CITATION COUNT RECONCILIATION PRIORITY
    // Google Scholar citation count is strictly prioritized for citation metrics
    const scholarCits = candidates.scholar?.citationCount ?? 0;
    const manualCits = candidates.manual?.citationCount ?? 0;
    const openAlexCits = candidates.openAlex?.citationCount ?? 0;

    let selectedCitations: FieldProvenance<number> = {
      value: Math.max(scholarCits, manualCits, openAlexCits),
      source: scholarCits >= manualCits && scholarCits >= openAlexCits ? "GOOGLE_SCHOLAR" : "OPENALEX",
    };

    // 3. TITLE RECONCILIATION
    let selectedTitle: FieldProvenance<string> = {
      value: candidates.manual?.title || candidates.openAlex?.title || candidates.scholar?.title || candidates.crossref?.title || "Untitled Publication",
      source: candidates.manual?.title ? "MANUAL_KRIYA" : candidates.openAlex?.title ? "OPENALEX" : candidates.scholar?.title ? "GOOGLE_SCHOLAR" : "CROSSREF",
    };

    // 4. DOI RECONCILIATION
    let selectedDoi: FieldProvenance<string | null> = {
      value: candidates.manual?.doi || candidates.openAlex?.doi || candidates.crossref?.doi || candidates.scholar?.doi || null,
      source: candidates.manual?.doi ? "MANUAL_KRIYA" : candidates.openAlex?.doi ? "OPENALEX" : candidates.crossref?.doi ? "CROSSREF" : "GOOGLE_SCHOLAR",
    };

    // 5. VENUE RECONCILIATION
    let selectedVenue: FieldProvenance<string | null> = {
      value: candidates.openAlex?.venue || candidates.crossref?.venue || candidates.manual?.venue || candidates.scholar?.venue || null,
      source: candidates.openAlex?.venue ? "OPENALEX" : candidates.crossref?.venue ? "CROSSREF" : candidates.manual?.venue ? "MANUAL_KRIYA" : "GOOGLE_SCHOLAR",
    };

    // 6. PUBLICATION YEAR RECONCILIATION
    let selectedYear: FieldProvenance<number> = {
      value: candidates.openAlex?.publicationYear || candidates.scholar?.publicationYear || candidates.crossref?.publicationYear || candidates.manual?.publicationYear || new Date().getFullYear(),
      source: candidates.openAlex?.publicationYear ? "OPENALEX" : candidates.scholar?.publicationYear ? "GOOGLE_SCHOLAR" : "CROSSREF",
    };

    // 7. AUTHORS RECONCILIATION
    const authorList = candidates.openAlex?.authors || candidates.crossref?.authors || candidates.scholar?.authors || candidates.manual?.authors || [];
    let selectedAuthors: FieldProvenance<string[]> = {
      value: authorList,
      source: candidates.openAlex?.authors ? "OPENALEX" : "RECONCILED",
    };

    const classification = PublicationClassifierService.classifyPublication({
      title: selectedTitle.value,
      venue: selectedVenue.value,
      snippet: candidates.scholar?.snippet,
    });

    const isJournal = classification.venueType === "JOURNAL";

    return {
      title: selectedTitle,
      abstract: selectedAbstract,
      scholarSnippet: candidates.scholar?.snippet || undefined,
      doi: selectedDoi,
      citationCount: selectedCitations,
      venue: selectedVenue,
      venueType: classification.venueType,
      patentNumber: classification.patentNumber,
      isbn: classification.isbn,
      publicationYear: selectedYear,
      authors: selectedAuthors,
      isJournal,
      provenanceSummary: `Reconciled Master Record (Abstract: ${selectedAbstract.source}, Citations: ${selectedCitations.source}, DOI: ${selectedDoi.source}, Type: ${classification.venueType})`,
    };
  }
}
