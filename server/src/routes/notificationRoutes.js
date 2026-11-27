import { Router } from "express";

import { requireAuth } from "../middleware/authMiddleware.js";

import {
  getMyNotifications,
  getUnreadCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "../controllers/notificationController.js";

const router = Router();

// ==========================================
// AUTHENTICATION
// ==========================================

router.use(requireAuth);

// ==========================================
// NOTIFICATION ROUTES
// ==========================================

router.get("/", getMyNotifications);

router.get("/unread-count", getUnreadCount);

router.patch("/read-all", markAllNotificationsAsRead);

router.patch("/:id/read", markNotificationAsRead);

export default router;
