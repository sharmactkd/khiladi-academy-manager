export const derivePaymentTruth = payment => {
  const amount = Math.max(0, Number(payment.amount || 0));
  const discount = Math.max(0, Number(payment.discount || 0));
  const finalAmount = Math.max(0, amount - discount);
  const activeInstallments = Array.isArray(payment.installments)
    ? payment.installments.filter(item => !item.reversedAt)
    : [];
  const amountPaid = activeInstallments.length
    ? activeInstallments.reduce((sum, item) => sum + Number(item.amountPaid || 0), 0)
    : Math.max(0, Number(payment.amountPaid || 0));
  const pendingAmount = Math.max(0, finalAmount - amountPaid);
  const status = payment.status === "cancelled" ? "cancelled"
    : finalAmount === 0 || amountPaid >= finalAmount ? "paid"
      : amountPaid > 0 ? "partial" : "due";
  return { finalAmount, amountPaid, pendingAmount, status };
};

export const paymentHasMismatch = (payment, truth = derivePaymentTruth(payment)) =>
  Math.abs(Number(payment.finalAmount || 0) - truth.finalAmount) > 0.01 ||
  Math.abs(Number(payment.amountPaid || 0) - truth.amountPaid) > 0.01 ||
  Math.abs(Number(payment.pendingAmount || 0) - truth.pendingAmount) > 0.01 ||
  String(payment.status || "") !== truth.status;

export const expectedMembershipFeeStatus = membership => {
  if (["waived", "complimentary"].includes(membership?.feeStatus)) return membership.feeStatus;
  if (Number(membership?.remainingTrainingDays || 0) > 0) return "paid";
  if (Number(membership?.unpaidMonths || 0) > 0 || Number(membership?.unpaidDays || 0) > 0) return "due";
  return null;
};

const key = value => String(value?._id || value || "");

export const buildAutomaticFeeIntegrityPlan = ({ payments = [], memberships = [], incomes = [] } = {}) => {
  const incomeMap = new Map(incomes.map(income => [key(income.sourceId), income]));
  const plan = { payments: [], memberships: [], incomes: [], skipped: [] };
  for (const payment of payments) {
    const truth = derivePaymentTruth(payment);
    if (paymentHasMismatch(payment, truth)) plan.payments.push({ paymentId: key(payment), academy: key(payment.academy), truth });
    const income = incomeMap.get(key(payment));
    if (payment.status === "cancelled") {
      if (income && !income.reversedAt) plan.incomes.push({ type: "reverse", paymentId: key(payment), incomeId: key(income), academy: key(payment.academy), reason: payment.reversalReason || "Fee payment cancelled" });
      continue;
    }
    if (truth.amountPaid <= 0) continue;
    const values = {
      academy: payment.academy, branch: payment.branch || null, type: "income", category: "Student Fee", amount: truth.amountPaid,
      account: payment.paymentMode === "online" ? "upi" : payment.paymentMode === "cash" ? "cash" : "other",
      date: payment.paidDate || payment.paymentDate || payment.createdAt || new Date(),
      description: `Fee payment ${payment.receiptNumber || ""}`.trim(), sourceType: "fee_payment", sourceId: payment._id,
      reversedAt: null, reversalReason: "",
    };
    if (!income) {
      const createdBy = payment.collectedBy || payment.updatedBy || payment.installments?.find(item => item.collectedBy)?.collectedBy;
      if (createdBy) plan.incomes.push({ type: "create", paymentId: key(payment), academy: key(payment.academy), values: { ...values, createdBy } });
      else plan.skipped.push({ type: "missing_income_actor", paymentId: key(payment), academy: key(payment.academy) });
    } else if (Math.abs(Number(income.amount || 0) - truth.amountPaid) > 0.01 || income.reversedAt) {
      plan.incomes.push({ type: "update", paymentId: key(payment), incomeId: key(income), academy: key(payment.academy), values });
    }
  }
  for (const membership of memberships) {
    const expected = expectedMembershipFeeStatus(membership);
    if (expected && membership.feeStatus !== expected) plan.memberships.push({ membershipId: key(membership), academy: key(membership.academy), current: membership.feeStatus, expected });
  }
  return plan;
};
