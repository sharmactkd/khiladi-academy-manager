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
  academyName = "KHILADI Academy",
  generatedAt = new Date(),
}) => {
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "pt",
    format: "a4",
  });

  doc.setTextColor(229, 9, 20);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text(String(academyName || "KHILADI Academy").toUpperCase(), 40, 28);
  doc.setTextColor(17, 29, 53);
  doc.setFontSize(17);
  doc.text(title, 40, 48);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 116, 139);
  doc.setFontSize(8);
  doc.text(`Generated: ${new Date(generatedAt || Date.now()).toLocaleString("en-IN")}  |  ${rows.length} records`, 40, 62);

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
    startY: 74,
    styles: {
      fontSize: 8,
      cellPadding: 4,
    },
    headStyles: {
      fontStyle: "bold",
      fillColor: [17, 29, 53],
      textColor: [255, 255, 255],
    },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    didDrawPage: (data) => {
      doc.setDrawColor(229, 9, 20);
      doc.setLineWidth(2);
      doc.line(40, 18, doc.internal.pageSize.getWidth() - 40, 18);
      doc.setTextColor(100, 116, 139);
      doc.setFontSize(7);
      doc.text(`Page ${data.pageNumber}`, doc.internal.pageSize.getWidth() - 66, doc.internal.pageSize.getHeight() - 20);
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

  const documentStyles = [...document.querySelectorAll('style, link[rel="stylesheet"]')]
    .map((node) => node.outerHTML)
    .join("");

  printWindow.document.write(`
    <html>
      <head>
        <title>Print Report</title>
        ${documentStyles}
        <style>
          @page { size: A4 landscape; margin: 10mm; }
          body {
            margin: 0;
            padding: 0;
            color: #111827;
            background: #ffffff;
          }

          table {
            width: 100%;
            border-collapse: collapse;
          }

          button, details, .no-print { display: none !important; }
        </style>
      </head>
      <body>
        ${element.innerHTML}
      </body>
    </html>
  `);

  printWindow.onload = () => {
    window.setTimeout(() => {
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    }, 250);
  };
  printWindow.document.close();
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
