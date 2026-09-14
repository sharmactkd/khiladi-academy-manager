const text = (value) => String(value ?? "").trim().toLowerCase();

export const normalizeFeeStatus = (value, fallback = "due") => {
  const status = text(value);
  if (["paid", "partial", "due", "waived", "complimentary", "cancelled"].includes(status)) return status;
  if (["overdue", "pending", "unpaid"].includes(status)) return "due";
  return fallback;
};

export const formatFeeDueBalance = (months = 0, days = 0) => {
  const safeMonths = Math.max(0, Math.trunc(Number(months) || 0));
  const safeDays = Math.max(0, Math.trunc(Number(days) || 0));
  const parts = [safeMonths > 0 ? `${safeMonths}M` : "", safeDays > 0 ? `${safeDays}D` : ""].filter(Boolean);
  return parts.length ? `${parts.join(", ")} DUE` : "DUE";
};

export const resolveFeeStatus = ({
  membership = null,
  payableAmount = null,
  paidAmount = null,
  fallbackStatus = "due",
} = {}) => {
  const remainingDays = Math.max(0, Number(membership?.remainingTrainingDays || 0));
  const unpaidMonths = Math.max(0, Math.trunc(Number(membership?.unpaidMonths || 0)));
  const unpaidDays = Math.max(0, Math.trunc(Number(membership?.unpaidDays || 0)));
  const membershipStatus = normalizeFeeStatus(membership?.feeStatus, "");

  let code;
  let source;
  if (["waived", "complimentary"].includes(membershipStatus)) {
    code = membershipStatus;
    source = "membership";
  } else if (remainingDays > 0) {
    code = "paid";
    source = "remaining-days";
  } else if (unpaidMonths > 0 || unpaidDays > 0) {
    code = "due";
    source = "membership-balance";
  } else if (payableAmount !== null || paidAmount !== null) {
    const payable = Math.max(0, Number(payableAmount || 0));
    const paid = Math.max(0, Number(paidAmount || 0));
    code = payable === 0 || paid >= payable ? "paid" : paid > 0 ? "partial" : "due";
    source = "monthly-ledger";
  } else {
    code = normalizeFeeStatus(membershipStatus || fallbackStatus);
    source = "fallback";
  }

  return {
    code,
    label: code === "due" ? formatFeeDueBalance(unpaidMonths, unpaidDays)
      : code === "partial" ? "PARTIAL"
        : code === "waived" ? "FEE WAIVED"
          : code.toUpperCase(),
    unpaidMonths,
    unpaidDays,
    remainingDays,
    source,
    actionRequired: ["due", "partial"].includes(code),
  };
};
