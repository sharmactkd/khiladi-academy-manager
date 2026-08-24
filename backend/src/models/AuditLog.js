import crypto from "crypto";
import mongoose from "mongoose";
import env from "../config/env.js";

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
  const payload = JSON.stringify({
    user: this.user ? String(this.user) : "",
    academy: this.academy ? String(this.academy) : "",
    action: this.action,
    module: this.module,
    ip: this.ip,
    userAgent: this.userAgent,
    metadata: this.metadata,
    createdAt: this.createdAt || new Date(),
  });
  this.integrityHash = crypto
    .createHmac("sha256", env.AUDIT_LOG_SIGNING_KEY)
    .update(payload)
    .digest("hex");
});

const AuditLog = mongoose.model("AuditLog", auditLogSchema);

export default AuditLog;
