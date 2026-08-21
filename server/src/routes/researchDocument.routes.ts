import { Router } from "express";
import { authenticateToken } from "../middleware/auth.middleware.js";
import {
  registerResearchDocument,
  getMyResearchDocuments,
  syncResearchDocumentsBatch,
  deleteResearchDocument,
  linkResearchDocument,
} from "../controllers/researchDocument.controller.js";

const router = Router();

// All research document routes require authenticated token (req.user.id enforcement)
router.use(authenticateToken);

router.post("/register", registerResearchDocument);
router.get("/my", getMyResearchDocuments);
router.post("/sync", syncResearchDocumentsBatch);
router.delete("/:id", deleteResearchDocument);
router.patch("/:id/link-research", linkResearchDocument);

export default router;
