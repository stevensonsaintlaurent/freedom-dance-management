import { Router } from "express";
import { getAllClasses, createClass } from "../controllers/classController.js";
import { requireAuth, requireRole } from "../middleware/authMiddleware.js";

const router = Router();

// Everyone can view upcoming classes
router.get("/", getAllClasses);

// Only managers and admins can create classes
router.post("/", requireAuth, requireRole("MANAGER", "ADMIN"), createClass);

export default router;
