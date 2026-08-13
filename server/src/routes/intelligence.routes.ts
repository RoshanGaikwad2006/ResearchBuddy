import { Router } from "express";
import { authenticateToken } from "../middleware/auth.middleware.js";
import {
  analyzeCollaborations,
  analyzeGaps,
  getIntelligenceOverview,
  queryCopilot,
  reindexEmbeddings,
} from "../controllers/intelligence.controller.js";

const router = Router();

router.use(authenticateToken);

router.get("/overview", getIntelligenceOverview);
router.post("/gaps/analyze", analyzeGaps);
router.get("/gaps", analyzeGaps);
router.post("/collaborations/analyze", analyzeCollaborations);
router.get("/collaborations", analyzeCollaborations);
router.post("/query", queryCopilot);
router.post("/reindex", reindexEmbeddings);

export default router;
