/**
 * Frontend Publication Date Formatting & Filter Helpers
 */

export const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export const MONTH_SHORT_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

export const MONTH_OPTIONS = [
  { value: "ALL", label: "All Months" },
  { value: "1", label: "January (01)" },
  { value: "2", label: "February (02)" },
  { value: "3", label: "March (03)" },
  { value: "4", label: "April (04)" },
  { value: "5", label: "May (05)" },
  { value: "6", label: "June (06)" },
  { value: "7", label: "July (07)" },
  { value: "8", label: "August (08)" },
  { value: "9", label: "September (09)" },
  { value: "10", label: "October (10)" },
  { value: "11", label: "November (11)" },
  { value: "12", label: "December (12)" },
];

export function extractMonthAndYear(
  pubDate?: string | null,
  pubYear?: number | null
): {
  year: number | null;
  month: number | null;
  day: number | null;
} {
  if (!pubDate && !pubYear) return { year: null, month: null, day: null };
  const str = (pubDate || (pubYear ? String(pubYear) : "")).trim();

  // Pattern: YYYY-MM-DD or YYYY/MM/DD
  const ymd = str.match(/^(\d{4})[\/\-](\d{1,2})(?:[\/\-](\d{1,2}))?/);
  if (ymd) {
    return {
      year: parseInt(ymd[1], 10),
      month: parseInt(ymd[2], 10),
      day: ymd[3] ? parseInt(ymd[3], 10) : null,
    };
  }

  // Exact 4-digit Year
  const y = str.match(/^(\d{4})$/);
  if (y) {
    return {
      year: parseInt(y[1], 10),
      month: null,
      day: null,
    };
  }

  return {
    year: pubYear || null,
    month: null,
    day: null,
  };
}

export function formatPublicationDate(
  pubDate?: string | null,
  pubYear?: number | null
): string {
  if (!pubDate && !pubYear) return "Date not specified";
  const str = (pubDate || (pubYear ? String(pubYear) : "")).trim();

  // YYYY-MM-DD or YYYY/MM/DD
  const ymdMatch = str.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/);
  if (ymdMatch) {
    const y = ymdMatch[1];
    const m = parseInt(ymdMatch[2], 10);
    const d = parseInt(ymdMatch[3], 10);
    if (m >= 1 && m <= 12) {
      return `${d} ${MONTH_SHORT_NAMES[m - 1]} ${y}`;
    }
  }

  // YYYY-MM or YYYY/MM
  const ymMatch = str.match(/^(\d{4})[\/\-](\d{1,2})$/);
  if (ymMatch) {
    const y = ymMatch[1];
    const m = parseInt(ymMatch[2], 10);
    if (m >= 1 && m <= 12) {
      return `${MONTH_SHORT_NAMES[m - 1]} ${y}`;
    }
  }

  // 4-digit year
  if (/^\d{4}$/.test(str)) {
    return str;
  }

  return str;
}

export function matchesClientDateFilter(
  pub: { publicationDate?: string | null; publicationYear?: number | null },
  filter: { year?: string; month?: string }
): boolean {
  const { year, month } = extractMonthAndYear(pub.publicationDate, pub.publicationYear);

  if (filter.year && filter.year !== "ALL") {
    const targetYear = parseInt(filter.year, 10);
    if (year !== targetYear) {
      return false;
    }
  }

  if (filter.month && filter.month !== "ALL") {
    const targetMonth = parseInt(filter.month, 10);
    if (!month || month !== targetMonth) {
      return false;
    }
  }

  return true;
}
