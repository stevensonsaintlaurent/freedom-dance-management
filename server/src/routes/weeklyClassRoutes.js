import { Router } from "express";

import {
  getWeeklyClasses,
  createWeeklyClass,
} from "../controllers/weeklyClassController.js";

import { requireAuth, requireRole } from "../middleware/authMiddleware.js";

const router = Router();

// Get the weekly class schedule
router.get("/", getWeeklyClasses);

// Create a recurring weekly class
// Only managers and admins can create classes
router.post(
  "/",
  requireAuth,
  requireRole("MANAGER", "ADMIN"),
  createWeeklyClass,
);

export default router;
