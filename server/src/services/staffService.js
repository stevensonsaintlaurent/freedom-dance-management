import prisma from "../lib/prisma.js";

// ======================================
// GET ALL REGISTERED USERS
// ======================================

export const getAllUsersService = async () => {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
    },

    orderBy: {
      createdAt: "desc",
    },
  });

  return users;
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

  if (user.role === "ADMIN" || user.role === "MANAGER") {
    const error = new Error("Manager and admin roles cannot be changed here");
    error.statusCode = 403;
    throw error;
  }

  // Prevent demoting instructors with assigned classes
  if (user.role === "INSTRUCTOR" && role === "MEMBER") {
    const assignedClasses = await prisma.danceClass.count({
      where: {
        instructorId: userId,
      },
    });

    if (assignedClasses > 0) {
      const error = new Error(
        "Cannot demote an instructor with assigned classes",
      );
      error.statusCode = 409;
      throw error;
    }
  }

  const updatedUser = await prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      role,
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      role: true,
      isActive: true,
    },
  });

  return updatedUser;
};
