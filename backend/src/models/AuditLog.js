import crypto from "crypto";
import mongoose from "mongoose";
import env from "../config/env.js";

export const auditIntegrityPayload = (log) => JSON.stringify({
  user: log.user ? String(log.user) : "",
  academy: log.academy ? String(log.academy) : "",
  action: log.action,
  module: log.module,
  ip: log.ip || "",
  userAgent: log.userAgent || "",
  metadata: log.metadata || {},
  createdAt: log.createdAt,
});

export const calculateAuditIntegrityHash = (log) => crypto
  .createHmac("sha256", env.AUDIT_LOG_SIGNING_KEY)
  .update(auditIntegrityPayload(log))
  .digest("hex");

export const verifyAuditIntegrityHash = (log) => {
  if (!log?.integrityHash || !log?.createdAt) return false;
  const expected = Buffer.from(calculateAuditIntegrityHash(log), "hex");
  const received = Buffer.from(String(log.integrityHash), "hex");
  return expected.length === received.length && crypto.timingSafeEqual(expected, received);
};

const auditLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },

    academy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Academy",
      default: null,
      index: true,
    },

    action: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    module: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    ip: {
      type: String,
      default: "",
      trim: true,
    },

    userAgent: {
      type: String,
      default: "",
      trim: true,
    },

    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    integrityHash: {
      type: String,
      select: false,
      immutable: true,
      default: "",
    },

    expiresAt: {
      type: Date,
      default: () =>
        new Date(Date.now() + env.AUDIT_LOG_RETENTION_DAYS * 86400000),
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

auditLogSchema.index({ user: 1, createdAt: -1 });
auditLogSchema.index({ academy: 1, createdAt: -1 });
auditLogSchema.index({ module: 1, action: 1 });
auditLogSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

auditLogSchema.pre("save", function () {
  if (this.integrityHash) return;
  if (!this.createdAt) this.createdAt = new Date();
  this.integrityHash = calculateAuditIntegrityHash(this);
});

const AuditLog = mongoose.model("AuditLog", auditLogSchema);

export default AuditLog;
