import { Router } from "express";

import {
  getAllClasses,
  createClass,
  assignDanceClassRoom,
} from "../controllers/classController.js";

import { requireAuth, requireRole } from "../middleware/authMiddleware.js";

const router = Router();

// ======================================================
// PUBLIC ROUTES
// ======================================================

// Everyone can view upcoming classes.

router.get("/", getAllClasses);

// ======================================================
// PROTECTED MANAGEMENT ROUTES
// ======================================================

// Only managers and admins can create classes.

router.post("/", requireAuth, requireRole("MANAGER", "ADMIN"), createClass);

// Only managers and admins can assign or change rooms.

router.patch(
  "/:id/room",
  requireAuth,
  requireRole("MANAGER", "ADMIN"),
  assignDanceClassRoom,
);

export default router;
