import { Router } from "express";

import {
  getPublicAvailability,
  getAvailabilityCalendar,
  checkRoomAvailability,
} from "../controllers/availabilityController.js";

import { requireAuth, requireRole } from "../middleware/authMiddleware.js";

const router = Router();

// ======================================================
// PUBLIC ROUTES
// ======================================================

router.get("/public", getPublicAvailability);

router.get("/check", checkRoomAvailability);

// ======================================================
// MANAGER AND ADMIN ROUTES
// ======================================================

router.get(
  "/calendar",
  requireAuth,
  requireRole("MANAGER", "ADMIN"),
  getAvailabilityCalendar,
);

export default router;
