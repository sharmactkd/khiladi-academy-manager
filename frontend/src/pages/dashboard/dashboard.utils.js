import { formatMoney as formatCurrency } from "../../utils/currency.js";

export const dateFormatter = new Intl.DateTimeFormat("en-IN", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

export const formatMoney = (value, source) => formatCurrency(value, source);

export const isEnabled = (value) =>
  value === true ||
  value === "true" ||
  value === "enabled" ||
  value === "yes" ||
  value === 1 ||
  value === "1" ||
  value === "unlimited";

export const getPersonName = (person) =>
  `${person?.firstName || ""} ${person?.lastName || ""}`.trim() ||
  "Unknown student";

export const unwrapList = (response) => {
  const candidates = [response?.data?.data, response?.data, response];
  return candidates.find(Array.isArray) || [];
};

export const joinAddressParts = (parts = []) => {
  const uniqueParts = [];

  parts.forEach((part) => {
    const value = String(part || "").trim();
    if (!value) return;

    if (!uniqueParts.some((item) => item.toLowerCase() === value.toLowerCase())) {
      uniqueParts.push(value);
    }
  });

  return uniqueParts.join(", ");
};

export const formatRelativeTime = (value) => {
  if (!value) return "";
  const time = new Date(value).getTime();
  if (Number.isNaN(time)) return "";

  const difference = Math.max(0, Date.now() - time);
  const minutes = Math.floor(difference / 60000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;

  const days = Math.floor(hours / 24);
  return days === 1 ? "Yesterday" : `${days} days ago`;
};

export const normalizeDailyAttendance = (items = []) => {
  const grouped = new Map();

  items.forEach((item) => {
    const parts = item?._id || {};
    if (!parts.year || !parts.month || !parts.day) return;

    const date = new Date(parts.year, parts.month - 1, parts.day);
    const key = `${parts.year}-${String(parts.month).padStart(2, "0")}-${String(
      parts.day
    ).padStart(2, "0")}`;

    if (!grouped.has(key)) {
      grouped.set(key, {
        key,
        label: `${parts.day} ${date.toLocaleDateString("en-IN", {
          month: "short",
        })}`,
        present: 0,
        absent: 0,
        leave: 0,
        late: 0,
      });
    }

    const row = grouped.get(key);
    const status = String(parts.status || "").toLowerCase();
    if (Object.hasOwn(row, status)) row[status] += Number(item.count) || 0;
  });

  return [...grouped.values()]
    .sort((left, right) => left.key.localeCompare(right.key))
    .slice(-12)
    .map((row) => {
      const total = row.present + row.absent + row.leave + row.late;
      return {
        ...row,
        markedCount: total,
        attendance: total ? Math.round((row.present / total) * 100) : 0,
      };
    });
};
