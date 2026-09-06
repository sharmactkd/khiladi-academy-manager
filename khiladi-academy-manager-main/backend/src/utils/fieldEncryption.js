import crypto from "crypto";
import env from "../config/env.js";

const key = crypto.createHash("sha256").update(env.DATA_ENCRYPTION_KEY).digest();

export const encryptSensitiveValue = (rawValue) => {
  const value = String(rawValue || "");
  if (!value || value.startsWith("v1.")) return value;
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  return `v1.${iv.toString("base64url")}.${cipher.getAuthTag().toString("base64url")}.${encrypted.toString("base64url")}`;
};

export const decryptSensitiveValue = (storedValue) => {
  const value = String(storedValue || "");
  if (!value.startsWith("v1.")) return value;
  try {
    const [, iv, tag, encrypted] = value.split(".");
    const decipher = crypto.createDecipheriv("aes-256-gcm", key, Buffer.from(iv, "base64url"));
    decipher.setAuthTag(Buffer.from(tag, "base64url"));
    return Buffer.concat([
      decipher.update(Buffer.from(encrypted, "base64url")),
      decipher.final(),
    ]).toString("utf8");
  } catch {
    return "";
  }
};

export const hashSensitiveValue = (value) =>
  crypto.createHmac("sha256", key).update(String(value || "")).digest("hex");
