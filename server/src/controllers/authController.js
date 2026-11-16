import { Prisma } from "@prisma/client";

import { registerSchema, loginSchema } from "../validators/authValidator.js";

import {
  registerUserService,
  loginUserService,
  logoutUserService,
} from "../services/authService.js";

import {
  COOKIE_NAME,
  setSessionCookie,
  clearSessionCookie,
} from "../lib/session.js";

// ================= REGISTER =================

export const register = async (req, res, next) => {
  try {
    const result = registerSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid registration information",
        errors: zodErrors(result.error),
      });
    }

    const user = await registerUserService(result.data);

    return res.status(201).json({
      success: true,
      message: "Account created successfully!",
      user,
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists",
      });
    }

    next(error);
  }
};

// ================= LOGIN =================

export const login = async (req, res, next) => {
  try {
    const result = loginSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid login information",
      });
    }

    const session = await loginUserService(result.data);

    if (!session) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    setSessionCookie(res, session.token);

    return res.status(200).json({
      success: true,
      message: "Login successful!",
      user: session.user,
    });
  } catch (error) {
    next(error);
  }
};

// ================= CURRENT USER =================

export const getMe = async (req, res) => {
  return res.status(200).json({
    success: true,
    user: req.user,
  });
};

// ================= LOGOUT =================

export const logout = async (req, res, next) => {
  try {
    const token = req.cookies?.[COOKIE_NAME];

    await logoutUserService(token);

    clearSessionCookie(res);

    return res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    next(error);
  }
};

// Helper for Zod validation errors
const zodErrors = (error) => {
  return error.issues.reduce((errors, issue) => {
    const field = issue.path.join(".");

    if (!errors[field]) {
      errors[field] = [];
    }

    errors[field].push(issue.message);

    return errors;
  }, {});
};
