export const normalizeReportResponse = ({
  reportType,
  title,
  filters = {},
  rows = [],
  summary = {},
  columns = [],
}) => {
  return {
    reportType,
    title,
    filters,
    generatedAt: new Date(),
    summary,
    columns,
    rows,
    totalRows: rows.length,
  };
};

export const createColumn = (key, label) => ({
  key,
  label,
});