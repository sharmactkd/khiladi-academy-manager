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
