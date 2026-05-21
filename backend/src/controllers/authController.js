import ms from "ms";
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

const getRefreshTokenExpiryDate = () => {
  const milliseconds = ms(env.REFRESH_TOKEN_EXPIRES_IN);

  if (!milliseconds) {
    return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  }

  return new Date(Date.now() + milliseconds);
};

export const hashRefreshToken = (refreshToken) => {
  return hashToken(refreshToken);
};

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

export const buildSafeUserResponse = (user) => {
  return user.createSafeResponse();
};

const createAuditLog = async ({ req, actor, action, metadata = {} }) => {
  try {
    await AuditLog.create({
      actor: actor || null,
      action,
      entityType: "auth",
      metadata,
      ip: req.ip || "",
      userAgent: req.get("user-agent") || "",
    });
  } catch {
    // Audit failure should never break auth flow.
  }
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

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken();

  await addRefreshTokenSession(user, refreshToken, req);
  setRefreshTokenCookie(res, refreshToken);

  await createAuditLog({
    req,
    actor: user._id,
    action: "USER_REGISTERED",
    metadata: { role: user.role },
  });

  return successResponse(
    res,
    "Registration successful",
    {
      user: buildSafeUserResponse(user),
      accessToken,
    },
    201
  );
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
    return errorResponse(
      res,
      `Please login using ${user.loginProvider}`,
      400
    );
  }

  const isPasswordValid = await user.comparePassword(password);

  if (!isPasswordValid) {
    return errorResponse(res, "Invalid credentials", 401);
  }

  user.lastLoginAt = new Date();

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken();

  await addRefreshTokenSession(user, refreshToken, req);
  setRefreshTokenCookie(res, refreshToken);

  await createAuditLog({
    req,
    actor: user._id,
    action: "USER_LOGGED_IN",
  });

  return successResponse(res, "Login successful", {
    user: buildSafeUserResponse(user),
    accessToken,
  });
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
        actor: user._id,
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