import { Router } from "express";
import { authenticateToken } from "../middleware/auth.middleware.js";
import {
  getDepartmentSubgraph,
  getFacultySubgraph,
  getGraphAnalytics,
  getInstitutionalGraph,
  getTopicSubgraph,
} from "../controllers/knowledgeGraph.controller.js";

const router = Router();

router.use(authenticateToken);

router.get("/", getInstitutionalGraph);
router.get("/analytics", getGraphAnalytics);
router.get("/faculty/:id", getFacultySubgraph);
router.get("/department/:id", getDepartmentSubgraph);
router.get("/topic/:name", getTopicSubgraph);

export default router;
