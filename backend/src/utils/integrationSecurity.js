import crypto from "crypto";
import env from "../config/env.js";

const encryptionKey = crypto
  .createHash("sha256")
  .update(env.INTEGRATION_ENCRYPTION_KEY)
  .digest();

export const encryptIntegrationSecret = (value) => {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", encryptionKey, iv);
  const encrypted = Buffer.concat([
    cipher.update(String(value), "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return [iv, tag, encrypted].map((item) => item.toString("base64url")).join(".");
};

export const decryptIntegrationSecret = (value) => {
  const [ivValue, tagValue, encryptedValue] = String(value || "").split(".");
  if (!ivValue || !tagValue || !encryptedValue) {
    throw new Error("Integration credentials must be regenerated");
  }
  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    encryptionKey,
    Buffer.from(ivValue, "base64url")
  );
  decipher.setAuthTag(Buffer.from(tagValue, "base64url"));
  return Buffer.concat([
    decipher.update(Buffer.from(encryptedValue, "base64url")),
    decipher.final(),
  ]).toString("utf8");
};

export const assertAllowedTournamentApiUrl = (rawUrl) => {
  let parsed;
  try {
    parsed = new URL(String(rawUrl || "").trim());
  } catch {
    throw new Error("Invalid tournament API URL");
  }

  if (!env.TOURNAMENT_API_ALLOWED_ORIGINS.includes(parsed.origin)) {
    throw new Error("Tournament API origin is not allowed");
  }

  if (env.isProduction && parsed.protocol !== "https:") {
    throw new Error("Tournament API must use HTTPS in production");
  }

  if (parsed.username || parsed.password) {
    throw new Error("Tournament API URL must not contain credentials");
  }

  return parsed.href.replace(/\/+$/, "");
};
