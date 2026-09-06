import React from "react";
import { Braces, FileDown, FileSpreadsheet, Printer } from "lucide-react";

import {
  exportReportToExcel,
  exportReportToPdf,
  printElement,
  downloadJson,
} from "../../utils/exportUtils";
import styles from "../../pages/reports/ReportStudio.module.css";

const ExportButtons = ({
  report,
  printElementId = "report-preview",
  disabled = false,
  columns: selectedColumns,
}) => {
  const rows = report?.rows || [];
  const columns = selectedColumns?.length ? selectedColumns : report?.columns || [];
  const title = report?.title || "Report";
  const fileName = report?.reportType || "report";

  return (
    <div className={styles.exportButtons}>
      <button
        type="button"
        className={styles.excelAction}
        disabled={disabled || !rows.length}
        onClick={() =>
          exportReportToExcel({
            rows,
            columns,
            fileName,
            sheetName: title.slice(0, 25),
          })
        }
      >
        <FileSpreadsheet size={15}/>Excel
      </button>

      <button
        type="button"
        className={styles.pdfAction}
        disabled={disabled || !rows.length}
        onClick={() =>
          exportReportToPdf({
            rows,
            columns,
            fileName,
            title,
            academyName: report?.academy?.name,
            generatedAt: report?.generatedAt,
          })
        }
      >
        <FileDown size={15}/>PDF
      </button>

      <button
        type="button"
        className={styles.printAction}
        disabled={disabled || !report}
        onClick={() => printElement(printElementId)}
      >
        <Printer size={15}/>Print
      </button>

      <button
        type="button"
        className={styles.jsonAction}
        disabled={disabled || !report}
        onClick={() => downloadJson({ data: report, fileName })}
      >
        <Braces size={15}/>JSON
      </button>
    </div>
  );
};

export default ExportButtons;
