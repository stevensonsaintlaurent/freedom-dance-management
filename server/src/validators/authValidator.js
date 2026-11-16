import { z } from "zod";

export const registerSchema = z.object({
  firstName: z.string().trim().min(2).max(50),

  lastName: z.string().trim().min(2).max(50),

  email: z.email().trim().toLowerCase(),

  phone: z.string().trim().max(30).optional(),

  password: z
    .string()
    .min(12, "Password must contain at least 12 characters")
    .max(72, "Password must contain at most 72 characters")
    .refine(
      (password) => Buffer.byteLength(password, "utf8") <= 72,
      "Password must not exceed 72 UTF-8 bytes",
    ),
});

export const loginSchema = z.object({
  email: z.email().trim().toLowerCase(),

  password: z.string().min(1, "Password is required"),
});
