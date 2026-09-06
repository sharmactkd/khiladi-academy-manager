export const pretty = (value = "") => String(value).replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
export const date = (value) => value ? new Date(value).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";
export const money = (value, source) => formatMoney(value, source);
import { formatMoney } from "../../utils/currency.js";
