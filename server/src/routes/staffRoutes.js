import { Router } from "express";

import { requireAuth, requireRole } from "../middleware/authMiddleware.js";

import {
  getAllUsers,
  updateUserRole,
  createInstructor,
} from "../controllers/staffController.js";

const router = Router();

// ======================================
// AUTHENTICATION
// ======================================

// All staff routes require authentication
router.use(requireAuth);

// Only managers and admins can manage staff
router.use(requireRole("MANAGER", "ADMIN"));

// ======================================
// STAFF ROUTES
// ======================================

// Get all registered users
router.get("/users", getAllUsers);

// Create new instructor account
router.post("/instructors", createInstructor);

// Update user role
router.patch("/users/:id/role", updateUserRole);

export default router;
