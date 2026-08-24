export const escapeRegExp = (value = "") =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const buildSafeSearchRegex = (value, maxLength = 100) => {
  const normalized = String(value || "").trim().slice(0, maxLength);
  return normalized ? new RegExp(escapeRegExp(normalized), "i") : null;
};
