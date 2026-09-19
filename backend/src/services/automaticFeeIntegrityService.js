import AuditLog from "../models/AuditLog.js";
import ExpenseTransaction from "../models/ExpenseTransaction.js";
import FeePayment from "../models/FeePayment.js";
import StudentMembership from "../models/StudentMembership.js";
import env from "../config/env.js";
import logger from "../utils/logger.js";
import { buildAutomaticFeeIntegrityPlan } from "../utils/feeIntegrity.js";

const running = new Map();

export const synchronizeFeeIntegrity = async ({ academyId = null } = {}) => {
  const scopeKey = academyId ? String(academyId) : "all";
  if (running.has(scopeKey)) return running.get(scopeKey);
  const operation = (async () => {
    const filter = academyId ? { academy: academyId } : {};
    const [payments, memberships, incomes] = await Promise.all([
      FeePayment.find(filter).lean(),
      StudentMembership.find(filter).lean(),
      ExpenseTransaction.find({ ...filter, sourceType: "fee_payment" }).lean(),
    ]);
    const plan = buildAutomaticFeeIntegrityPlan({ payments, memberships, incomes });

    if (plan.payments.length) {
      await FeePayment.bulkWrite(plan.payments.map(item => ({
        updateOne: {
          filter: { _id: item.paymentId, ...(academyId ? { academy: academyId } : {}) },
          update: { $set: item.truth },
        },
      })), { ordered: false });
    }
    if (plan.memberships.length) {
      await StudentMembership.bulkWrite(plan.memberships.map(item => ({
        updateOne: {
          filter: { _id: item.membershipId, ...(academyId ? { academy: academyId } : {}) },
          update: { $set: { feeStatus: item.expected } },
        },
      })), { ordered: false });
    }
    for (const item of plan.incomes) {
      if (item.type === "reverse") {
        await ExpenseTransaction.updateOne({ _id: item.incomeId, academy: item.academy }, { $set: { reversedAt: new Date(), reversalReason: item.reason } });
      } else if (item.type === "create") {
        await ExpenseTransaction.updateOne(
          { academy: item.academy, sourceType: "fee_payment", sourceId: item.paymentId },
          { $setOnInsert: item.values },
          { upsert: true },
        );
      } else {
        await ExpenseTransaction.updateOne({ _id: item.incomeId, academy: item.academy }, { $set: item.values });
      }
    }

    const byAcademy = new Map();
    const count = (academy, field) => {
      if (!academy) return;
      if (!byAcademy.has(academy)) byAcademy.set(academy, { paymentRecords: 0, membershipStatuses: 0, incomeRecords: 0, skipped: 0 });
      byAcademy.get(academy)[field] += 1;
    };
    plan.payments.forEach(item => count(item.academy, "paymentRecords"));
    plan.memberships.forEach(item => count(item.academy, "membershipStatuses"));
    plan.incomes.forEach(item => count(item.academy, "incomeRecords"));
    plan.skipped.forEach(item => count(item.academy, "skipped"));
    for (const [academy, summary] of byAcademy) {
      await AuditLog.create({ academy, action: "automatic_fee_integrity_sync", module: "fees", metadata: summary });
    }

    const summary = {
      paymentRecords: plan.payments.length,
      membershipStatuses: plan.memberships.length,
      incomeRecords: plan.incomes.length,
      skipped: plan.skipped.length,
    };
    if (Object.values(summary).some(Boolean)) logger.info(`Automatic fee integrity sync: ${JSON.stringify(summary)}`);
    return summary;
  })();
  running.set(scopeKey, operation);
  try { return await operation; }
  finally { running.delete(scopeKey); }
};

export const startAutomaticFeeIntegrityMonitor = () => {
  if (!env.FEE_INTEGRITY_SYNC_ENABLED) return null;
  const timer = setInterval(() => {
    void synchronizeFeeIntegrity().catch(error => logger.error(`Automatic fee integrity sync failed: ${error.message}`));
  }, env.FEE_INTEGRITY_SYNC_INTERVAL_MINUTES * 60 * 1000);
  timer.unref?.();
  return timer;
};

export const queueFeeIntegritySync = academyId => {
  if (!env.FEE_INTEGRITY_SYNC_ENABLED || !academyId) return;
  setImmediate(() => {
    void synchronizeFeeIntegrity({ academyId }).catch(error => logger.error(`Queued fee integrity sync failed: ${error.message}`));
  });
};
