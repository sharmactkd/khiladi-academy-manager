const pad = (value) => String(value).padStart(2, "0");

const validParts = (year, month, day) => {
  const candidate = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  return candidate.getUTCFullYear() === Number(year) &&
    candidate.getUTCMonth() === Number(month) - 1 &&
    candidate.getUTCDate() === Number(day);
};

const fullYear = (value) => {
  const text = String(value);
  if (text.length !== 2) return Number(text);
  const numeric = Number(text);
  return numeric >= 70 ? 1900 + numeric : 2000 + numeric;
};

export const parseAttendanceDate = (value, { monthDate = "" } = {}) => {
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null;
    return {
      year: value.getUTCFullYear(),
      month: value.getUTCMonth() + 1,
      day: value.getUTCDate(),
    };
  }

  const raw = String(value ?? "").trim();
  if (!raw || raw === "-" || raw === "—") return null;

  let match = raw.match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:T.*)?$/);
  if (match) {
    const [, year, month, day] = match;
    return validParts(year, month, day)
      ? { year: Number(year), month: Number(month), day: Number(day) }
      : null;
  }

  match = raw.match(/^(\d{1,2})-(\d{1,2})-(\d{2,4})$/);
  if (match) {
    const [, day, month, rawYear] = match;
    const year = fullYear(rawYear);
    return validParts(year, month, day)
      ? { year, month: Number(month), day: Number(day) }
      : null;
  }

  // Excel's formatted attendance cells arrive as US-style M/D/YY strings.
  match = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (match) {
    const [, month, day, rawYear] = match;
    const year = fullYear(rawYear);
    return validParts(year, month, day)
      ? { year, month: Number(month), day: Number(day) }
      : null;
  }

  if (/^\d{1,2}$/.test(raw) && /^(\d{4})-(\d{2})-/.test(monthDate)) {
    const [, year, month] = monthDate.match(/^(\d{4})-(\d{2})-/) || [];
    return validParts(year, month, raw)
      ? { year: Number(year), month: Number(month), day: Number(raw) }
      : null;
  }

  // Handles persisted JavaScript Date strings without treating human labels
  // such as "15 Days Left" as dates.
  if (/\b(?:GMT|UTC)\b/.test(raw)) {
    const candidate = new Date(raw);
    if (!Number.isNaN(candidate.getTime())) {
      return {
        year: candidate.getUTCFullYear(),
        month: candidate.getUTCMonth() + 1,
        day: candidate.getUTCDate(),
      };
    }
  }

  return null;
};

export const formatAttendanceDate = (
  value,
  { format = "full", fallback = "-", monthDate = "", preserveText = true } = {},
) => {
  const raw = String(value ?? "").trim();
  if (!raw || raw === "-" || raw === "—") return fallback;
  // A bare day number is meaningful imported text, not a complete date.
  // Preserve it exactly while the sorting helper may still use monthDate.
  if (/^\d{1,2}$/.test(raw)) return raw;
  const parsed = parseAttendanceDate(value, { monthDate });
  if (!parsed) return preserveText ? raw : fallback;
  if (format === "day") return pad(parsed.day);
  return `${pad(parsed.day)}-${pad(parsed.month)}-${parsed.year}`;
};

export const attendanceDateTimestamp = (value, options = {}) => {
  const parsed = parseAttendanceDate(value, options);
  return parsed ? Date.UTC(parsed.year, parsed.month - 1, parsed.day) : null;
};

export const toAttendanceDateInputValue = (value) => {
  const parsed = parseAttendanceDate(value);
  return parsed ? `${parsed.year}-${pad(parsed.month)}-${pad(parsed.day)}` : "";
};

export const fromAttendanceDateInputValue = (value) => {
  const parsed = parseAttendanceDate(value);
  return parsed ? `${pad(parsed.day)}-${pad(parsed.month)}-${parsed.year}` : "";
};
