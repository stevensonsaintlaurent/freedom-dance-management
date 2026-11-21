import { Router } from "express";

import {
  getAttendance,
  markAttendance,
} from "../controllers/attendanceController.js";

import { requireAuth, requireRole } from "../middleware/authMiddleware.js";

const router = Router();

// ==========================================
// GET CLASS ATTENDANCE
// ==========================================
// Instructor: View attendance for own classes
// Manager: View attendance for all classes
// Admin: View attendance for all classes

router.get(
  "/",
  requireAuth,
  requireRole("INSTRUCTOR", "MANAGER", "ADMIN"),
  getAttendance,
);

// ==========================================
// MARK OR UPDATE ATTENDANCE
// ==========================================
// Instructor: Mark students in own classes
// Manager: Mark students in all classes
// Admin: Mark students in all classes

router.patch(
  "/:bookingId",
  requireAuth,
  requireRole("INSTRUCTOR", "MANAGER", "ADMIN"),
  markAttendance,
);

export default router;
