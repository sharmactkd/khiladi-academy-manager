import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const safeFileName = (value = "report") => {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
};

const formatCellValue = (value) => {
  if (value === null || value === undefined) return "";

  if (value instanceof Date) {
    return value.toLocaleDateString();
  }

  if (typeof value === "string" && value.includes("T")) {
    const parsed = new Date(value);

    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toLocaleDateString();
    }
  }

  return value;
};

export const normalizeReportRows = (rows = [], columns = []) => {
  if (!Array.isArray(rows)) return [];

  if (!Array.isArray(columns) || !columns.length) {
    return rows;
  }

  return rows.map((row) => {
    const normalized = {};

    columns.forEach((column) => {
      normalized[column.label || column.key] = formatCellValue(row[column.key]);
    });

    return normalized;
  });
};

export const exportReportToExcel = ({
  rows = [],
  columns = [],
  fileName = "report",
  sheetName = "Report",
}) => {
  const normalizedRows = normalizeReportRows(rows, columns);

  const worksheet = XLSX.utils.json_to_sheet(normalizedRows);
  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  const excelBuffer = XLSX.write(workbook, {
    bookType: "xlsx",
    type: "array",
  });

  const blob = new Blob([excelBuffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8",
  });

  saveAs(blob, `${safeFileName(fileName)}.xlsx`);
};

export const exportReportToPdf = ({
  rows = [],
  columns = [],
  fileName = "report",
  title = "Report",
}) => {
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "pt",
    format: "a4",
  });

  doc.setFontSize(16);
  doc.text(title, 40, 40);

  const tableColumns = columns.length
    ? columns.map((column) => column.label || column.key)
    : Object.keys(rows[0] || {});

  const tableRows = rows.map((row) => {
    if (columns.length) {
      return columns.map((column) => formatCellValue(row[column.key]));
    }

    return Object.keys(row).map((key) => formatCellValue(row[key]));
  });

  autoTable(doc, {
    head: [tableColumns],
    body: tableRows,
    startY: 60,
    styles: {
      fontSize: 8,
      cellPadding: 4,
    },
    headStyles: {
      fontStyle: "bold",
    },
  });

  doc.save(`${safeFileName(fileName)}.pdf`);
};

export const printElement = (elementId) => {
  const element = document.getElementById(elementId);

  if (!element) {
    window.print();
    return;
  }

  const printWindow = window.open("", "_blank", "width=1200,height=800");

  if (!printWindow) {
    window.print();
    return;
  }

  printWindow.document.write(`
    <html>
      <head>
        <title>Print Report</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            padding: 24px;
            color: #111827;
          }

          table {
            width: 100%;
            border-collapse: collapse;
          }

          th,
          td {
            border: 1px solid #e5e7eb;
            padding: 8px;
            font-size: 12px;
            text-align: left;
          }

          th {
            background: #f3f4f6;
          }

          h1,
          h2,
          h3 {
            margin-bottom: 12px;
          }
        </style>
      </head>
      <body>
        ${element.innerHTML}
      </body>
    </html>
  `);

  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
  printWindow.close();
};

export const downloadJson = ({ data, fileName = "report" }) => {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json;charset=utf-8",
  });

  saveAs(blob, `${safeFileName(fileName)}.json`);
};

/**
 * Backward-compatible old function names.
 * Existing old pages can still use exportToExcel/exportToPdf.
 */
export const exportToExcel = ({
  data = [],
  fileName = "report",
  sheetName = "Sheet1",
}) => {
  exportReportToExcel({
    rows: data,
    columns: [],
    fileName,
    sheetName,
  });
};

export const exportToPdf = ({
  title = "Report",
  columns = [],
  rows = [],
  fileName = "report",
}) => {
  const normalizedColumns = columns.map((column) => {
    if (typeof column === "string") {
      return {
        key: column,
        label: column,
      };
    }

    return column;
  });

  const normalizedRows = rows.map((row) => {
    if (Array.isArray(row)) {
      const objectRow = {};

      normalizedColumns.forEach((column, index) => {
        objectRow[column.key] = row[index];
      });

      return objectRow;
    }

    return row;
  });

  exportReportToPdf({
    rows: normalizedRows,
    columns: normalizedColumns,
    fileName,
    title,
  });
};