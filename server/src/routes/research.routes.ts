import { Router } from "express";
import {
  createResearch,
  deleteResearch,
  getMyResearches,
  getResearchById,
  listResearches,
  updateAuthorAffiliation,
  updateResearch,
  enrichResearchAbstractController,
  refreshResearchCitationsController,
  enrichResearchDateController,
  enrichAllDatesController,
  updateResearchDatesController,
  uploadManuscriptController,
} from "../controllers/research.controller.js";
import { authenticateToken } from "../middleware/auth.middleware.js";

const router = Router();

router.use(authenticateToken);

router.get("/my", getMyResearches);
router.post("/enrich-all-dates", enrichAllDatesController);
router.post("/upload-manuscript", uploadManuscriptController);
router.post("/", createResearch);
router.get("/", listResearches);
router.get("/:id", getResearchById);
router.put("/:id", updateResearch);
router.patch("/:id/dates", updateResearchDatesController);
router.post("/:id/enrich-abstract", enrichResearchAbstractController);
router.post("/:id/refresh-citations", refreshResearchCitationsController);
router.post("/:id/enrich-date", enrichResearchDateController);
router.patch("/:id/authors/:authorId/affiliation", updateAuthorAffiliation);
router.delete("/:id", deleteResearch);

export default router;

