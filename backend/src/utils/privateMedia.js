import crypto from "crypto";
import path from "path";
import env from "../config/env.js";
import { parsePrivateCloudinaryReference } from "../services/mediaStorageService.js";

const PRIVATE_PREFIXES = [
  "private-uploads/students/",
  "private-uploads/signatures/",
  "private-uploads/certificate-templates/",
  "uploads/students/",
  "uploads/certificate-templates/",
];

const normalizeMediaPath = (value) =>
  String(value || "")
    .replace(/\\/g, "/")
    .replace(/^https?:\/\/[^/]+/i, "")
    .replace(/^\/+/, "");

export const isPrivateMediaPath = (value) => {
  const normalized = normalizeMediaPath(value);
  return Boolean(parsePrivateCloudinaryReference(normalized)) ||
    PRIVATE_PREFIXES.some((prefix) => normalized.startsWith(prefix));
};

export const assertPrivateMediaPath = (value) => {
  const normalized = normalizeMediaPath(value);
  if (!isPrivateMediaPath(normalized)) throw new Error("Private media path is not allowed");

  if (parsePrivateCloudinaryReference(normalized)) return normalized;

  const basename = path.posix.basename(normalized);
  if (!/^[0-9a-f-]{36}\.(?:jpg|png|webp)$/i.test(basename)) {
    throw new Error("Invalid private media filename");
  }
  if (path.posix.normalize(normalized) !== normalized || normalized.includes("..")) {
    throw new Error("Invalid private media path");
  }
  return normalized;
};

const signatureFor = ({ encodedPath, expires, scope }) =>
  crypto
    .createHmac("sha256", env.PRIVATE_MEDIA_SIGNING_KEY)
    .update(`${encodedPath}.${expires}.${scope}`)
    .digest("base64url");

const createScope = ({ viewerId = "", academyId = "", ip = "" } = {}) => Buffer.from(JSON.stringify({
  viewerId: String(viewerId),
  academyId: String(academyId),
  ipHash: crypto.createHash("sha256").update(String(ip)).digest("base64url").slice(0, 18),
}), "utf8").toString("base64url");

export const createSignedPrivateMediaUrl = (value, context = {}) => {
  const normalized = assertPrivateMediaPath(value);
  const encodedPath = Buffer.from(normalized, "utf8").toString("base64url");
  const expires = Math.floor(Date.now() / 1000) + env.PRIVATE_MEDIA_URL_TTL_SECONDS;
  const scope = createScope(context);
  const signature = signatureFor({ encodedPath, expires, scope });
  return `/api/media/private/${encodedPath}?expires=${expires}&scope=${scope}&signature=${signature}`;
};

export const verifySignedPrivateMediaRequest = ({ encodedPath, expires, signature, scope, ip }) => {
  const expiry = Number(expires);
  const now = Math.floor(Date.now() / 1000);
  if (!encodedPath || !Number.isInteger(expiry) || expiry < now) return null;
  if (expiry > now + env.PRIVATE_MEDIA_URL_TTL_SECONDS + 30) return null;

  if (!scope) return null;
  const expected = Buffer.from(signatureFor({ encodedPath, expires: expiry, scope }), "base64url");
  const received = Buffer.from(String(signature || ""), "base64url");
  if (expected.length !== received.length || !crypto.timingSafeEqual(expected, received)) return null;

  try {
    const claims = JSON.parse(Buffer.from(scope, "base64url").toString("utf8"));
    const ipHash = crypto.createHash("sha256").update(String(ip || "")).digest("base64url").slice(0, 18);
    if (claims.ipHash !== ipHash) return null;
    return { mediaPath: assertPrivateMediaPath(Buffer.from(encodedPath, "base64url").toString("utf8")), claims };
  } catch {
    return null;
  }
};

export const signPrivateMediaReferences = (value, seen = new WeakSet(), context = {}) => {
  if (typeof value === "string") {
    return isPrivateMediaPath(value) ? createSignedPrivateMediaUrl(value, context) : value;
  }
  if (!value || typeof value !== "object" || value instanceof Date || Buffer.isBuffer(value)) return value;

  // ObjectIds are scalar references, not traversable records. Handle them
  // before cycle detection so a repeated id is consistently returned as a
  // string everywhere in the response.
  if (value?._bsontype === "ObjectId" || value?.constructor?.name === "ObjectId") {
    return value.toString();
  }

  if (seen.has(value)) return value;
  seen.add(value);

  if (Array.isArray(value)) return value.map((item) => signPrivateMediaReferences(item, seen, context));
  const source = typeof value.toJSON === "function" ? value.toJSON() : value;

  // Mongoose ObjectIds serialize to their 24-character hexadecimal string.
  // Treat that result as a scalar. Recursing with Object.entries("abc") would
  // otherwise turn it into { 0: "a", 1: "b", 2: "c" }, corrupting every
  // populated/reference id returned by the API.
  if (typeof source === "string") {
    return isPrivateMediaPath(source) ? createSignedPrivateMediaUrl(source, context) : source;
  }
  if (!source || typeof source !== "object" || source instanceof Date || Buffer.isBuffer(source)) {
    return source;
  }

  return Object.fromEntries(
    Object.entries(source).map(([key, item]) => [key, signPrivateMediaReferences(item, seen, context)])
  );
};
