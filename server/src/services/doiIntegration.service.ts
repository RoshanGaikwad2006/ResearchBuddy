import { OpenAlexService, type StandardDoiMetadata } from "./openalex.service.js";
import { CrossrefService } from "./crossref.service.js";

export class DoiIntegrationService {
  static async resolveDoi(doi: string): Promise<StandardDoiMetadata> {
    if (!doi || typeof doi !== "string") {
      throw new Error("Valid DOI string is required");
    }

    const cleanDoi = doi.replace(/^https?:\/\/(dx\.)?doi\.org\//i, "").trim();

    // 1. Primary Attempt: OpenAlex
    const openAlexData = await OpenAlexService.fetchMetadata(cleanDoi);
    if (openAlexData) {
      return openAlexData;
    }

    // 2. Secondary Fallback: Crossref
    const crossrefData = await CrossrefService.fetchMetadata(cleanDoi);
    if (crossrefData) {
      return crossrefData;
    }

    throw new Error(`Unable to resolve DOI '${cleanDoi}' from OpenAlex or Crossref provider APIs`);
  }
}
