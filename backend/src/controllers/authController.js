import crypto from "crypto";
import ms from "ms";
import { OAuth2Client } from "google-auth-library";

import User from "../models/User.js";
import AuditLog from "../models/AuditLog.js";
import asyncHandler from "../utils/asyncHandler.js";
import { successResponse, errorResponse } from "../utils/apiResponse.js";
import {
  generateAccessToken,
  generateRefreshToken,
  hashToken,
} from "../utils/generateToken.js";
import env from "../config/env.js";
import { sendPasswordResetEmail } from "../services/emailService.js";
import logger from "../utils/logger.js";

const googleClient = new OAuth2Client(env.GOOGLE_CLIENT_ID);

const getRefreshTokenExpiryDate = () => {
  const milliseconds = ms(env.REFRESH_TOKEN_EXPIRES_IN);
  return new Date(Date.now() + (milliseconds || 30 * 24 * 60 * 60 * 1000));
};

export const hashRefreshToken = (refreshToken) => hashToken(refreshToken);

export const normalizeRefreshTokenSessions = (user) => {
  const now = new Date();

  user.refreshTokens = user.refreshTokens
    .filter((session) => session.expiresAt > now)
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, env.MAX_REFRESH_SESSIONS);
};

export const addRefreshTokenSession = async (user, refreshToken, req) => {
  normalizeRefreshTokenSessions(user);

  user.refreshTokens.unshift({
    tokenHash: hashRefreshToken(refreshToken),
    createdAt: new Date(),
    expiresAt: getRefreshTokenExpiryDate(),
    userAgent: req.get("user-agent") || "",
    ip: req.ip || "",
    lastUsedAt: new Date(),
  });

  user.refreshTokens = user.refreshTokens.slice(0, env.MAX_REFRESH_SESSIONS);

  await user.save();
};

export const removeRefreshTokenSession = async (user, refreshToken) => {
  const tokenHash = hashRefreshToken(refreshToken);

  user.refreshTokens = user.refreshTokens.filter(
    (session) => session.tokenHash !== tokenHash
  );

  await user.save();
};

export const setRefreshTokenCookie = (res, refreshToken) => {
  res.cookie(env.REFRESH_TOKEN_COOKIE_NAME, refreshToken, {
    httpOnly: true,
    secure: env.isProduction,
    sameSite: "lax",
    maxAge: ms(env.REFRESH_TOKEN_EXPIRES_IN) || 30 * 24 * 60 * 60 * 1000,
    path: "/",
  });
};

export const clearRefreshTokenCookie = (res) => {
  res.clearCookie(env.REFRESH_TOKEN_COOKIE_NAME, {
    httpOnly: true,
    secure: env.isProduction,
    sameSite: "lax",
    path: "/",
  });
};

export const buildSafeUserResponse = (user) => user.createSafeResponse();

const createAuditLog = async ({ req, user = null, action, metadata = {} }) => {
  try {
    await AuditLog.create({
      user,
      academy: null,
      action,
      module: "auth",
      ip: req.ip || "",
      userAgent: req.get("user-agent") || "",
      metadata,
    });
  } catch {
    // Audit failure should not break auth flow.
  }
};

const issueAuthResponse = async ({ req, res, user, message, statusCode = 200 }) => {
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken();

  await addRefreshTokenSession(user, refreshToken, req);
  setRefreshTokenCookie(res, refreshToken);

  return successResponse(
    res,
    message,
    {
      user: buildSafeUserResponse(user),
      accessToken,
    },
    statusCode
  );
};

export const registerUser = asyncHandler(async (req, res) => {
  const { name, email, phone, password, role = "academy_owner" } = req.body;

  if (!email && !phone) {
    return errorResponse(res, "Email or phone is required", 400);
  }

  if (role === "super_admin") {
    return errorResponse(res, "super_admin cannot register publicly", 403);
  }

  const existingUser = await User.findOne({
    $or: [
      ...(email ? [{ email: email.toLowerCase() }] : []),
      ...(phone ? [{ phone }] : []),
    ],
  });

  if (existingUser) {
    if (email && existingUser.email === email.toLowerCase()) {
      return errorResponse(res, "Email already exists", 409);
    }

    if (phone && existingUser.phone === phone) {
      return errorResponse(res, "Phone already exists", 409);
    }

    return errorResponse(res, "User already exists", 409);
  }

  const user = await User.create({
    name,
    email: email ? email.toLowerCase() : undefined,
    phone,
    password,
    role,
    loginProvider: "local",
  });

  await createAuditLog({
    req,
    user: user._id,
    action: "USER_REGISTERED",
    metadata: { role: user.role },
  });

  return issueAuthResponse({
    req,
    res,
    user,
    message: "Registration successful",
    statusCode: 201,
  });
});

export const loginUser = asyncHandler(async (req, res) => {
  const { identifier, password } = req.body;

  const normalizedIdentifier = String(identifier || "").trim().toLowerCase();

  const user = await User.findOne({
    $or: [{ email: normalizedIdentifier }, { phone: normalizedIdentifier }],
  }).select("+password");

  if (!user) {
    return errorResponse(res, "Invalid credentials", 401);
  }

  if (!user.isActive || user.isSuspended) {
    return errorResponse(res, "User account is inactive or suspended", 403);
  }

  if (user.loginProvider !== "local") {
    return errorResponse(res, `Please login using ${user.loginProvider}`, 400);
  }

  const isPasswordValid = await user.comparePassword(password);

  if (!isPasswordValid) {
    return errorResponse(res, "Invalid credentials", 401);
  }

  user.lastLoginAt = new Date();
  await user.save();

  await createAuditLog({
    req,
    user: user._id,
    action: "USER_LOGGED_IN",
  });

  return issueAuthResponse({
    req,
    res,
    user,
    message: "Login successful",
  });
});

export const googleLogin = asyncHandler(async (req, res) => {
  const { googleToken, role = "academy_owner" } = req.body;

  if (!env.GOOGLE_CLIENT_ID) {
    return errorResponse(res, "Google login is not configured", 500);
  }

  if (role === "super_admin") {
    return errorResponse(res, "super_admin cannot register publicly", 403);
  }

  const ticket = await googleClient.verifyIdToken({
    idToken: googleToken,
    audience: env.GOOGLE_CLIENT_ID,
  });

  const payload = ticket.getPayload();

  if (!payload?.email) {
    return errorResponse(res, "Google account email not found", 400);
  }

  const email = payload.email.toLowerCase();
  const googleId = payload.sub;

  let user = await User.findOne({
    $or: [{ googleId }, { email }],
  });

  if (user) {
    if (!user.googleId) {
      user.googleId = googleId;
    }

    if (!user.profilePicture && payload.picture) {
      user.profilePicture = payload.picture;
    }

    user.loginProvider = user.loginProvider || "google";
    user.isEmailVerified = Boolean(payload.email_verified);
    user.lastLoginAt = new Date();
    await user.save();
  } else {
    user = await User.create({
      name: payload.name || email.split("@")[0],
      email,
      role,
      loginProvider: "google",
      googleId,
      profilePicture: payload.picture || "",
      isEmailVerified: Boolean(payload.email_verified),
      lastLoginAt: new Date(),
    });
  }

  if (!user.isActive || user.isSuspended) {
    return errorResponse(res, "User account is inactive or suspended", 403);
  }

  await createAuditLog({
    req,
    user: user._id,
    action: "GOOGLE_LOGIN",
    metadata: { email: user.email },
  });

  return issueAuthResponse({
    req,
    res,
    user,
    message: "Google login successful",
  });
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const genericMessage =
    "If an account exists with this email, password reset instructions have been sent";

  const user = await User.findOne({ email: email.toLowerCase() }).select(
    "+passwordResetToken +passwordResetExpires"
  );

  if (!user || !user.isActive || user.isSuspended) {
    return successResponse(res, genericMessage);
  }

  const rawResetToken = crypto.randomBytes(32).toString("hex");

  user.passwordResetToken = hashToken(rawResetToken);
  user.passwordResetExpires = new Date(Date.now() + 15 * 60 * 1000);

  await user.save({ validateBeforeSave: false });

  const resetUrl = `${env.FRONTEND_RESET_PASSWORD_URL}?token=${rawResetToken}`;

  if (env.NODE_ENV === "development") {
    logger.info(`Development password reset URL: ${resetUrl}`);
  }

  await sendPasswordResetEmail({
    to: user.email,
    resetUrl,
  });

  await createAuditLog({
    req,
    user: user._id,
    action: "PASSWORD_RESET_REQUESTED",
  });

  return successResponse(res, genericMessage);
});

export const resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body;

  const tokenHash = hashToken(token);

  const user = await User.findOne({
    passwordResetToken: tokenHash,
    passwordResetExpires: { $gt: new Date() },
  }).select("+passwordResetToken +passwordResetExpires +password");

  if (!user) {
    return errorResponse(res, "Invalid or expired reset token", 400);
  }

  if (!user.isActive || user.isSuspended) {
    return errorResponse(res, "User account is inactive or suspended", 403);
  }

  user.password = password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  user.refreshTokens = [];

  if (user.loginProvider === "google") {
    user.loginProvider = "local";
  }

  await user.save();

  clearRefreshTokenCookie(res);

  await createAuditLog({
    req,
    user: user._id,
    action: "PASSWORD_RESET_COMPLETED",
  });

  return successResponse(res, "Password reset successful");
});

export const refreshAccessToken = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies?.[env.REFRESH_TOKEN_COOKIE_NAME];

  if (!refreshToken) {
    return errorResponse(res, "Refresh token missing", 401);
  }

  const tokenHash = hashRefreshToken(refreshToken);

  const user = await User.findOne({
    "refreshTokens.tokenHash": tokenHash,
  });

  if (!user) {
    clearRefreshTokenCookie(res);
    return errorResponse(res, "Invalid refresh token", 401);
  }

  if (!user.isActive || user.isSuspended) {
    clearRefreshTokenCookie(res);
    return errorResponse(res, "User account is inactive or suspended", 403);
  }

  normalizeRefreshTokenSessions(user);

  const session = user.refreshTokens.find(
    (item) => item.tokenHash === tokenHash
  );

  if (!session || session.expiresAt <= new Date()) {
    user.refreshTokens = user.refreshTokens.filter(
      (item) => item.tokenHash !== tokenHash
    );
    await user.save();

    clearRefreshTokenCookie(res);
    return errorResponse(res, "Refresh token expired", 401);
  }

  session.lastUsedAt = new Date();

  const accessToken = generateAccessToken(user);

  await user.save();

  return successResponse(res, "Access token refreshed", {
    user: buildSafeUserResponse(user),
    accessToken,
  });
});

export const logoutUser = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies?.[env.REFRESH_TOKEN_COOKIE_NAME];

  if (refreshToken) {
    const tokenHash = hashRefreshToken(refreshToken);

    const user = await User.findOne({
      "refreshTokens.tokenHash": tokenHash,
    });

    if (user) {
      await removeRefreshTokenSession(user, refreshToken);

      await createAuditLog({
        req,
        user: user._id,
        action: "USER_LOGGED_OUT",
      });
    }
  }

  clearRefreshTokenCookie(res);

  return successResponse(res, "Logout successful");
});

export const getMe = asyncHandler(async (req, res) => {
  return successResponse(res, "Current user fetched successfully", {
    user: buildSafeUserResponse(req.user),
  });
});