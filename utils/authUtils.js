import crypto from "crypto";

const isProduction = process.env.NODE_ENV === "production";

export const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: true, // Must be true for sameSite: 'none'
  sameSite: "none", // Required for cross-site requests (Vercel -> Render)
  path: "/",
};

export const ACCESS_TOKEN_EXPIRY = 15 * 60 * 1000; // 15 minutes
export const REFRESH_TOKEN_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 days

export const hashToken = (token) => {
  return crypto.createHash("sha256").update(token).digest("hex");
};

export const generateToken = () => {
  return crypto.randomBytes(32).toString("hex");
};
