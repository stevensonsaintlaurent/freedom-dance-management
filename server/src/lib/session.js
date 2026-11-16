import { randomBytes, createHash } from "node:crypto";

export const COOKIE_NAME = "fds_session";

export const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

const isProduction = process.env.NODE_ENV === "production";

export const generateSessionToken = () => {
  return randomBytes(32).toString("hex");
};

export const hashSessionToken = (token) => {
  return createHash("sha256").update(token).digest("hex");
};

export const getSessionCookieOptions = () => ({
  httpOnly: true,
  secure: isProduction,
  sameSite: "lax",
  path: "/",
});

export const setSessionCookie = (res, token) => {
  res.cookie(COOKIE_NAME, token, {
    ...getSessionCookieOptions(),
    maxAge: SESSION_DURATION_MS,
  });
};

export const clearSessionCookie = (res) => {
  res.clearCookie(COOKIE_NAME, getSessionCookieOptions());
};
