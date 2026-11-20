import { z } from "zod";

import {
  getAllUsersService,
  updateUserRoleService,
  createInstructorService,
} from "../services/staffService.js";

// ======================================
// VALIDATION SCHEMAS
// ======================================

const updateRoleSchema = z
  .object({
    role: z.enum(["MEMBER", "INSTRUCTOR"]),
  })
  .strict();

const createInstructorSchema = z
  .object({
    firstName: z.string().trim().min(2).max(100),
    lastName: z.string().trim().min(2).max(100),
    email: z.email().trim().toLowerCase(),
    phone: z.string().trim().max(30).optional(),
    password: z.string().min(8).max(128),
  })
  .strict();

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
// CREATE INSTRUCTOR ACCOUNT
// ======================================

export const createInstructor = async (req, res, next) => {
  try {
    const result = createInstructorSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid instructor information",
        errors: z.flattenError(result.error),
      });
    }

    const instructor = await createInstructorService(result.data);

    return res.status(201).json({
      success: true,
      message: "Instructor account created successfully",
      instructor,
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

    // Validate user ID
    const idResult = z.uuid().safeParse(id);

    if (!idResult.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    // Validate role
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
