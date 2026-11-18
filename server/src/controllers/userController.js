import { z } from "zod";
import { updateProfileService } from "../services/userService.js";

const updateProfileSchema = z
  .object({
    firstName: z.string().trim().min(1).max(100),
    lastName: z.string().trim().min(1).max(100),
    email: z.email().trim().toLowerCase(),
    phone: z.string().trim().max(30).nullable().optional(),
  })
  .strict();

export const updateProfile = async (req, res, next) => {
  try {
    const result = updateProfileSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid profile information",
        errors: result.error.flatten(),
      });
    }

    const user = await updateProfileService(req.user.id, result.data);

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user,
    });
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(409).json({
        success: false,
        message: "This email address is already in use",
      });
    }

    next(error);
  }
};
