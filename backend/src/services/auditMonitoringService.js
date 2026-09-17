import AuditLog, { verifyAuditIntegrityHash } from "../models/AuditLog.js";
import logger from "../utils/logger.js";

const state = { writesSucceeded: 0, writesFailed: 0, lastFailureAt: null, lastFailure: "", lastIntegrityCheckAt: null, invalidHashes: 0 };

export const recordAuditWriteSuccess = () => { state.writesSucceeded += 1; };
export const recordAuditWriteFailure = (error) => {
  state.writesFailed += 1;
  state.lastFailureAt = new Date();
  state.lastFailure = String(error?.message || error || "Unknown audit failure").slice(0, 300);
  logger.error(`SECURITY_ALERT audit persistence failed: ${state.lastFailure}`);
};

export const verifyRecentAuditIntegrity = async ({ limit = 1000 } = {}) => {
  const logs = await AuditLog.find().select("+integrityHash").sort({ createdAt: -1 }).limit(limit).lean();
  const invalid = logs.filter((log) => !verifyAuditIntegrityHash(log));
  state.lastIntegrityCheckAt = new Date();
  state.invalidHashes = invalid.length;
  if (invalid.length) logger.error(`SECURITY_ALERT ${invalid.length} audit log integrity checks failed`);
  return { checked: logs.length, invalid: invalid.length, checkedAt: state.lastIntegrityCheckAt };
};

export const auditMonitoringSnapshot = () => ({ ...state });

export const startAuditIntegrityMonitor = () => {
  const timer = setInterval(() => {
    void verifyRecentAuditIntegrity().catch(recordAuditWriteFailure);
  }, 15 * 60 * 1000);
  timer.unref?.();
  return timer;
};
