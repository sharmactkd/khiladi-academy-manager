export const getPayload = (response, fallback = {}) =>
  response?.data?.data ?? response?.data ?? response ?? fallback;

export const normalizeBranches = (response) => {
  const payload = getPayload(response, []);
  return Array.isArray(payload) ? payload.filter((item) => item?.isActive !== false) : [];
};

export const normalizeDistribution = (items = [], formatter = (value) => value) =>
  (Array.isArray(items) ? items : []).map((item) => ({
    label: formatter(item?._id || "Not added"),
    value: Number(item?.count ?? item?.total ?? 0),
    amount: Number(item?.total ?? 0),
  }));

export const normalizeDailyAttendance = (items = []) => {
  const rows = new Map();
  (Array.isArray(items) ? items : []).forEach((item) => {
    const { year, month, day, status = "not_marked" } = item?._id || {};
    if (!year || !month || !day) return;
    const key = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const row = rows.get(key) || { key, label: `${String(day).padStart(2, "0")}/${String(month).padStart(2, "0")}`, present: 0, absent: 0, leave: 0, late: 0, total: 0 };
    row[status] = Number(item?.count || 0);
    row.total += Number(item?.count || 0);
    rows.set(key, row);
  });
  return [...rows.values()].sort((a, b) => a.key.localeCompare(b.key));
};

export const normalizeBatchAttendance = (items = []) => {
  const rows = new Map();
  (Array.isArray(items) ? items : []).forEach((item) => {
    const key = String(item?._id?.batch || item?.batchName || "unknown");
    const status = item?._id?.status || "not_marked";
    const row = rows.get(key) || { label: item?.batchName || "Unknown batch", present: 0, absent: 0, leave: 0, late: 0, total: 0 };
    row[status] = Number(item?.count || 0);
    row.total += Number(item?.count || 0);
    rows.set(key, row);
  });
  return [...rows.values()].map((row) => ({ ...row, rate: row.total ? Math.round((row.present / row.total) * 100) : 0 }));
};

export const sumValues = (items = [], key = "value") =>
  items.reduce((total, item) => total + Number(item?.[key] || 0), 0);

export const formatCurrency = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

export const joinAddress = (source) =>
  [source?.address, source?.city, source?.state, source?.country]
    .map((item) => String(item || "").trim()).filter(Boolean).join(", ");

export const getDateRange = (preset) => {
  if (preset === "all") return { fromDate: "", toDate: "" };
  const end = new Date();
  const start = new Date(end);
  if (preset === "30d") start.setDate(start.getDate() - 29);
  if (preset === "90d") start.setDate(start.getDate() - 89);
  if (preset === "year") start.setMonth(0, 1);
  const iso = (date) => date.toISOString().slice(0, 10);
  return { fromDate: iso(start), toDate: iso(end) };
};
