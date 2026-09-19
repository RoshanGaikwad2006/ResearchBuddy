import mammoth from "mammoth";
import { normalizePublicationDate } from "../utils/dateFormatter.js";

export interface ParsedManuscript {
  title: string;
  authors: { authorName: string; affiliation?: string }[];
  abstract: string;
  keywords: string[];
  venueType: "JOURNAL" | "CONFERENCE" | "OTHER";
  targetVenue?: string;
  submissionDate?: string;
  conferenceDate?: string;
  wordCount: number;
  rawTextPreview: string;
}

export class ManuscriptParserService {
  /**
   * Parses a Word document buffer (.docx) into structured academic paper metadata
   */
  static async parseDocxBuffer(buffer: Buffer): Promise<ParsedManuscript> {
    const rawResult = await mammoth.extractRawText({ buffer });
    const text = rawResult.value || "";

    const lines = text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    let title = "Untitled Manuscript";
    let authors: { authorName: string; affiliation?: string }[] = [];
    let abstract = "";
    let keywords: string[] = [];
    let venueType: "JOURNAL" | "CONFERENCE" | "OTHER" = "JOURNAL";
    let targetVenue: string | undefined = undefined;
    let submissionDate: string | undefined = undefined;
    let conferenceDate: string | undefined = undefined;

    // 1. Identify Title: First substantive line that is not a generic template header
    for (let i = 0; i < Math.min(5, lines.length); i++) {
      const line = lines[i];
      if (
        !/^(ieee|springer|elsevier|acm|manuscript|draft|conference|journal|template)\b/i.test(line) &&
        line.length > 10 &&
        line.length < 250
      ) {
        title = line;
        break;
      }
    }

    // 2. Identify Abstract Section
    const abstractMatch = text.match(/(?:abstract|summary)\s*[:\-\n\r]+([\s\S]{50,2500}?)(?=\n\s*(?:keywords|index terms|i\.\s+introduction|1\.\s+introduction))/i);
    if (abstractMatch && abstractMatch[1]) {
      abstract = abstractMatch[1].replace(/\s+/g, " ").trim();
    } else {
      // Fallback: look for lines after title before introduction
      const afterTitle = text.slice(text.indexOf(title) + title.length).trim();
      const introIdx = afterTitle.search(/\b(introduction|1\.\s+intro)\b/i);
      if (introIdx > 50) {
        abstract = afterTitle.slice(0, Math.min(introIdx, 800)).replace(/\s+/g, " ").trim();
      }
    }

    // 3. Identify Keywords Section
    const keywordsMatch = text.match(/(?:keywords|index terms)\s*[:\-\n\r]+([\s\S]{5,300}?)(?=\n\s*(?:i\.\s+introduction|1\.\s+introduction|\n\n))/i);
    if (keywordsMatch && keywordsMatch[1]) {
      keywords = keywordsMatch[1]
        .split(/[,;•|]/)
        .map((k) => k.replace(/\s+/g, " ").trim())
        .filter((k) => k.length > 2 && k.length < 60);
    }
    if (keywords.length === 0) {
      keywords = ["Research Manuscript", "Under Review"];
    }

    // 4. Identify Authors & Affiliations
    // Usually between Title and Abstract
    const titleIndex = text.indexOf(title);
    const abstractIndex = text.search(/\b(abstract|summary)\b/i);
    if (titleIndex !== -1 && abstractIndex > titleIndex) {
      const authorBlock = text.slice(titleIndex + title.length, abstractIndex).trim();
      const authorLines = authorBlock.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);

      for (const line of authorLines) {
        // Skip obvious email or affiliation keywords on their own
        if (/@|department|university|institute|college|school/i.test(line)) {
          // Attach affiliation to previous author if available
          if (authors.length > 0 && !authors[authors.length - 1].affiliation) {
            authors[authors.length - 1].affiliation = line;
          }
          continue;
        }

        // Split comma/and-separated author names
        const names = line.split(/,|&|\band\b/i).map((n) => n.trim()).filter((n) => n.length > 2 && !/^\d+$/.test(n));
        for (const name of names) {
          if (name.length < 50 && !/\b(abstract|ieee|dept|college)\b/i.test(name)) {
            authors.push({ authorName: name });
          }
        }
      }
    }

    if (authors.length === 0) {
      authors = [{ authorName: "Faculty Author" }];
    }

    // 5. Detect Venue Type & Target Venue
    if (/\b(conference|proceedings|symposium|cpgcon|icbds|workshop)\b/i.test(text)) {
      venueType = "CONFERENCE";
      const confMatch = text.match(/(?:conference on|proceedings of the|presented at)\s*([^\n\r,]+)/i);
      if (confMatch) targetVenue = confMatch[1].trim();
    } else if (/\b(journal|transactions|letters|periodical)\b/i.test(text)) {
      venueType = "JOURNAL";
      const journalMatch = text.match(/(?:submitted to|under review at|journal of)\s*([^\n\r,]+)/i);
      if (journalMatch) targetVenue = journalMatch[1].trim();
    }

    // 6. Detect Dates Mentioned
    const dateMatch = text.match(/\b(received|submitted|accepted|date|draft)\s*[:\-\n\r]*([A-Za-z0-9,\s\/]+?\d{4})/i);
    if (dateMatch && dateMatch[2]) {
      const parsed = normalizePublicationDate(dateMatch[2]);
      if (parsed) submissionDate = parsed;
    }

    if (!submissionDate) {
      const today = new Date();
      submissionDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    }

    // Check for conference date if venue is conference
    if (venueType === "CONFERENCE") {
      const confDateMatch = text.match(/(?:held on|dates?|conference date)\s*[:\-\n\r]*([A-Za-z0-9,\s\/]+?\d{4})/i);
      if (confDateMatch && confDateMatch[1]) {
        conferenceDate = normalizePublicationDate(confDateMatch[1]) || undefined;
      }
    }

    const wordCount = text.split(/\s+/).filter(Boolean).length;

    return {
      title: title.slice(0, 300),
      authors: authors.slice(0, 10),
      abstract: abstract || "Abstract extracted from manuscript file.",
      keywords: keywords.slice(0, 10),
      venueType,
      targetVenue: targetVenue || (venueType === "CONFERENCE" ? "Scholarly Academic Conference" : "Peer-Reviewed Academic Journal"),
      submissionDate,
      conferenceDate,
      wordCount,
      rawTextPreview: text.slice(0, 800),
    };
  }
}
