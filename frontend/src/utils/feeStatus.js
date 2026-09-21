const text = (value) => String(value ?? "").trim();

export const normalizeFeeStatus = (value, fallback = "due") => {
  const status = text(value).toLowerCase();
  if (["paid", "partial", "due", "waived", "complimentary", "cancelled"].includes(status)) return status;
  if (["overdue", "pending", "unpaid"].includes(status)) return "due";
  return fallback;
};

export const formatFeeDueBalance = (months = 0, days = 0) => {
  const safeMonths = Math.max(0, Math.trunc(Number(months) || 0));
  const safeDays = Math.max(0, Math.trunc(Number(days) || 0));
  if (safeMonths === 1 && safeDays === 0) return "DUE";
  const parts = [safeMonths ? `${safeMonths}M` : "", safeDays ? `${safeDays}D` : ""].filter(Boolean);
  return parts.length ? `${parts.join(", ")} DUE` : "DUE";
};

export const compactAttendanceDueLabel = (value) => {
  const label = text(value).toUpperCase();
  return /^1M(?:,\s*0D)?\s+DUE$/.test(label) ? "DUE" : label;
};

export const getCanonicalFeeDisplay = (row = {}) => {
  const linked = row.rowType === "student" && Boolean(row.studentId);
  if (!linked) {
    const imported = text(row.importedFeeStatus || row.feeStatus || "-").toUpperCase();
    return imported.replace(/OVERDUE/g, "DUE").replace(/PENDING/g, "DUE");
  }
  if (row.feeStatusSummary?.label) return compactAttendanceDueLabel(row.feeStatusSummary.label);
  const imported = text(row.importedFeeStatus);
  if (!row.membership?.lastAdjustedAt && imported && !["-", "—"].includes(imported)) {
    return imported.toUpperCase().replace(/OVERDUE/g, "DUE").replace(/PENDING/g, "DUE");
  }
  const membership = row.membership || {};
  const status = normalizeFeeStatus(row.feeStatus || membership.feeStatus);
  if (["waived", "complimentary"].includes(status)) return status === "waived" ? "FEE WAIVED" : "COMPLIMENTARY";
  if (Number(membership.remainingTrainingDays || 0) > 0) return "PAID";
  const months = Number(membership.unpaidMonths || 0);
  const days = Number(membership.unpaidDays || 0);
  if (months > 0 || days > 0) return formatFeeDueBalance(months, days);
  return status.toUpperCase();
};
