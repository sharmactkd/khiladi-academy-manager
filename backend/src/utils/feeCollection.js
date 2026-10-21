// All arithmetic is in paise/cents. Monthly allocations always sum to the
// submitted collection, including the rounding remainder.
export const cents = value => {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount < 0) throw new Error("Enter a valid non-negative amount");
  return Math.round(amount * 100);
};

export const splitCents = (total, weights) => {
  const sum = weights.reduce((a, b) => a + b, 0);
  const effective = sum > 0 ? weights : weights.map(() => 1);
  const denominator = sum || weights.length;
  if (!weights.length) return [];
  const parts = effective.map(weight => Math.floor(total * weight / denominator));
  const order = effective.map((weight, index) => ({ index, remainder: (total * weight) % denominator }))
    .sort((a, b) => b.remainder - a.remainder || a.index - b.index);
  const remaining = total - parts.reduce((a, b) => a + b, 0);
  for (let i = 0; i < remaining; i += 1) parts[order[i].index] += 1;
  return parts;
};

export const allocateFeeCollection = payload => {
  const count = Number(payload.numberOfMonths || 1);
  if (!Number.isInteger(count) || count < 1 || count > 24) throw new Error("Select 1 to 24 months");
  const amount = cents(payload.amount), discount = cents(payload.discount || 0);
  const paid = cents(payload.amountPaid ?? ((amount - discount) / 100));
  if (discount > amount) throw new Error("Discount cannot exceed the total fee");
  if (paid > amount - discount) throw new Error("Payment exceeds the selected months' payable fee. Select more months for an advance payment.");
  let month = Number(payload.feeMonth || payload.month), year = Number(payload.feeYear || payload.year);
  if (!Number.isInteger(month) || month < 1 || month > 12 || !Number.isInteger(year) || year < 2020 || year > 2100) throw new Error("Select a valid fee month and year");
  const gross = splitCents(amount, Array(count).fill(1));
  const discounts = splitCents(discount, gross);
  const payments = splitCents(paid, gross.map((part, i) => part - discounts[i]));
  const mode = payload.paymentMode || "cash";
  if (!["cash", "online", "cash_online"].includes(mode)) throw new Error("Select a valid payment mode");
  const cash = mode === "cash" ? paid : mode === "online" ? 0 : cents(payload.cashAmount || 0);
  const online = mode === "online" ? paid : mode === "cash" ? 0 : cents(payload.onlineAmount || 0);
  if (cash + online !== paid || (mode === "cash_online" && (!cash || !online))) throw new Error("Cash and online amounts must match the total paid");
  const cashParts = splitCents(cash, payments);
  return gross.map((part, index) => {
    const date = new Date(Date.UTC(year, month - 1 + index, 1));
    const cashPart = cashParts[index], onlinePart = payments[index] - cashPart;
    return { ...payload, feeMonth: date.getUTCMonth() + 1, feeYear: date.getUTCFullYear(),
      amount: part / 100, discount: discounts[index] / 100, amountPaid: payments[index] / 100,
      cashAmount: cashPart / 100, onlineAmount: onlinePart / 100,
      paymentMode: cashPart && onlinePart ? "cash_online" : onlinePart ? "online" : "cash" };
  });
};

// Editing the monthly total must not add that total to earlier installments.
// Allocate a correction across existing installments, preserving their IDs,
// receipt links and idempotency keys. The audit snapshot retains old values.
export const correctPaymentInstallments = (payment, payload) => {
  const active = (payment.installments || []).filter(item => !item.reversedAt);
  const has = key => Object.prototype.hasOwnProperty.call(payload, key);
  const paid = cents(has("amountPaid") ? payload.amountPaid : payment.amountPaid);
  const mode = payload.paymentMode || payment.paymentMode;
  if (has("amountPaid") || has("paymentMode") || has("cashAmount") || has("onlineAmount")) {
    const cash = mode === "cash" ? paid : mode === "online" ? 0 : cents(payload.cashAmount ?? payment.cashAmount);
    const online = mode === "online" ? paid : mode === "cash" ? 0 : cents(payload.onlineAmount ?? payment.onlineAmount);
    if (cash + online !== paid || (mode === "cash_online" && (!cash || !online))) throw new Error("Cash and online amounts must match the corrected total");
    const parts = splitCents(paid, active.map(item => cents(item.amountPaid)));
    const cashParts = splitCents(cash, parts);
    active.forEach((item, i) => {
      item.amountPaid = parts[i] / 100;
      item.cashAmount = cashParts[i] / 100;
      item.onlineAmount = (parts[i] - cashParts[i]) / 100;
      item.paymentMode = item.cashAmount && item.onlineAmount ? "cash_online" : item.onlineAmount ? "online" : "cash";
    });
    payment.amountPaid = paid / 100;
    payment.cashAmount = cash / 100;
    payment.onlineAmount = online / 100;
    payment.paymentMode = mode;
  }
  if (has("paymentDate")) active.forEach(item => { item.paymentDate = payload.paymentDate; });
};
