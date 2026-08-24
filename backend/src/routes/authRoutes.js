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
  getActiveSessions,
  resendEmailVerification,
  revokeAllSessions,
  revokeSession,
  verifyEmail,
  beginMfaSetup,
  disableMfa,
  enableMfa,
} from "../controllers/authController.js";

import {
  registerValidator,
  loginValidator,
  googleLoginValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
  resendEmailVerificationValidator,
  verifyEmailValidator,
  disableMfaValidator,
  enableMfaValidator,
  sessionIdValidator,
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

router.post(
  "/verify-email",
  authRateLimiter,
  verifyEmailValidator,
  validateRequest,
  verifyEmail
);

router.post(
  "/resend-verification",
  authRateLimiter,
  resendEmailVerificationValidator,
  validateRequest,
  resendEmailVerification
);

router.post("/logout", authRateLimiter, logoutUser);

router.get("/me", protect, getMe);
router.get("/sessions", protect, getActiveSessions);
router.delete("/sessions", protect, revokeAllSessions);
router.delete(
  "/sessions/:sessionId",
  protect,
  sessionIdValidator,
  validateRequest,
  revokeSession
);
router.post("/mfa/setup", protect, beginMfaSetup);
router.post("/mfa/enable", protect, enableMfaValidator, validateRequest, enableMfa);
router.post("/mfa/disable", protect, disableMfaValidator, validateRequest, disableMfa);

export default router;
