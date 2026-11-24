import { Router } from "express";

import {
  getCancellations,
  createCancellation,
  restoreCancellation,
  getPublicCancellations,
} from "../controllers/cancellationController.js";

import { requireAuth, requireRole } from "../middleware/authMiddleware.js";

const router = Router();

// ==========================================
// PUBLIC ROUTES
// ==========================================

router.get("/public", getPublicCancellations);

// ==========================================
// PROTECTED MANAGEMENT ROUTES
// ==========================================

router.use(requireAuth, requireRole("MANAGER", "ADMIN"));

// Get all cancellations
router.get("/", getCancellations);

// Create a cancellation
router.post("/", createCancellation);

// Restore a cancelled class
router.patch("/:id/restore", restoreCancellation);

export default router;
