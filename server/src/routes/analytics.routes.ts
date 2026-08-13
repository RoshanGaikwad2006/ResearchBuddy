import { Router } from "express";
import { getOverviewAnalytics } from "../controllers/analytics.controller.js";
import { authenticateToken } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/role.middleware.js";

const router = Router();

router.use(authenticateToken);

router.get("/overview", requireRole("ADMIN", "RESEARCH_CELL"), getOverviewAnalytics);

export default router;
