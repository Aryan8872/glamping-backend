import * as authService from "./authService.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { COOKIE_OPTIONS } from "../../utils/authUtils.js";

export const register = asyncHandler(async (req, res) => {
  const user = await authService.registerUser(req.body);
  res.status(201).json({
    message: "Registration successful",
    data: { id: user.id, email: user.email, fullName: user.fullName },
  });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const ip = req.ip;
  const userAgent = req.get("user-agent");

  const { sessionId, refreshToken, userId } = await authService.loginUser({
    email,
    password,
    ip,
    userAgent,
  });

  res.cookie("sessionId", sessionId, COOKIE_OPTIONS);
  res.cookie("refreshToken", refreshToken, {
    ...COOKIE_OPTIONS,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.json({ message: "Login successful", userId });
});

export const refresh = asyncHandler(async (req, res) => {
  const oldRefreshToken = req.cookies.refreshToken;
  if (!oldRefreshToken) {
    return res.status(401).json({ message: "No refresh token provided" });
  }

  const ip = req.ip;
  const userAgent = req.get("user-agent");

  const { sessionId, refreshToken, userId } = await authService.refreshSession(
    oldRefreshToken,
    ip,
    userAgent,
  );

  res.cookie("sessionId", sessionId, COOKIE_OPTIONS);
  res.cookie("refreshToken", refreshToken, {
    ...COOKIE_OPTIONS,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.json({ message: "Session refreshed", userId });
});

export const logout = asyncHandler(async (req, res) => {
  const { sessionId, refreshToken } = req.cookies;

  await authService.logoutUser(sessionId, refreshToken);

  res.clearCookie("sessionId", COOKIE_OPTIONS);
  res.clearCookie("refreshToken", COOKIE_OPTIONS);

  res.json({ message: "Logged out successfully" });
});

export const verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.query;
  const user = await authService.verifyEmail(token);
  res.json({ message: "Email verified successfully", userId: user.id });
});

export const getMe = asyncHandler(async (req, res) => {
  res.json({ data: req.user });
});
