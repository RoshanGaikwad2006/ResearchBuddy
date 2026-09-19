/**
 * Publication Date Normalization & Parsing Utilities
 * Supports formats from Google Scholar (e.g. "2025/1/17", "2024/5", "2024"),
 * OpenAlex ("2025-01-17", "2024-05"), Crossref, and human entries.
 */

export function normalizePublicationDate(
  rawDate?: string | null,
  fallbackYear?: number | null
): string | null {
  if (!rawDate && !fallbackYear) return null;
  const trimmed = (rawDate ? String(rawDate) : "").trim();
  if (!trimmed) return fallbackYear ? String(fallbackYear) : null;

  // Pattern 1: Exact YYYY/M/D or YYYY-M-D or YYYY.M.D
  const ymdMatch = trimmed.match(/^(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})$/);
  if (ymdMatch) {
    const y = ymdMatch[1];
    const m = ymdMatch[2].padStart(2, "0");
    const d = ymdMatch[3].padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  // Pattern 2: YYYY/M or YYYY-M
  const ymMatch = trimmed.match(/^(\d{4})[\/\-\.](\d{1,2})$/);
  if (ymMatch) {
    const y = ymMatch[1];
    const m = ymMatch[2].padStart(2, "0");
    return `${y}-${m}`;
  }

  // Pattern 3: Exact 4-digit year (YYYY)
  const exactYearMatch = trimmed.match(/^(\d{4})$/);
  if (exactYearMatch) {
    return exactYearMatch[1];
  }

  // Pattern 4: Month Name and Year e.g. "January 2024", "15 Jan 2024", "May 2023"
  const monthMap: Record<string, string> = {
    jan: "01", january: "01",
    feb: "02", february: "02",
    mar: "03", march: "03",
    apr: "04", april: "04",
    may: "05",
    jun: "06", june: "06",
    jul: "07", july: "07",
    aug: "08", august: "08",
    sep: "09", sept: "09", september: "09",
    oct: "10", october: "10",
    nov: "11", november: "11",
    dec: "12", december: "12",
  };

  const monthWordMatch = trimmed.match(
    /\b(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\b/i
  );
  const yearInNamedMatch = trimmed.match(/\b(19\d{2}|20\d{2})\b/);

  if (monthWordMatch && yearInNamedMatch) {
    const m = monthMap[monthWordMatch[1].toLowerCase()];
    const y = yearInNamedMatch[1];
    const cleaned = trimmed.replace(monthWordMatch[0], "").replace(y, "").trim();
    const dayMatch = cleaned.match(/\b([1-9]|[12]\d|3[01])\b/);
    if (dayMatch) {
      const d = dayMatch[1].padStart(2, "0");
      return `${y}-${m}-${d}`;
    }
    return `${y}-${m}`;
  }

  // Pattern 5: Embedded 4-digit year
  const embeddedYearMatch = trimmed.match(/\b(19\d{2}|20\d{2})\b/);
  if (embeddedYearMatch) {
    return embeddedYearMatch[1];
  }

  return fallbackYear ? String(fallbackYear) : trimmed;
}

export function parseYearAndMonth(dateStr?: string | null): {
  year: number | null;
  month: number | null;
  day: number | null;
} {
  if (!dateStr) return { year: null, month: null, day: null };
  const str = String(dateStr).trim();

  // Check YYYY-MM-DD or YYYY/MM/DD
  const ymd = str.match(/^(\d{4})[\/\-](\d{1,2})(?:[\/\-](\d{1,2}))?/);
  if (ymd) {
    return {
      year: parseInt(ymd[1], 10),
      month: parseInt(ymd[2], 10),
      day: ymd[3] ? parseInt(ymd[3], 10) : null,
    };
  }

  // Check 4 digit year
  const y = str.match(/^(\d{4})$/);
  if (y) {
    return {
      year: parseInt(y[1], 10),
      month: null,
      day: null,
    };
  }

  return { year: null, month: null, day: null };
}

export function formatDisplayDate(
  dateStr?: string | null,
  fallbackYear?: number | null
): string {
  if (!dateStr && !fallbackYear) return "N/A";
  const str = (dateStr || (fallbackYear ? String(fallbackYear) : "")).trim();

  const monthNames = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ];

  // YYYY-MM-DD
  const ymdMatch = str.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/);
  if (ymdMatch) {
    const y = ymdMatch[1];
    const m = parseInt(ymdMatch[2], 10);
    const d = parseInt(ymdMatch[3], 10);
    if (m >= 1 && m <= 12) {
      return `${d} ${monthNames[m - 1]} ${y}`;
    }
  }

  // YYYY-MM
  const ymMatch = str.match(/^(\d{4})[\/\-](\d{1,2})$/);
  if (ymMatch) {
    const y = ymMatch[1];
    const m = parseInt(ymMatch[2], 10);
    if (m >= 1 && m <= 12) {
      return `${monthNames[m - 1]} ${y}`;
    }
  }

  // Just Year
  if (/^\d{4}$/.test(str)) {
    return str;
  }

  return str;
}

export function matchesDateFilter(
  dateStr: string | null | undefined,
  fallbackYear: number | null | undefined,
  filter: {
    year?: number;
    month?: number;
    monthStart?: number;
    monthEnd?: number;
  }
): boolean {
  const { year, month, day } = parseYearAndMonth(dateStr);
  const resolvedYear = year || fallbackYear || null;

  if (filter.year && resolvedYear !== filter.year) {
    return false;
  }

  if (filter.month) {
    if (!month) return false;
    if (month !== filter.month) return false;
  }

  if (filter.monthStart && month && month < filter.monthStart) {
    return false;
  }

  if (filter.monthEnd && month && month > filter.monthEnd) {
    return false;
  }

  return true;
}

export function buildPrismaMonthFilter(month: number, year?: number) {
  const m2 = String(month).padStart(2, "0");
  const m1 = String(month);

  if (year) {
    return {
      OR: [
        { publicationDate: { startsWith: `${year}-${m2}` } },
        { publicationDate: { startsWith: `${year}/${m2}` } },
        { publicationDate: { startsWith: `${year}/${m1}/` } },
        { publicationDate: { equals: `${year}/${m1}` } },
      ],
    };
  }

  return {
    OR: [
      { publicationDate: { contains: `-${m2}-` } },
      { publicationDate: { endsWith: `-${m2}` } },
      { publicationDate: { contains: `/${m2}/` } },
      { publicationDate: { endsWith: `/${m2}` } },
      { publicationDate: { contains: `/${m1}/` } },
      { publicationDate: { endsWith: `/${m1}` } },
    ],
  };
}

