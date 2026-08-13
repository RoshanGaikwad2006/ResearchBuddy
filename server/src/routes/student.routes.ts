import { Router } from "express";
import {
  createStudent,
  deleteStudent,
  getMyStudentProfile,
  getStudentById,
  listStudents,
  updateStudent,
} from "../controllers/student.controller.js";
import { authenticateToken } from "../middleware/auth.middleware.js";

const router = Router();

router.use(authenticateToken);

router.get("/me", getMyStudentProfile);
router.post("/", createStudent);
router.get("/", listStudents);
router.get("/:id", getStudentById);
router.put("/:id", updateStudent);
router.delete("/:id", deleteStudent);

export default router;
