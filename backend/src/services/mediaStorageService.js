import crypto from "crypto";
import fs from "fs";
import path from "path";
import { v2 as cloudinary } from "cloudinary";

import env from "../config/env.js";

const PRIVATE_REFERENCE_PREFIX = "cloudinary-private:";
const ALLOWED_FORMATS = new Set(["jpg", "jpeg", "png", "webp"]);
const FIELD_CONFIG = {
  profilePhoto: { folder: "private/students", type: "authenticated" },
  certificateBackground: { folder: "private/certificate-templates", type: "authenticated" },
  logo: { folder: "public/academies", type: "upload" },
  frontBackground: { folder: "public/id-card-templates", type: "upload" },
  backBackground: { folder: "public/id-card-templates", type: "upload" },
};

if (env.CLOUDINARY_ENABLED) {
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

const fieldConfig = (fieldName = "") => {
  if (/^signature[0-5]$/.test(fieldName)) {
    return { folder: "private/signatures", type: "authenticated" };
  }
  const config = FIELD_CONFIG[fieldName];
  if (!config) throw new Error("Unsupported upload field");
  return config;
};

const validatePublicId = (value) =>
  /^[a-zA-Z0-9/_-]{1,300}$/.test(String(value || ""));

export const createPrivateCloudinaryReference = ({ publicId, version, format }) => {
  if (!validatePublicId(publicId)) throw new Error("Invalid Cloudinary public ID");
  if (!Number.isInteger(Number(version)) || Number(version) < 1) {
    throw new Error("Invalid Cloudinary asset version");
  }
  const normalizedFormat = String(format || "").toLowerCase();
  if (!ALLOWED_FORMATS.has(normalizedFormat)) throw new Error("Invalid Cloudinary format");

  const payload = Buffer.from(
    JSON.stringify({ p: publicId, v: Number(version), f: normalizedFormat }),
    "utf8"
  ).toString("base64url");
  return `${PRIVATE_REFERENCE_PREFIX}${payload}`;
};

export const parsePrivateCloudinaryReference = (value) => {
  const reference = String(value || "");
  if (!reference.startsWith(PRIVATE_REFERENCE_PREFIX)) return null;
  try {
    const parsed = JSON.parse(
      Buffer.from(reference.slice(PRIVATE_REFERENCE_PREFIX.length), "base64url").toString("utf8")
    );
    if (!validatePublicId(parsed?.p)) return null;
    if (!Number.isInteger(Number(parsed?.v)) || Number(parsed.v) < 1) return null;
    if (!ALLOWED_FORMATS.has(String(parsed?.f || "").toLowerCase())) return null;
    return { publicId: parsed.p, version: Number(parsed.v), format: parsed.f };
  } catch {
    return null;
  }
};

export const getPrivateCloudinaryDownloadUrl = (reference, expiresAt) => {
  const asset = parsePrivateCloudinaryReference(reference);
  if (!asset || !env.CLOUDINARY_ENABLED) return "";
  return cloudinary.utils.private_download_url(asset.publicId, asset.format, {
    resource_type: "image",
    type: "authenticated",
    expires_at: expiresAt,
  });
};

export const verifyMediaStorageConnection = async () => {
  if (!env.CLOUDINARY_ENABLED) {
    return { enabled: false, provider: "local" };
  }
  const result = await cloudinary.api.ping();
  return { enabled: true, provider: "cloudinary", status: result?.status || "ok" };
};

const uploadStream = (buffer, options) =>
  new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(options, (error, result) => (error ? reject(error) : resolve(result)))
      .end(buffer);
  });

export const storeImage = async ({ buffer, fieldName, localDestination, extension }) => {
  if (!env.CLOUDINARY_ENABLED) {
    await fs.promises.mkdir(localDestination, { recursive: true, mode: 0o750 });
    const filename = `${crypto.randomUUID()}${extension}`;
    const filePath = path.join(localDestination, filename);
    await fs.promises.writeFile(filePath, buffer, { flag: "wx", mode: 0o640 });
    return { reference: `/${filePath.replace(/\\/g, "/")}`, localPath: filePath, filename, storage: "local" };
  }

  if (!/^[a-zA-Z0-9/_-]+$/.test(env.CLOUDINARY_ROOT_FOLDER)) {
    throw new Error("CLOUDINARY_ROOT_FOLDER contains unsupported characters");
  }
  const config = fieldConfig(fieldName);
  const publicId = `${env.CLOUDINARY_ROOT_FOLDER}/${config.folder}/${crypto.randomUUID()}`;
  const result = await uploadStream(buffer, {
    public_id: publicId,
    resource_type: "image",
    type: config.type,
    overwrite: false,
    format: "webp",
    transformation: [{ width: 1600, height: 1600, crop: "limit", quality: "auto:good" }],
    tags: ["khiladi-academy-manager"],
  });
  const reference = config.type === "authenticated"
    ? createPrivateCloudinaryReference({ publicId: result.public_id, version: result.version, format: result.format })
    : result.secure_url;
  return { reference, filename: result.public_id, publicId: result.public_id, type: config.type, storage: "cloudinary" };
};

export const removeStoredUpload = async (stored) => {
  if (stored?.storage === "local" && stored.localPath) {
    await fs.promises.unlink(stored.localPath).catch((error) => {
      if (error?.code !== "ENOENT") throw error;
    });
  } else if (stored?.storage === "cloudinary" && stored.publicId) {
    await cloudinary.uploader.destroy(stored.publicId, {
      resource_type: "image",
      type: stored.type || "upload",
      invalidate: true,
    });
  }
};

export const uploadedFileReference = (file) => {
  if (!file) return "";
  if (file.storageReference) return file.storageReference;
  if (/^(?:https?:\/\/|cloudinary-private:)/i.test(String(file.path || ""))) return String(file.path);
  return `/${String(file.path || "").replace(/\\/g, "/").replace(/^\/+/, "")}`;
};
