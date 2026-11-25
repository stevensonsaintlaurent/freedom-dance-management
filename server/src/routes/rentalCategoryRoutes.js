import { Router } from "express";

import {
  getPublicRentalCategories,
  getRentalCategories,
  getRentalCategory,
  createRentalCategory,
  updateRentalCategory,
  updateRentalCategoryStatus,
} from "../controllers/rentalCategoryController.js";

import { requireAuth, requireRole } from "../middleware/authMiddleware.js";

const router = Router();

// ==========================================
// PUBLIC ROUTES
// ==========================================

router.get("/public", getPublicRentalCategories);

// ==========================================
// PROTECTED MANAGEMENT ROUTES
// ==========================================

router.use(requireAuth, requireRole("MANAGER", "ADMIN"));

router.route("/").get(getRentalCategories).post(createRentalCategory);

router.route("/:id").get(getRentalCategory).patch(updateRentalCategory);

router.patch("/:id/status", updateRentalCategoryStatus);

export default router;
