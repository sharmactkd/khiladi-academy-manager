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
  try {
    return new Intl.NumberFormat("en", {
      style: "currency",
      currency: code,
      maximumFractionDigits: 2,
    }).format(Number(value || 0));
  } catch {
    return `${source?.currencySymbol || getCurrencySymbol(code)}${Number(value || 0).toLocaleString("en")}`;
  }
};
