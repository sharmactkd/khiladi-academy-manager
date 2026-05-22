import express from "express";

import {
  registerUser,
  loginUser,
  googleLogin,
  forgotPassword,
  resetPassword,
  refreshAccessToken,
  logoutUser,
  getMe,
} from "../controllers/authController.js";

import {
  registerValidator,
  loginValidator,
  googleLoginValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
} from "../validators/authValidator.js";

import validateRequest from "../middlewares/validateRequest.js";
import { protect } from "../middlewares/authMiddleware.js";
import {
  authRateLimiter,
  loginRateLimiter,
  registerRateLimiter,
} from "../middlewares/rateLimiter.js";

const router = express.Router();

router.post(
  "/register",
  registerRateLimiter,
  registerValidator,
  validateRequest,
  registerUser
);

router.post(
  "/login",
  loginRateLimiter,
  loginValidator,
  validateRequest,
  loginUser
);

router.post(
  "/google",
  loginRateLimiter,
  googleLoginValidator,
  validateRequest,
  googleLogin
);

router.post(
  "/forgot-password",
  authRateLimiter,
  forgotPasswordValidator,
  validateRequest,
  forgotPassword
);

router.post(
  "/reset-password",
  authRateLimiter,
  resetPasswordValidator,
  validateRequest,
  resetPassword
);

router.post("/refresh", authRateLimiter, refreshAccessToken);

router.post("/logout", authRateLimiter, logoutUser);

router.get("/me", protect, getMe);

export default router;