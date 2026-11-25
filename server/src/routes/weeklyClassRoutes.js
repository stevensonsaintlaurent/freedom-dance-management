import { Router } from "express";

import {
  getWeeklyClasses,
  createWeeklyClass,
  assignWeeklyClassRoom,
} from "../controllers/weeklyClassController.js";

import { requireAuth, requireRole } from "../middleware/authMiddleware.js";

const router = Router();

// ======================================================
// PUBLIC ROUTES
// ======================================================

// Get weekly class schedule
router.get("/", getWeeklyClasses);

// ======================================================
// PROTECTED ROUTES
// ======================================================

// Create recurring weekly class
router.post(
  "/",
  requireAuth,
  requireRole("MANAGER", "ADMIN"),
  createWeeklyClass,
);

// Assign or change studio room
router.patch(
  "/:id/room",
  requireAuth,
  requireRole("MANAGER", "ADMIN"),
  assignWeeklyClassRoom,
);

export default router;
