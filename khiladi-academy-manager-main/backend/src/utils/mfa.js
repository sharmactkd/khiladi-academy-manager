import crypto from "crypto";
import * as OTPAuth from "otpauth";
import { hashToken } from "./generateToken.js";

export const createMfaSecret = () => new OTPAuth.Secret({ size: 20 }).base32;

export const createMfaUri = ({ secret, email }) =>
  new OTPAuth.TOTP({
    issuer: "KHILADI Academy Manager",
    label: email || "KHILADI account",
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret: OTPAuth.Secret.fromBase32(secret),
  }).toString();

export const verifyMfaCode = ({ secret, code }) => {
  if (!secret || !/^\d{6}$/.test(String(code || ""))) return false;
  const totp = new OTPAuth.TOTP({
    issuer: "KHILADI Academy Manager",
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret: OTPAuth.Secret.fromBase32(secret),
  });
  return totp.validate({ token: String(code), window: 1 }) !== null;
};

export const createRecoveryCodes = (count = 10) =>
  Array.from({ length: count }, () =>
    crypto.randomBytes(5).toString("hex").toUpperCase()
  );

export const hashRecoveryCode = (code) =>
  hashToken(String(code || "").replace(/\s+/g, "").toUpperCase());
