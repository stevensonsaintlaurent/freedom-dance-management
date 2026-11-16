import { Router } from "express";

import {
  register,
  login,
  getMe,
  logout,
} from "../controllers/authController.js";

import { requireAuth } from "../middleware/authMiddleware.js";

const router = Router();

// Public routes
router.post("/register", register);
router.post("/login", login);

// Protected routes
router.get("/me", requireAuth, getMe);

// Logout is idempotent: also clears invalid cookies
router.post("/logout", logout);

export default router;
