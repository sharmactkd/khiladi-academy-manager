export const getCurrencySymbol = (currencyCode = "INR") => {
  const code = String(currencyCode || "INR").trim().toUpperCase();
  try {
    return new Intl.NumberFormat("en", {
      style: "currency",
      currency: code,
      currencyDisplay: "narrowSymbol",
    }).formatToParts(0).find((part) => part.type === "currency")?.value || code;
  } catch {
    return code;
  }
};

export const formatCurrencyAmount = (value, source = {}) => {
  const code = String(source?.currencyCode || source?.currency || "INR").trim().toUpperCase();
  const symbol = String(source?.currencySymbol || getCurrencySymbol(code)).trim() || code;
  const amount = Number(value || 0);

  try {
    const formattedAmount = new Intl.NumberFormat("en", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(Number.isFinite(amount) ? amount : 0);

    return `${symbol}${formattedAmount}`;
  } catch {
    return `${symbol}${Number.isFinite(amount) ? amount : 0}`;
  }
};
