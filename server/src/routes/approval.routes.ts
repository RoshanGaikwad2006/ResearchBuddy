import { Router } from "express";
import { getHistory, getPendingQueue, processDecision } from "../controllers/approval.controller.js";
import { authenticateToken } from "../middleware/auth.middleware.js";

const router = Router();

router.use(authenticateToken);

router.get("/pending", getPendingQueue);
router.post("/:researchId", processDecision);
router.get("/:researchId/history", getHistory);

export default router;
