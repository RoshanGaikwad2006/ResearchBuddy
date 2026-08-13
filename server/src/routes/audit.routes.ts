import { Router } from "express";
import { authenticateToken } from "../middleware/auth.middleware.js";
import {
  getAuditHealth,
  getAuditIssueById,
  getAuditIssues,
  getAuditRuns,
  resolveAuditIssue,
  runAudit,
  runAutoFix,
} from "../controllers/audit.controller.js";

const router = Router();

router.use(authenticateToken);

router.post("/run", runAudit);
router.get("/health", getAuditHealth);
router.get("/runs", getAuditRuns);
router.get("/issues", getAuditIssues);
router.get("/issues/:id", getAuditIssueById);
router.post("/issues/:id/resolve", resolveAuditIssue);
router.post("/issues/autofix", runAutoFix);

export default router;
