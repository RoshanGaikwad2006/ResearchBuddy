export function getGoogleScholarUrl(paper: {
  title: string;
  doi?: string | null;
  provenance?: any;
}): string {
  if (!paper) return "https://scholar.google.com";

  // 1. Direct Scholar Citation URL from provenance if available
  if (paper.provenance && typeof paper.provenance === "object") {
    if (paper.provenance.scholarUrl && typeof paper.provenance.scholarUrl === "string") {
      return paper.provenance.scholarUrl;
    }
    if (paper.provenance.clusterId) {
      return `https://scholar.google.com/scholar?cluster=${paper.provenance.clusterId}`;
    }
  }

  // 2. Direct Search by DOI if available
  if (paper.doi && paper.doi.trim() !== "") {
    return `https://scholar.google.com/scholar?q=${encodeURIComponent(paper.doi.trim())}`;
  }

  // 3. Fallback: Search by Paper Title on Google Scholar
  if (paper.title && paper.title.trim() !== "") {
    return `https://scholar.google.com/scholar?q=${encodeURIComponent(paper.title.trim())}`;
  }

  return "https://scholar.google.com";
}
