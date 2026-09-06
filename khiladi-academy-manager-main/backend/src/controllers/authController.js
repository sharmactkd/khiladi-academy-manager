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
import {
  sendEmailVerificationEmail,
  sendPasswordResetEmail,
} from "../services/emailService.js";
import logger from "../utils/logger.js";
import {
  createMfaSecret,
  createMfaUri,
  createRecoveryCodes,
  hashRecoveryCode,
  verifyMfaCode,
} from "../utils/mfa.js";

const googleClient = new OAuth2Client(env.GOOGLE_CLIENT_ID);

const verificationExpiry = () =>
  new Date(Date.now() + env.EMAIL_VERIFICATION_EXPIRES_MINUTES * 60 * 1000);

const createGoogleMfaChallenge = async (user) => {
  const rawToken = crypto.randomBytes(32).toString("hex");
  user.mfaLoginChallengeHash = hashToken(rawToken);
  user.mfaLoginChallengeExpires = new Date(Date.now() + 5 * 60 * 1000);
  await user.save({ validateBeforeSave: false });
  return rawToken;
};

const createEmailVerification = async (user) => {
  if (!user.email) return null;
  const rawToken = crypto.randomBytes(32).toString("hex");
  user.emailVerificationToken = hashToken(rawToken);
  user.emailVerificationExpires = verificationExpiry();
  await user.save({ validateBeforeSave: false });
  const verificationUrl = `${env.FRONTEND_VERIFY_EMAIL_URL}?token=${rawToken}`;
  await sendEmailVerificationEmail({ to: user.email, verificationUrl });
  return rawToken;
};

const recordFailedLogin = async (user) => {
  user.failedLoginAttempts = Number(user.failedLoginAttempts || 0) + 1;
  if (user.failedLoginAttempts >= env.MAX_FAILED_LOGIN_ATTEMPTS) {
    user.lockedUntil = new Date(Date.now() + env.LOGIN_LOCK_MINUTES * 60 * 1000);
    user.failedLoginAttempts = 0;
  }
  await user.save({ validateBeforeSave: false });
};

const clearFailedLogin = async (user) => {
  if (!user.failedLoginAttempts && !user.lockedUntil) return;
  user.failedLoginAttempts = 0;
  user.lockedUntil = null;
  await user.save({ validateBeforeSave: false });
};

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
    sessionId: crypto.randomUUID(),
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
    sameSite: "strict",
    maxAge: ms(env.REFRESH_TOKEN_EXPIRES_IN) || 30 * 24 * 60 * 60 * 1000,
    path: "/api/auth",
  });
};

export const clearRefreshTokenCookie = (res) => {
  res.clearCookie(env.REFRESH_TOKEN_COOKIE_NAME, {
    httpOnly: true,
    secure: env.isProduction,
    sameSite: "strict",
    path: "/api/auth",
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
  const { name, email, phone, password } = req.body;
  const role = "academy_owner";

  if (!email) {
    return errorResponse(res, "Email is required for secure registration", 400);
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

  if (env.REQUIRE_EMAIL_VERIFICATION && user.email) {
    await createEmailVerification(user);
    return successResponse(
      res,
      "Registration successful. Verify your email to continue.",
      { user: buildSafeUserResponse(user), requiresEmailVerification: true },
      201
    );
  }

  return issueAuthResponse({
    req,
    res,
    user,
    message: "Registration successful",
    statusCode: 201,
  });
});

export const loginUser = asyncHandler(async (req, res) => {
  const { identifier, password, mfaCode } = req.body;

  const normalizedIdentifier = String(identifier || "").trim().toLowerCase();

  const user = await User.findOne({
    $or: [{ email: normalizedIdentifier }, { phone: normalizedIdentifier }],
  }).select("+password +failedLoginAttempts +lockedUntil +mfaSecret +mfaRecoveryCodes");

  if (!user) {
    return errorResponse(res, "Invalid credentials", 401);
  }

  if (!user.isActive || user.isSuspended) {
    return errorResponse(res, "User account is inactive or suspended", 403);
  }

  if (user.isLoginLocked()) {
    return errorResponse(
      res,
      `Account temporarily locked. Try again after ${user.lockedUntil.toISOString()}`,
      423
    );
  }

  if (user.loginProvider !== "local") {
    return errorResponse(res, `Please login using ${user.loginProvider}`, 400);
  }

  const isPasswordValid = await user.comparePassword(password);

  if (!isPasswordValid) {
    await recordFailedLogin(user);
    return errorResponse(res, "Invalid credentials", 401);
  }

  if (user.mfaEnabled) {
    if (!mfaCode) {
      return errorResponse(res, "Authenticator code required", 401, {
        code: "MFA_REQUIRED",
      });
    }
    const normalizedRecovery = hashRecoveryCode(mfaCode);
    const recoveryIndex = user.mfaRecoveryCodes.indexOf(normalizedRecovery);
    const validTotp = verifyMfaCode({ secret: user.mfaSecret, code: mfaCode });
    if (!validTotp && recoveryIndex < 0) {
      await recordFailedLogin(user);
      return errorResponse(res, "Invalid authenticator code", 401, {
        code: "MFA_INVALID",
      });
    }
    if (recoveryIndex >= 0) {
      user.mfaRecoveryCodes.splice(recoveryIndex, 1);
      await user.save({ validateBeforeSave: false });
    }
  }

  await clearFailedLogin(user);

  if (env.REQUIRE_EMAIL_VERIFICATION && user.email && !user.isEmailVerified) {
    return errorResponse(res, "Email verification required", 403, {
      code: "EMAIL_VERIFICATION_REQUIRED",
    });
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

export const completeGoogleMfaLogin = asyncHandler(async (req, res) => {
  const challengeHash = hashToken(req.body.challengeToken);
  const user = await User.findOne({
    mfaLoginChallengeHash: challengeHash,
    mfaLoginChallengeExpires: { $gt: new Date() },
  }).select(
    "+mfaSecret +mfaRecoveryCodes +mfaLoginChallengeHash +mfaLoginChallengeExpires +failedLoginAttempts +lockedUntil"
  );

  if (!user || !user.mfaEnabled) {
    return errorResponse(res, "Google MFA challenge is invalid or expired", 401);
  }
  if (!user.isActive || user.isSuspended || user.isLoginLocked()) {
    return errorResponse(res, "User account is unavailable", 403);
  }

  const recoveryHash = hashRecoveryCode(req.body.mfaCode);
  const recoveryIndex = user.mfaRecoveryCodes.indexOf(recoveryHash);
  const validTotp = verifyMfaCode({ secret: user.mfaSecret, code: req.body.mfaCode });
  if (!validTotp && recoveryIndex < 0) {
    await recordFailedLogin(user);
    return errorResponse(res, "Invalid authenticator code", 401, { code: "MFA_INVALID" });
  }

  const update = {
    $unset: { mfaLoginChallengeHash: 1, mfaLoginChallengeExpires: 1 },
  };
  if (recoveryIndex >= 0) update.$pull = { mfaRecoveryCodes: recoveryHash };

  const consumedUser = await User.findOneAndUpdate(
    {
      _id: user._id,
      mfaLoginChallengeHash: challengeHash,
      mfaLoginChallengeExpires: { $gt: new Date() },
    },
    update,
    { new: true }
  ).select("+failedLoginAttempts +lockedUntil");
  if (!consumedUser) {
    return errorResponse(res, "Google MFA challenge has already been used", 409);
  }

  await clearFailedLogin(consumedUser);
  consumedUser.lastLoginAt = new Date();
  await consumedUser.save({ validateBeforeSave: false });
  await createAuditLog({ req, user: consumedUser._id, action: "GOOGLE_MFA_LOGIN_COMPLETED" });
  return issueAuthResponse({
    req,
    res,
    user: consumedUser,
    message: "Google login successful",
  });
});

export const googleLogin = asyncHandler(async (req, res) => {
  const { googleToken } = req.body;
  const role = "academy_owner";

  if (!env.GOOGLE_CLIENT_ID) {
    return errorResponse(res, "Google login is not configured", 500);
  }

  const ticket = await googleClient.verifyIdToken({
    idToken: googleToken,
    audience: env.GOOGLE_CLIENT_ID,
  });

  const payload = ticket.getPayload();

  if (!payload?.email) {
    return errorResponse(res, "Google account email not found", 400);
  }

  if (!payload.email_verified) {
    return errorResponse(res, "Google account email is not verified", 403);
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

  if (user.mfaEnabled) {
    const challengeToken = await createGoogleMfaChallenge(user);
    await createAuditLog({
      req,
      user: user._id,
      action: "GOOGLE_MFA_CHALLENGE_CREATED",
    });
    return successResponse(
      res,
      "Authenticator code required",
      { requiresMfa: true, challengeToken, provider: "google" },
      202
    );
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

export const verifyEmail = asyncHandler(async (req, res) => {
  const tokenHash = hashToken(req.body.token);
  const user = await User.findOne({
    emailVerificationToken: tokenHash,
    emailVerificationExpires: { $gt: new Date() },
  }).select("+emailVerificationToken +emailVerificationExpires");

  if (!user) {
    return errorResponse(res, "Invalid or expired email verification link", 400);
  }
  if (!user.isActive || user.isSuspended) {
    return errorResponse(res, "User account is inactive or suspended", 403);
  }

  user.isEmailVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpires = undefined;
  await user.save({ validateBeforeSave: false });

  await createAuditLog({ req, user: user._id, action: "EMAIL_VERIFIED" });
  return issueAuthResponse({ req, res, user, message: "Email verified successfully" });
});

export const resendEmailVerification = asyncHandler(async (req, res) => {
  const email = String(req.body.email || "").trim().toLowerCase();
  const genericMessage =
    "If an unverified account exists, a new verification link has been sent";
  const user = await User.findOne({ email }).select(
    "+emailVerificationToken +emailVerificationExpires"
  );

  if (!user || user.isEmailVerified || !user.isActive || user.isSuspended) {
    return successResponse(res, genericMessage);
  }

  await createEmailVerification(user);
  await createAuditLog({
    req,
    user: user._id,
    action: "EMAIL_VERIFICATION_RESENT",
  });
  return successResponse(res, genericMessage);
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

  if (env.REQUIRE_EMAIL_VERIFICATION && user.email && !user.isEmailVerified) {
    clearRefreshTokenCookie(res);
    return errorResponse(res, "Email verification required", 403, {
      code: "EMAIL_VERIFICATION_REQUIRED",
    });
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

  const nextRefreshToken = generateRefreshToken();
  session.tokenHash = hashRefreshToken(nextRefreshToken);
  session.lastUsedAt = new Date();
  session.rotatedAt = new Date();
  session.expiresAt = getRefreshTokenExpiryDate();
  const accessToken = generateAccessToken(user);

  await user.save();
  setRefreshTokenCookie(res, nextRefreshToken);

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

export const getActiveSessions = asyncHandler(async (req, res) => {
  const currentHash = req.cookies?.[env.REFRESH_TOKEN_COOKIE_NAME]
    ? hashRefreshToken(req.cookies[env.REFRESH_TOKEN_COOKIE_NAME])
    : "";
  normalizeRefreshTokenSessions(req.user);
  await req.user.save({ validateBeforeSave: false });
  const sessions = req.user.refreshTokens.map((session) => ({
    sessionId: session.sessionId,
    createdAt: session.createdAt,
    expiresAt: session.expiresAt,
    lastUsedAt: session.lastUsedAt,
    userAgent: session.userAgent,
    ip: session.ip,
    current: Boolean(currentHash && session.tokenHash === currentHash),
  }));
  return successResponse(res, "Active sessions fetched", { sessions });
});

export const revokeSession = asyncHandler(async (req, res) => {
  const currentHash = req.cookies?.[env.REFRESH_TOKEN_COOKIE_NAME]
    ? hashRefreshToken(req.cookies[env.REFRESH_TOKEN_COOKIE_NAME])
    : "";
  const target = req.user.refreshTokens.find(
    (session) => session.sessionId === req.params.sessionId
  );
  if (!target) return errorResponse(res, "Session not found", 404);
  const revokedCurrent = Boolean(currentHash && target.tokenHash === currentHash);
  req.user.refreshTokens = req.user.refreshTokens.filter(
    (session) => session.sessionId !== req.params.sessionId
  );
  await req.user.save({ validateBeforeSave: false });
  if (revokedCurrent) clearRefreshTokenCookie(res);
  await createAuditLog({
    req,
    user: req.user._id,
    action: "SESSION_REVOKED",
    metadata: { sessionId: req.params.sessionId, revokedCurrent },
  });
  return successResponse(res, "Session revoked", { revokedCurrent });
});

export const revokeAllSessions = asyncHandler(async (req, res) => {
  req.user.refreshTokens = [];
  await req.user.save({ validateBeforeSave: false });
  clearRefreshTokenCookie(res);
  await createAuditLog({ req, user: req.user._id, action: "ALL_SESSIONS_REVOKED" });
  return successResponse(res, "All sessions revoked");
});

export const beginMfaSetup = asyncHandler(async (req, res) => {
  if (req.user.mfaEnabled) {
    return errorResponse(res, "Multi-factor authentication is already enabled", 409);
  }
  const secret = createMfaSecret();
  return successResponse(res, "MFA setup created", {
    secret,
    otpauthUrl: createMfaUri({ secret, email: req.user.email }),
  });
});

export const enableMfa = asyncHandler(async (req, res) => {
  if (!verifyMfaCode({ secret: req.body.secret, code: req.body.code })) {
    return errorResponse(res, "Invalid authenticator code", 400);
  }
  const recoveryCodes = createRecoveryCodes();
  req.user.mfaSecret = req.body.secret;
  req.user.mfaRecoveryCodes = recoveryCodes.map(hashRecoveryCode);
  req.user.mfaEnabled = true;
  await req.user.save({ validateBeforeSave: false });
  await createAuditLog({ req, user: req.user._id, action: "MFA_ENABLED" });
  return successResponse(res, "Multi-factor authentication enabled", {
    recoveryCodes,
  });
});

export const disableMfa = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select(
    "+password +mfaSecret +mfaRecoveryCodes"
  );
  if (!user?.mfaEnabled || !(await user.comparePassword(req.body.password))) {
    return errorResponse(res, "Password or MFA configuration is invalid", 401);
  }
  const recoveryHash = hashRecoveryCode(req.body.code);
  const valid =
    verifyMfaCode({ secret: user.mfaSecret, code: req.body.code }) ||
    user.mfaRecoveryCodes.includes(recoveryHash);
  if (!valid) return errorResponse(res, "Invalid authenticator code", 401);
  user.mfaEnabled = false;
  user.mfaSecret = "";
  user.mfaRecoveryCodes = [];
  user.refreshTokens = [];
  await user.save({ validateBeforeSave: false });
  clearRefreshTokenCookie(res);
  await createAuditLog({ req, user: user._id, action: "MFA_DISABLED" });
  return successResponse(res, "Multi-factor authentication disabled");
});
