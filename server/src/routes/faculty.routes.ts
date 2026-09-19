import { Router } from "express";
import {
  createFaculty,
  deleteFaculty,
  getFacultyById,
  getMyFacultyProfile,
  getMyResearchIdentity,
  listFaculty,
  syncMyResearchProfile,
  updateFaculty,
  updateFacultyRole,
  updateMyResearchIdentity,
} from "../controllers/faculty.controller.js";
import { authenticateToken } from "../middleware/auth.middleware.js";

const router = Router();

// Publicly accessible endpoints for open academic profiles (No login required)
router.get("/public/:id", getFacultyById);
router.get("/public", listFaculty);

// Authenticated routes
router.use(authenticateToken);

router.get("/me", getMyFacultyProfile);
router.get("/me/research-identity", getMyResearchIdentity);
router.put("/me/research-identity", updateMyResearchIdentity);
router.post("/me/sync-research", syncMyResearchProfile);
router.post("/", createFaculty);
router.get("/", listFaculty);
router.get("/:id", getFacultyById);
router.put("/:id", updateFaculty);
router.patch("/:id/role", updateFacultyRole);
router.delete("/:id", deleteFaculty);

export default router;
