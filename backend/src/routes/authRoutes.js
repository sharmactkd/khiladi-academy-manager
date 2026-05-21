import express from "express";

import {
  registerUser,
  loginUser,
  refreshAccessToken,
  logoutUser,
  getMe,
} from "../controllers/authController.js";

import {
  registerValidator,
  loginValidator,
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

router.post("/refresh", authRateLimiter, refreshAccessToken);

router.post("/logout", authRateLimiter, logoutUser);

router.get("/me", protect, getMe);

export default router;