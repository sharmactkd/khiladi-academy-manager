export const billingResultState = value =>
  value && typeof value === "object" && !Array.isArray(value) ? value : {};
export const hasPaymentConfirmation = value => {
  const state = billingResultState(value);
  return Boolean(state.subscription || state.invoice || state.payment || state.entitlement);
};
