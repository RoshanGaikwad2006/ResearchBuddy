import { Router } from "express";
import {
  getScholarPreview,
  syncFacultyScholar,
  syncMyScholar,
  syncInstitutionScholar,
  getScholarSyncRuns,
  getScholarSyncRunById,
} from "./googleScholar.controller.js";
import { authenticateToken, checkRole } from "../../middleware/auth.middleware.js";

const router = Router();

router.use(authenticateToken);

router.get("/preview", getScholarPreview);
router.post("/sync/me", syncMyScholar);
router.post("/sync/institution", checkRole(["ADMIN", "RESEARCH_CELL"]), syncInstitutionScholar);
router.post("/sync/:facultyId", syncFacultyScholar);

router.get("/runs", checkRole(["ADMIN", "RESEARCH_CELL"]), getScholarSyncRuns);
router.get("/runs/:id", checkRole(["ADMIN", "RESEARCH_CELL"]), getScholarSyncRunById);

export default router;
