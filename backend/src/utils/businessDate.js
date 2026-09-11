const DEFAULT_TIME_ZONE = "Asia/Kolkata";

export const todayDateKey = (now = new Date(), timeZone = process.env.APP_TIME_ZONE || DEFAULT_TIME_ZONE) => {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${value.year}-${value.month}-${value.day}`;
};

export const storedDateKey = (value) => {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
};

export const isDueOnOrBeforeToday = (value, now = new Date()) => {
  const dueKey = storedDateKey(value);
  return Boolean(dueKey && todayDateKey(now) >= dueKey);
};
