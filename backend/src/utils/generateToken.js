import jwt from "jsonwebtoken";
import crypto from "crypto";
import env from "../config/env.js";

export const generateAccessToken = (user) => {
  return jwt.sign(
    {
      id: user._id.toString(),
      role: user.role,
    },
    env.JWT_ACCESS_SECRET,
    {
      expiresIn: env.ACCESS_TOKEN_EXPIRES_IN,
    }
  );
};

export const generateStepUpToken = ({ user, operation }) => jwt.sign(
  { id: user._id.toString(), purpose: "step-up", operation },
  env.JWT_ACCESS_SECRET,
  { expiresIn: `${env.STEP_UP_EXPIRES_MINUTES}m` }
);

export const verifyStepUpToken = (token) => jwt.verify(token, env.JWT_ACCESS_SECRET);

export const generateRefreshToken = () => {
  return crypto.randomBytes(64).toString("hex");
};

export const hashToken = (token) => {
  return crypto.createHash("sha256").update(token).digest("hex");
};

export const verifyAccessToken = (token) => {
  return jwt.verify(token, env.JWT_ACCESS_SECRET);
};
