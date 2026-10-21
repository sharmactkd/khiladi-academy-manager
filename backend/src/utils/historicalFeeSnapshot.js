// Return only the ledger state that existed before the register's month end.
// Fee-period labels alone cannot establish when money was actually received.
export const historicalFeeSnapshot = (payment, end) => {
  const cutoff = new Date(end).getTime();
  const time = value => value ? new Date(value).getTime() : 0;
  let state = payment;
  const laterCorrections = (payment.corrections || []).filter(item => time(item.correctedAt) >= cutoff)
    .sort((a, b) => time(a.correctedAt) - time(b.correctedAt));
  if (laterCorrections[0]?.previousState) state = laterCorrections[0].previousState;
  if (time(state.createdAt) >= cutoff) return null;
  if (state.status === "cancelled" && (!state.reversedAt || time(state.reversedAt) < cutoff)) return null;
  if (state.installments?.length) {
    const installments = state.installments.filter(item =>
      time(item.paymentDate) < cutoff && time(item.createdAt) < cutoff &&
      (!item.reversedAt || time(item.reversedAt) >= cutoff));
    if (!installments.length) return null;
    const latest = [...installments].sort((a, b) => time(b.paymentDate) - time(a.paymentDate))[0];
    const amountPaid = installments.reduce((sum, item) => sum + Number(item.amountPaid || 0), 0);
    const finalAmount = Math.max(0, Number(state.amount || 0) - Number(state.discount || 0));
    return { ...state, installments, amountPaid, finalAmount,
      pendingAmount: Math.max(0, finalAmount - amountPaid),
      paymentDate: latest.paymentDate, paidDate: amountPaid >= finalAmount ? latest.paymentDate : null,
      status: amountPaid >= finalAmount ? "paid" : amountPaid > 0 ? "partial" : "due" };
  }
  if (time(state.paidDate || state.paymentDate) >= cutoff) return null;
  return state;
};
