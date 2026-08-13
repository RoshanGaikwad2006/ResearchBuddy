import { Router } from "express";
import { resolveDoiPreview } from "../controllers/integration.controller.js";
import { authenticateToken } from "../middleware/auth.middleware.js";

const router = Router();

router.use(authenticateToken);

router.get("/doi/preview", resolveDoiPreview);
router.post("/doi/preview", resolveDoiPreview);

export default router;
