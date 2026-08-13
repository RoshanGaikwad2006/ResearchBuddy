import { Router } from "express";
import {
  createResearch,
  deleteResearch,
  getMyResearches,
  getResearchById,
  listResearches,
  updateAuthorAffiliation,
  updateResearch,
} from "../controllers/research.controller.js";
import { authenticateToken } from "../middleware/auth.middleware.js";

const router = Router();

router.use(authenticateToken);

router.get("/my", getMyResearches);
router.post("/", createResearch);
router.get("/", listResearches);
router.get("/:id", getResearchById);
router.put("/:id", updateResearch);
router.patch("/:id/authors/:authorId/affiliation", updateAuthorAffiliation);
router.delete("/:id", deleteResearch);

export default router;
