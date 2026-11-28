import express from "express";

import { requireAuth } from "../middleware/authMiddleware.js";

import {
  getMyNotificationPreferences,
  updateMyNotificationPreferences,
} from "../controllers/notificationPreferenceController.js";

const router = express.Router();

// All notification preference routes
// require authentication.

router.use(requireAuth);

// Get personal notification preferences

router.get("/", getMyNotificationPreferences);

// Update personal notification preferences

router.patch("/", updateMyNotificationPreferences);

export default router;
