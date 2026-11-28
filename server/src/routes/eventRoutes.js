import express from "express";

import {
  getPublicEvents,
  getPublicEventBySlug,
  getManagerEvents,
  createEvent,
} from "../controllers/eventController.js";

import { requireAuth, requireRole } from "../middleware/authMiddleware.js";

const router = express.Router();

// ==========================================
// PROTECTED MANAGER ROUTES
// ==========================================

router.get(
  "/manage",
  requireAuth,
  requireRole("MANAGER", "ADMIN"),
  getManagerEvents,
);

router.post("/", requireAuth, requireRole("MANAGER", "ADMIN"), createEvent);

// ==========================================
// PUBLIC ROUTES
// ==========================================

router.get("/", getPublicEvents);

router.get("/:slug", getPublicEventBySlug);

export default router;
