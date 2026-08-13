import { Router } from "express";
import { getDashboardMetrics } from "../controllers/dashboard.controller.js";
import { authenticateToken } from "../middleware/auth.middleware.js";

const router = Router();

router.use(authenticateToken);

router.get("/metrics", getDashboardMetrics);
router.get("/stats", getDashboardMetrics);

export default router;
