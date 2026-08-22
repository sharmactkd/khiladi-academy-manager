export const unwrapList = (response) => {
  const candidates = [response?.data?.data, response?.data, response];
  return candidates.find(Array.isArray) || [];
};

export const joinAddressParts = (parts = []) => {
  const values = [];
  parts.forEach((part) => {
    const value = String(part ?? "").trim();
    if (value && !values.some((item) => item.toLowerCase() === value.toLowerCase())) values.push(value);
  });
  return values.join(", ");
};

export const normalizeList = (value) => {
  if (Array.isArray(value)) return [...new Set(value.flatMap(normalizeList))];
  if (typeof value !== "string") return [];
  const text = value.trim();
  if (!text) return [];
  try { return normalizeList(JSON.parse(text)); }
  catch { return text.split(",").map((item) => item.trim()).filter(Boolean); }
};

export const formatBatchTime = (time) => {
  if (!time) return "-";
  const [hours, minutes] = time.split(":");
  const date = new Date();
  date.setHours(Number(hours));
  date.setMinutes(Number(minutes));
  return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
};

export const formatBatchLabel = (value) => {
  const text = String(value || "").trim();
  if (!text) return "-";
  return text.split("-").map((item) => item.charAt(0).toUpperCase() + item.slice(1)).join(" ");
};

export const formatGenderGroup = (value) => {
  if (value === "male") return "Male";
  if (value === "female") return "Female";
  return "Male & Female";
};

export { formatMoney as currency } from "../../utils/currency.js";
export const displayValue = (value) => String(value || "").trim() || "-";
