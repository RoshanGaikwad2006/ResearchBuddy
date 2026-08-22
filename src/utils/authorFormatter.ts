export interface AuthorItemInput {
  authorName: string;
  authorOrder?: number;
  isCorresponding?: boolean;
  facultyId?: string | null;
  studentId?: string | null;
  affiliation?: string | null;
}

export interface FormattedAuthorRole {
  authorName: string;
  order: number;
  isMainAuthor: boolean;
  isCorresponding: boolean;
  roleBadgeText: string;
  roleBadgeType: "main" | "main_corresponding" | "corresponding" | "coauthor";
}

export function parseAuthorRoles(authors: AuthorItemInput[] = []): FormattedAuthorRole[] {
  if (!authors || authors.length === 0) return [];

  // Sort by authorOrder ascending
  const sorted = [...authors].sort((a, b) => (a.authorOrder || 1) - (b.authorOrder || 1));

  return sorted.map((a, idx) => {
    const order = a.authorOrder || idx + 1;
    const isMainAuthor = order === 1;
    const isCorresponding = !!a.isCorresponding;

    let roleBadgeType: FormattedAuthorRole["roleBadgeType"] = "coauthor";
    let roleBadgeText = "Co-Author";

    if (isMainAuthor && isCorresponding) {
      roleBadgeType = "main_corresponding";
      roleBadgeText = "Main & Corresponding Author";
    } else if (isMainAuthor) {
      roleBadgeType = "main";
      roleBadgeText = "Main Author (1st Author)";
    } else if (isCorresponding) {
      roleBadgeType = "corresponding";
      roleBadgeText = "Corresponding Author";
    } else {
      roleBadgeType = "coauthor";
      roleBadgeText = `Co-Author (#${order})`;
    }

    return {
      authorName: a.authorName,
      order,
      isMainAuthor,
      isCorresponding,
      roleBadgeText,
      roleBadgeType,
    };
  });
}

export function formatAuthorsSummaryString(authors: AuthorItemInput[] = []): string {
  const roles = parseAuthorRoles(authors);
  if (roles.length === 0) return "Unknown Authors";

  return roles
    .map((r) => {
      if (r.isMainAuthor && r.isCorresponding) {
        return `${r.authorName} ⭐✉️ (Main & Corresponding)`;
      }
      if (r.isMainAuthor) {
        return `${r.authorName} ⭐ (Main Author)`;
      }
      if (r.isCorresponding) {
        return `${r.authorName} ✉️ (Corresponding)`;
      }
      return `${r.authorName} (Co-Author)`;
    })
    .join(", ");
}
