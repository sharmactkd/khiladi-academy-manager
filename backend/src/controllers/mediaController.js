import fs from "fs";
import path from "path";
import asyncHandler from "../utils/asyncHandler.js";
import AuditLog from "../models/AuditLog.js";
import { errorResponse } from "../utils/apiResponse.js";
import { verifySignedPrivateMediaRequest } from "../utils/privateMedia.js";

const MIME_TYPES = { ".jpg": "image/jpeg", ".png": "image/png", ".webp": "image/webp" };

export const servePrivateMedia = asyncHandler(async (req, res) => {
  const mediaPath = verifySignedPrivateMediaRequest({
    encodedPath: req.params.encodedPath,
    expires: req.query.expires,
    signature: req.query.signature,
  });
  if (!mediaPath) return errorResponse(res, "Private media link is invalid or expired", 403);

  const absolutePath = path.resolve(process.cwd(), mediaPath);
  const allowedRoots = [
    path.resolve(process.cwd(), "private-uploads"),
    path.resolve(process.cwd(), "uploads/students"),
    path.resolve(process.cwd(), "uploads/certificate-templates"),
  ];
  if (!allowedRoots.some((root) => absolutePath.startsWith(`${root}${path.sep}`))) {
    return errorResponse(res, "Private media path is not allowed", 403);
  }

  try {
    await fs.promises.access(absolutePath, fs.constants.R_OK);
  } catch {
    return errorResponse(res, "Private media not found", 404);
  }

  res.setHeader("Content-Type", MIME_TYPES[path.extname(absolutePath).toLowerCase()] || "application/octet-stream");
  res.setHeader("Cache-Control", "private, max-age=60, no-transform");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Content-Disposition", `inline; filename="${path.basename(absolutePath)}"`);

  void AuditLog.create({
    action: "PRIVATE_MEDIA_VIEWED",
    module: "media",
    ip: req.ip || "",
    userAgent: req.get("user-agent") || "",
    metadata: { category: mediaPath.split("/").slice(0, -1).join("/") },
  }).catch(() => {});
  return res.sendFile(absolutePath);
});
