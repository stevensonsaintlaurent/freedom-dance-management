import bcrypt from "bcryptjs";
import prisma from "../lib/prisma.js";

import {
  generateSessionToken,
  hashSessionToken,
  SESSION_DURATION_MS,
} from "../lib/session.js";

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

// ================= REGISTER =================

export const registerUserService = async (data) => {
  const { firstName, lastName, email, phone, password } = data;

  const passwordHash = await bcrypt.hash(password, 12);

  return prisma.user.create({
    data: {
      firstName,
      lastName,
      email,
      phone: phone || null,
      passwordHash,
      role: "MEMBER",
    },
    select: publicUserSelect,
  });
};

// ================= LOGIN =================

export const loginUserService = async ({ email, password }) => {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  // Avoid revealing whether an email exists
  if (!user || !user.isActive) {
    return null;
  }

  const passwordMatches = await bcrypt.compare(password, user.passwordHash);

  if (!passwordMatches) {
    return null;
  }

  const token = generateSessionToken();

  const tokenHash = hashSessionToken(token);

  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

  await prisma.session.create({
    data: {
      userId: user.id,
      tokenHash,
      expiresAt,
    },
  });

  const { passwordHash, ...safeUser } = user;

  return {
    user: safeUser,
    token,
    expiresAt,
  };
};

// ================= CURRENT USER =================

export const getSessionUserService = async (token) => {
  if (!token || !/^[a-f0-9]{64}$/.test(token)) {
    return null;
  }

  const tokenHash = hashSessionToken(token);

  const session = await prisma.session.findUnique({
    where: { tokenHash },
    include: {
      user: {
        select: publicUserSelect,
      },
    },
  });

  if (!session) return null;

  if (session.revokedAt) return null;

  if (session.expiresAt <= new Date()) return null;

  if (!session.user.isActive) return null;

  return session.user;
};

// ================= LOGOUT =================

export const logoutUserService = async (token) => {
  if (!token || !/^[a-f0-9]{64}$/.test(token)) {
    return;
  }

  const tokenHash = hashSessionToken(token);

  await prisma.session.updateMany({
    where: {
      tokenHash,
      revokedAt: null,
    },
    data: {
      revokedAt: new Date(),
    },
  });
};

export const createInstructorService = async (data) => {
  const { firstName, lastName, email, phone, password } = data;

  const normalizedEmail = email.trim().toLowerCase();

  // Prevent duplicate accounts
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
      "An account with this email already exists. Use Staff Management to approve the existing user instead.",
    );
    error.statusCode = 409;
    throw error;
  }

  // Use the same password hashing as registration
  const passwordHash = await bcrypt.hash(password, 12);

  try {
    return await prisma.user.create({
      data: {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: normalizedEmail,
        phone: phone?.trim() || null,
        passwordHash,
        role: "INSTRUCTOR",
        isActive: true,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });
  } catch (error) {
    // Handle simultaneous requests using the same email
    if (error.code === "P2002") {
      const conflict = new Error("An account with this email already exists.");
      conflict.statusCode = 409;
      throw conflict;
    }

    throw error;
  }
};
