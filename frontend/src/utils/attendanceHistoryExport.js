const monthKey = (month = {}) => {
  const year = Number(month.year);
  const value = Number(month.value);
  return year && value ? `${year}-${String(value).padStart(2, "0")}` : "";
};

export const validateAttendanceExportScope = ({ scope, from, to, year, month } = {}) => {
  if (scope === "range" && (!from || !to)) return "Start month aur End month select karein.";
  if (scope === "range" && from > to) return "Start month, End month se baad ka nahi ho sakta.";
  if (scope === "year" && !Number(year)) return "Attendance year select karein.";
  if (scope === "month" && !month) return "Attendance month select karein.";
  return "";
};

export const filterAttendanceHistoryMonths = (months = [], options = {}) => {
  const { scope = "complete", from = "", to = "", year = "", month = "" } = options;
  if (scope === "range") return months.filter((item) => {
    const key = monthKey(item);
    return key && key >= from && key <= to;
  });
  if (scope === "year") return months.filter((item) => Number(item.year) === Number(year));
  if (scope === "month") return months.filter((item) => monthKey(item) === month);
  return months;
};

export const attendanceExportPeriodLabel = ({ scope = "complete", from = "", to = "", year = "", month = "" } = {}) => {
  if (scope === "range") return `${from} to ${to}`;
  if (scope === "year") return String(year);
  if (scope === "month") return String(month);
  return "Complete History";
};
