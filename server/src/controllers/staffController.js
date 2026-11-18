import { z } from "zod";

import {
  getAllUsersService,
  updateUserRoleService,
} from "../services/staffService.js";

// ======================================
// GET ALL REGISTERED USERS
// ======================================

export const getAllUsers = async (req, res, next) => {
  try {
    const users = await getAllUsersService();

    return res.status(200).json({
      success: true,
      count: users.length,
      users,
    });
  } catch (error) {
    next(error);
  }
};

// ======================================
// UPDATE USER ROLE
// ======================================

export const updateUserRole = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Validate the user ID
    const idResult = z.uuid().safeParse(id);

    if (!idResult.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    // Validate the requested role
    const result = updateRoleSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid role. Use MEMBER or INSTRUCTOR.",
      });
    }

    const updatedUser = await updateUserRoleService(
      idResult.data,
      result.data.role,
    );

    return res.status(200).json({
      success: true,
      message: "User role updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    next(error);
  }
};

const updateRoleSchema = z
  .object({
    role: z.enum(["MEMBER", "INSTRUCTOR"]),
  })
  .strict();
