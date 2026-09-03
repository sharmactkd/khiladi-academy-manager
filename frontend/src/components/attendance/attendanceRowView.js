const text = (value) => String(value ?? "").trim();
const missing = (value) => !text(value) || ["-", "—"].includes(text(value));

export const getDueDateValue = (row) => row.importedDueDate || row.feeDueDate || "-";
export const getFeeStatusValue = (row) =>
  row.rowType === "student" && row.studentId
    ? row.feeStatus || row.importedFeeStatus || "-"
    : row.importedFeeStatus || row.feeStatus || "-";

// Follow the register's date conventions: DD-MM-YYYY, ISO, MM/DD/YYYY.
export const dueDateSortValue = (row, monthDate = "") => {
  const raw = text(row.rowType === "student" && row.studentId
    ? row.membership?.effectiveDueDate || getDueDateValue(row)
    : getDueDateValue(row));
  if (missing(raw)) return null;
  let year, month, day;
  let match;
  if ((match = raw.match(/^(\d{4})-(\d{2})-(\d{2})(?:T.*)?$/))) {
    [, year, month, day] = match;
  } else if ((match = raw.match(/^(\d{1,2})-(\d{1,2})-(\d{2,4})$/))) {
    [, day, month, year] = match;
  } else if ((match = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/))) {
    [, month, day, year] = match;
  } else if (/^\d{1,2}$/.test(raw) && /^\d{4}-\d{2}-/.test(monthDate)) {
    [year, month] = monthDate.split("-");
    day = raw;
  } else {
    // Preserve historic human-readable dates; unknown text sorts last.
    if (!/[A-Za-z]/.test(raw) || !/\d{4}/.test(raw)) return null;
    const parsed = new Date(raw);
    if (Number.isNaN(parsed.getTime())) return null;
    return Date.UTC(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
  }
  if (String(year).length === 2) year = `20${year}`;
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  return date.getUTCFullYear() === Number(year) && date.getUTCMonth() === Number(month) - 1 && date.getUTCDate() === Number(day)
    ? date.getTime() : null;
};

export const cycleAttendanceSort = (sorts, key, additive = false) => {
  const current = sorts.find((item) => item.key === key);
  const direction = !current ? "asc" : current.direction === "asc" ? "desc" : null;
  if (!additive) return direction ? [{ key, direction }] : [];
  if (!direction) return sorts.filter((item) => item.key !== key);
  return current ? sorts.map((item) => item.key === key ? { key, direction } : item)
    : [...sorts, { key, direction }];
};

export const buildAttendanceRowView = (rows, query = "", sort = [], monthDate = "") => {
  const needle = text(query).toLowerCase();
  const digits = needle.replace(/\D/g, "");
  const phoneQuery = digits.length > 0 && /^[\d\s()+-]+$/.test(needle);
  const view = rows.map((row, sourceIndex) => ({ row, sourceIndex })).filter(({ row }) => {
    if (!needle) return true;
    const values = [row.name, row.importedName, row.contact, row.importedPhone,
      row.admissionNumber, row.studentCode, row.importedAdmissionNumber];
    return values.some((value) => text(value).toLowerCase().includes(needle)) ||
      (phoneQuery && [row.contact, row.importedPhone].some((value) => text(value).replace(/\D/g, "").includes(digits)));
  });
  const sorts = (Array.isArray(sort) ? sort : [sort]).filter((item) => ["dueDate", "feeStatus"].includes(item.key));
  const isActive = ({ row }) => text(row.status).toLowerCase() === "active" && row.rowType !== "raw-import";
  const activeRows = view.filter(isActive);
  const inactiveRows = view.filter(({ row }) => text(row.status).toLowerCase() === "inactive" && row.rowType !== "raw-import");
  const timestamp = row => Number.isFinite(Date.parse(row.statusUpdatedAt)) ? Date.parse(row.statusUpdatedAt) : 0;
  inactiveRows.sort((a, b) => timestamp(b.row) - timestamp(a.row) || a.sourceIndex - b.sourceIndex);
  const otherRows = view.filter(entry => !isActive(entry) && !(text(entry.row.status).toLowerCase() === "inactive" && entry.row.rowType !== "raw-import"));
  const sortValues = new Map(activeRows.map(({ row, sourceIndex }) => [sourceIndex, sorts.map((item) =>
    item.key === "dueDate" ? dueDateSortValue(row, monthDate)
      : missing(getFeeStatusValue(row)) ? null : text(getFeeStatusValue(row)).toLowerCase())]));
  activeRows.sort((a, b) => {
    for (let index = 0; index < sorts.length; index += 1) {
      const left = sortValues.get(a.sourceIndex)[index], right = sortValues.get(b.sourceIndex)[index];
      if (left === null || right === null) {
        if (left !== right) return left === null ? 1 : -1;
        continue;
      }
      const difference = sorts[index].key === "dueDate" ? left - right : left.localeCompare(right);
      if (difference) return difference * (sorts[index].direction === "desc" ? -1 : 1);
    }
    return a.sourceIndex - b.sourceIndex;
  });
  // Status groups take precedence over saved manual order and column sorting.
  // Keep sourceIndex unchanged so attendance edits still target the correct row.
  return [...activeRows, ...inactiveRows, ...otherRows];
};

// Always patch the complete register, never the filtered/sorted view.
export const patchAttendanceRow = (rows, sourceIndex, update) =>
  rows.map((row, index) => index === sourceIndex ? update(row) : row);
