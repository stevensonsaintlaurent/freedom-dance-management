import { Router } from "express";

import {
  createWeeklyBooking,
  getWeeklyBookings,
  updateWeeklyBookingStatus,
} from "../controllers/weeklyBookingController.js";

import { requireAuth, requireRole } from "../middleware/authMiddleware.js";

const router = Router();

// Anyone can submit a class reservation.
router.post("/", createWeeklyBooking);

// Managers, admins and instructors can view bookings.
// Instructors are restricted to their own classes
// inside the controller.
router.get(
  "/",
  requireAuth,
  requireRole("MANAGER", "ADMIN", "INSTRUCTOR"),
  getWeeklyBookings,
);

// Only managers and admins can change booking status.
router.patch(
  "/:id/status",
  requireAuth,
  requireRole("MANAGER", "ADMIN"),
  updateWeeklyBookingStatus,
);

export default router;
