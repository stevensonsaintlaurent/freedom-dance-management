import { Router } from "express";

import { requireAuth, requireRole } from "../middleware/authMiddleware.js";

import { getAllUsers, updateUserRole } from "../controllers/staffController.js";

const router = Router();

// All staff routes require authentication
router.use(requireAuth);

// Only managers and admins can manage staff
router.use(requireRole("MANAGER", "ADMIN"));

// GET all registered users
router.get("/users", getAllUsers);

// UPDATE a user's role
router.patch("/users/:id/role", updateUserRole);

export default router;
