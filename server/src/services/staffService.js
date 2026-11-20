import bcrypt from "bcryptjs";
import prisma from "../lib/prisma.js";

// ======================================
// PUBLIC USER FIELDS
// ======================================

const publicUserSelect = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
  phone: true,
  role: true,
  isActive: true,
  createdAt: true,
};

// ======================================
// GET ALL REGISTERED USERS
// ======================================

export const getAllUsersService = async () => {
  return prisma.user.findMany({
    select: publicUserSelect,
    orderBy: {
      createdAt: "desc",
    },
  });
};

// ======================================
// CREATE INSTRUCTOR ACCOUNT
// ======================================

export const createInstructorService = async (data) => {
  const { firstName, lastName, email, phone, password } = data;

  const normalizedEmail = email.trim().toLowerCase();

  // Check if account already exists
  const existingUser = await prisma.user.findUnique({
    where: {
      email: normalizedEmail,
    },
    select: {
      id: true,
    },
  });

  if (existingUser) {
    const error = new Error(
      "An account with this email already exists. Approve the existing user through Staff Management instead.",
    );

    error.statusCode = 409;
    throw error;
  }

  // Hash password using existing authentication method
  const passwordHash = await bcrypt.hash(password, 12);

  try {
    // Create instructor in PostgreSQL
    const instructor = await prisma.user.create({
      data: {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: normalizedEmail,
        phone: phone?.trim() || null,
        passwordHash,
        role: "INSTRUCTOR",
        isActive: true,
      },
      select: publicUserSelect,
    });

    return instructor;
  } catch (error) {
    // Prevent duplicate emails during concurrent requests
    if (error.code === "P2002") {
      const conflict = new Error("An account with this email already exists.");

      conflict.statusCode = 409;
      throw conflict;
    }

    throw error;
  }
};

// ======================================
// UPDATE USER ROLE
// ======================================

export const updateUserRoleService = async (userId, role) => {
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      id: true,
      role: true,
      isActive: true,
    },
  });

  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  if (!user.isActive) {
    const error = new Error("Cannot change the role of an inactive user");
    error.statusCode = 400;
    throw error;
  }

  // Protect management accounts
  if (user.role === "ADMIN" || user.role === "MANAGER") {
    const error = new Error("Manager and admin roles cannot be changed here");
    error.statusCode = 403;
    throw error;
  }

  // Prevent demoting instructors with assigned classes
  if (user.role === "INSTRUCTOR" && role === "MEMBER") {
    const [danceClassCount, weeklyClassCount] = await Promise.all([
      prisma.danceClass.count({
        where: {
          instructorId: userId,
        },
      }),

      prisma.weeklyClass.count({
        where: {
          instructorId: userId,
        },
      }),
    ]);

    if (danceClassCount > 0 || weeklyClassCount > 0) {
      const error = new Error(
        "Cannot remove instructor permissions while classes are assigned to this instructor.",
      );

      error.statusCode = 409;
      throw error;
    }
  }

  // Update role
  return prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      role,
    },
    select: publicUserSelect,
  });
};
