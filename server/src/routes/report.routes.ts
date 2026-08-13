import { Router } from "express";
import {
  exportReportExcel,
  exportReportPdf,
  getReportAuditHistory,
  getReportTemplates,
  getSavedReportConfigurations,
  previewReport,
  saveReportConfiguration,
} from "../controllers/report.controller.js";
import { authenticateToken } from "../middleware/auth.middleware.js";

const router = Router();

router.use(authenticateToken);

router.get("/templates", getReportTemplates);
router.post("/preview", previewReport);
router.post("/export/excel", exportReportExcel);
router.post("/export/pdf", exportReportPdf);
router.get("/saved", getSavedReportConfigurations);
router.post("/saved", saveReportConfiguration);
router.get("/history", getReportAuditHistory);

export default router;
