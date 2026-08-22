export const normalizeReportResponse = ({
  reportType,
  title,
  filters = {},
  rows = [],
  summary = {},
  columns = [],
  currency = null,
}) => {
  return {
    reportType,
    title,
    filters,
    generatedAt: new Date(),
    summary,
    columns,
    currency,
    rows,
    totalRows: rows.length,
  };
};

export const createColumn = (key, label) => ({
  key,
  label,
});
