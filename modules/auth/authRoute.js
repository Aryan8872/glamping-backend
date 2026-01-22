import express from "express";
import * as authController from "./authController.js";
import { authGuard } from "../../middleware/authMiddleware.js";
import rateLimit from "express-rate-limit";
import { validateRequest } from "../../middleware/validateRequest.js";
import { registerSchema, loginSchema } from "./authValidation.js";

const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 login requests per window
  message: "Too many login attempts, please try again after 15 minutes",
});

router.post(
  "/auth/register",
  validateRequest(registerSchema),
  authController.register,
);
router.post(
  "/auth/login",
  loginLimiter,
  validateRequest(loginSchema),
  authController.login,
);
router.post("/auth/refresh", authController.refresh);
router.post("/auth/logout", authController.logout);
router.get("/auth/verify-email", authController.verifyEmail);
router.get("/auth/me", authGuard, authController.getMe);

export default router;
