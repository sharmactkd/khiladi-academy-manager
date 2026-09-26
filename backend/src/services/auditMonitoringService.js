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

const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

export const persistAuditLog = async (payload, { attempts = 3 } = {}) => {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const result = await AuditLog.create(payload);
      recordAuditWriteSuccess();
      return result;
    } catch (error) {
      lastError = error;
      if (attempt < attempts) await wait(50 * (2 ** (attempt - 1)));
    }
  }
  recordAuditWriteFailure(lastError);
  throw lastError;
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
