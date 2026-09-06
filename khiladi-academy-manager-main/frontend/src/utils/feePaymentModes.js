export const PAYMENT_MODE_OPTIONS = [
  { value: "cash", label: "Cash" },
  { value: "online", label: "Online" },
  { value: "cash_online", label: "Cash + Online" },
];

export const formatPaymentMode = (value, fallback = "-") => {
  const normalized = String(value || "").trim().toLowerCase();
  if (!normalized) return fallback;

  const option = PAYMENT_MODE_OPTIONS.find((item) => item.value === normalized);
  if (option) return option.label;

  return normalized
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
};
