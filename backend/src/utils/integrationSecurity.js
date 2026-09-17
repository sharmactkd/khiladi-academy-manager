import crypto from "crypto";
import env from "../config/env.js";

const deriveKey = (value) => crypto.createHash("sha256").update(String(value)).digest();
const parsePrevious = () => {
  try { return JSON.parse(env.INTEGRATION_ENCRYPTION_PREVIOUS_KEYS || "{}"); }
  catch { throw new Error("INTEGRATION_ENCRYPTION_PREVIOUS_KEYS must be a JSON object"); }
};
const primaryId = String(env.INTEGRATION_ENCRYPTION_KEY_ID || "primary").replace(/[^a-zA-Z0-9_-]/g, "");
const previous = parsePrevious();
const keys = Object.fromEntries(Object.entries({ ...previous, [primaryId]: env.INTEGRATION_ENCRYPTION_KEY }).map(([id, value]) => [id, deriveKey(value)]));
const legacyKeys = [deriveKey(env.INTEGRATION_ENCRYPTION_KEY), ...Object.values(previous).map(deriveKey)];

export const encryptIntegrationSecret = (value) => {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", keys[primaryId], iv);
  const encrypted = Buffer.concat([
    cipher.update(String(value), "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return ["v2", primaryId, iv, tag, encrypted].map((item) => Buffer.isBuffer(item) ? item.toString("base64url") : item).join(".");
};

export const decryptIntegrationSecret = (value) => {
  const parts = String(value || "").split(".");
  const versioned = parts[0] === "v2";
  const [, keyId, versionedIv, versionedTag, versionedEncrypted] = parts;
  const [legacyIv, legacyTag, legacyEncrypted] = parts;
  const ivValue = versioned ? versionedIv : legacyIv;
  const tagValue = versioned ? versionedTag : legacyTag;
  const encryptedValue = versioned ? versionedEncrypted : legacyEncrypted;
  if (!ivValue || !tagValue || !encryptedValue) {
    throw new Error("Integration credentials must be regenerated");
  }
  const candidates = versioned ? [keys[keyId]].filter(Boolean) : legacyKeys;
  for (const key of candidates) {
    try {
      const decipher = crypto.createDecipheriv("aes-256-gcm", key, Buffer.from(ivValue, "base64url"));
      decipher.setAuthTag(Buffer.from(tagValue, "base64url"));
      return Buffer.concat([decipher.update(Buffer.from(encryptedValue, "base64url")), decipher.final()]).toString("utf8");
    } catch { /* try next key */ }
  }
  throw new Error("Integration credentials must be regenerated");
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
