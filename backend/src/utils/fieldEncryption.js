import crypto from "crypto";
import env from "../config/env.js";

const deriveKey = (secret) => crypto.createHash("sha256").update(String(secret)).digest();
const parsePreviousKeys = (raw) => {
  try {
    const value = JSON.parse(raw || "{}");
    return value && typeof value === "object" && !Array.isArray(value) ? value : {};
  } catch {
    throw new Error("DATA_ENCRYPTION_PREVIOUS_KEYS must be a JSON object");
  }
};
const primaryId = String(env.DATA_ENCRYPTION_KEY_ID || "primary").replace(/[^a-zA-Z0-9_-]/g, "");
const secrets = { ...parsePreviousKeys(env.DATA_ENCRYPTION_PREVIOUS_KEYS), [primaryId]: env.DATA_ENCRYPTION_KEY };
const keys = Object.fromEntries(Object.entries(secrets).map(([id, secret]) => [id, deriveKey(secret)]));
const legacyKeys = [deriveKey(env.DATA_ENCRYPTION_KEY), ...Object.values(parsePreviousKeys(env.DATA_ENCRYPTION_PREVIOUS_KEYS)).map(deriveKey)];

const decryptWithKey = ({ iv, tag, encrypted, key }) => {
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, Buffer.from(iv, "base64url"));
  decipher.setAuthTag(Buffer.from(tag, "base64url"));
  return Buffer.concat([decipher.update(Buffer.from(encrypted, "base64url")), decipher.final()]).toString("utf8");
};

export const encryptSensitiveValue = (rawValue) => {
  const value = String(rawValue || "");
  if (!value || /^v[12]\./.test(value)) return value;
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", keys[primaryId], iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  return `v2.${primaryId}.${iv.toString("base64url")}.${cipher.getAuthTag().toString("base64url")}.${encrypted.toString("base64url")}`;
};

export const decryptSensitiveValue = (storedValue) => {
  const value = String(storedValue || "");
  if (!/^v[12]\./.test(value)) return value;
  try {
    const parts = value.split(".");
    if (parts[0] === "v2") {
      const [, keyId, iv, tag, encrypted] = parts;
      if (!keys[keyId]) throw new Error("Unknown encryption key");
      return decryptWithKey({ iv, tag, encrypted, key: keys[keyId] });
    }
    const [, iv, tag, encrypted] = parts;
    for (const candidate of legacyKeys) {
      try { return decryptWithKey({ iv, tag, encrypted, key: candidate }); } catch { /* try next key */ }
    }
    throw new Error("No legacy key matched");
  } catch {
    return "";
  }
};

export const hashSensitiveValue = (value) =>
  crypto.createHmac("sha256", deriveKey(env.DATA_HASH_KEY)).update(String(value || "")).digest("hex");

export const getSensitiveValueKeyId = (value) => String(value || "").startsWith("v2.")
  ? String(value).split(".")[1]
  : String(value || "").startsWith("v1.") ? "legacy" : "plaintext";
