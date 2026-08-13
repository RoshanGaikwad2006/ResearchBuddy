import type { Response } from "express";
import type { AuthenticatedRequest } from "../middleware/auth.middleware.js";
import { DoiIntegrationService } from "../services/doiIntegration.service.js";

export const resolveDoiPreview = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const doi = (req.query.doi as string) || req.body.doi;

    if (!doi) {
      res.status(400).json({ message: "DOI parameter is required" });
      return;
    }

    const metadata = await DoiIntegrationService.resolveDoi(doi);

    res.status(200).json({
      message: `DOI resolved successfully via ${metadata.sourceApi}`,
      metadata,
    });
  } catch (error: any) {
    res.status(404).json({ message: error.message || "Failed to resolve DOI metadata" });
  }
};
