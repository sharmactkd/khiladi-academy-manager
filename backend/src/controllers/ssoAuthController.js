import User from "../models/User.js";
import asyncHandler from "../utils/asyncHandler.js";
import { errorResponse, successResponse } from "../utils/apiResponse.js";
import { createGoogleMfaChallenge, issueAuthResponse } from "./authController.js";
import { exchangeCentralCode, verifyCentralAssertion } from "../services/centralSsoService.js";

const codePattern = /^[A-Za-z0-9_-]{64,200}$/;
const verifierPattern = /^[A-Za-z0-9._~-]{43,128}$/;

export const centralSsoLogin = asyncHandler(async (req, res) => {
  const { code, codeVerifier } = req.body || {};
  if (!codePattern.test(code || "") || !verifierPattern.test(codeVerifier || "")) {
    return errorResponse(res, "A valid central SSO callback is required", 400);
  }
  const assertion = await exchangeCentralCode({ code, codeVerifier });
  const claims = verifyCentralAssertion(assertion);
  const email = String(claims.email).trim().toLowerCase();

  let user = await User.findOne({ centralIdentityId: claims.sub }).select("+failedLoginAttempts +lockedUntil");
  if (!user && claims.legacyUserId) user = await User.findById(claims.legacyUserId).select("+failedLoginAttempts +lockedUntil");
  if (!user) {
    const emailUser = await User.findOne({ email }).select("+failedLoginAttempts +lockedUntil");
    if (emailUser && !emailUser.isEmailVerified) {
      return errorResponse(res, "Verify the existing Academy email before linking KHILADI", 409);
    }
    user = emailUser;
  }

  if (user && user.centralIdentityId && user.centralIdentityId !== claims.sub) {
    return errorResponse(res, "This Academy account is linked to another KHILADI identity", 409);
  }
  if (!user) {
    user = await User.create({
      name: claims.name || email.split("@")[0], email, role: "academy_owner",
      loginProvider: "google", profilePicture: claims.picture || "",
      isEmailVerified: true, centralIdentityId: claims.sub,
    });
  } else {
    if (user.email && user.email !== email) return errorResponse(res, "Central identity email does not match Academy account", 409);
    user.centralIdentityId = claims.sub;
    user.isEmailVerified = true;
    if (!user.profilePicture && claims.picture) user.profilePicture = claims.picture;
    user.lastLoginAt = new Date();
    await user.save({ validateBeforeSave: false });
  }

  if (!user.isActive || user.isSuspended) return errorResponse(res, "User account is inactive or suspended", 403);
  if (user.mfaEnabled) {
    const challengeToken = await createGoogleMfaChallenge(user);
    return successResponse(res, "Authenticator code required", { requiresMfa: true, challengeToken }, 202);
  }
  return issueAuthResponse({ req, res, user, message: "Central KHILADI login successful" });
});
