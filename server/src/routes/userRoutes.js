import { Router } from "express";

import { requireAuth } from "../middleware/authMiddleware.js";
import { updateProfile } from "../controllers/userController.js";

const router = Router();

// Only authenticated users can update their own profile.
router.patch("/me", requireAuth, updateProfile);

export default router;
