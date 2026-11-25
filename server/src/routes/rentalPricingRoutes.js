import { Router } from "express";

import {
  getPublicRentalPricing,
  getRentalPricing,
  getRentalPricingRule,
  createRentalPricingRule,
  updateRentalPricingRule,
  updateRentalPricingStatus,
} from "../controllers/rentalPricingController.js";

import { requireAuth, requireRole } from "../middleware/authMiddleware.js";

const router = Router();

// ==========================================
// PUBLIC ROUTES
// ==========================================

router.get("/public", getPublicRentalPricing);

// ==========================================
// PROTECTED MANAGEMENT ROUTES
// ==========================================

router.use(requireAuth, requireRole("MANAGER", "ADMIN"));

router.route("/").get(getRentalPricing).post(createRentalPricingRule);

router.route("/:id").get(getRentalPricingRule).patch(updateRentalPricingRule);

router.patch("/:id/status", updateRentalPricingStatus);

export default router;
