import { Router } from "express";

import {
  getPublicRooms,
  getRooms,
  getRoom,
  createRoom,
  updateRoom,
  updateRoomStatus,
} from "../controllers/roomController.js";

import { requireAuth, requireRole } from "../middleware/authMiddleware.js";

const router = Router();

// ==========================================
// PUBLIC ROUTES
// ==========================================

router.get("/public", getPublicRooms);

// ==========================================
// PROTECTED MANAGEMENT ROUTES
// ==========================================

router.use(requireAuth, requireRole("MANAGER", "ADMIN"));

router.route("/").get(getRooms).post(createRoom);

router.route("/:id").get(getRoom).patch(updateRoom);

router.patch("/:id/status", updateRoomStatus);

export default router;
