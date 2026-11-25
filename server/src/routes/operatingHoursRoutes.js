import { Router } from "express";

import {
  getOperatingHours,
  getRoomOperatingHours,
  updateRoomOperatingHours,
  updateBulkOperatingHours,
} from "../controllers/operatingHoursController.js";

import { requireAuth, requireRole } from "../middleware/authMiddleware.js";

const router = Router();

// All operating hours management routes are protected.

router.use(requireAuth, requireRole("MANAGER", "ADMIN"));

// GET ALL ROOM SCHEDULES

router.get("/", getOperatingHours);

// UPDATE MULTIPLE ROOMS

router.put("/bulk", updateBulkOperatingHours);

// GET AND UPDATE INDIVIDUAL ROOM

router
  .route("/:roomId")
  .get(getRoomOperatingHours)
  .put(updateRoomOperatingHours);

export default router;
