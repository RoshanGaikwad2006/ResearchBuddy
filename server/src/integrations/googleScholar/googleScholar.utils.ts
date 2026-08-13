export const extractScholarAuthorId = (input: string): string => {
  if (!input || typeof input !== "string") {
    throw new Error("Invalid Google Scholar URL or Author ID");
  }

  const trimmed = input.trim();

  // If full URL provided, extract 'user' query parameter
  if (trimmed.includes("scholar.google")) {
    try {
      const url = new URL(trimmed.startsWith("http") ? trimmed : `https://${trimmed}`);
      const userParam = url.searchParams.get("user");
      if (userParam) {
        return userParam;
      }
    } catch {
      // Fall through to regex match
    }

    const match = trimmed.match(/user=([a-zA-Z0-9_-]+)/);
    if (match && match[1]) {
      return match[1];
    }
  }

  // Otherwise assume raw author ID
  const cleanId = trimmed.replace(/[^a-zA-Z0-9_-]/g, "");
  if (!cleanId) {
    throw new Error("Could not parse valid Author ID from input");
  }

  return cleanId;
};
