import React from "react";

import {
  exportReportToExcel,
  exportReportToPdf,
  printElement,
  downloadJson,
} from "../../utils/exportUtils";

const ExportButtons = ({
  report,
  printElementId = "report-preview",
  disabled = false,
}) => {
  const rows = report?.rows || [];
  const columns = report?.columns || [];
  const title = report?.title || "Report";
  const fileName = report?.reportType || "report";

  return (
    <div className="export-buttons">
      <button
        type="button"
        className="btn btn-secondary"
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
        Export Excel
      </button>

      <button
        type="button"
        className="btn btn-secondary"
        disabled={disabled || !rows.length}
        onClick={() =>
          exportReportToPdf({
            rows,
            columns,
            fileName,
            title,
          })
        }
      >
        Export PDF
      </button>

      <button
        type="button"
        className="btn btn-secondary"
        disabled={disabled || !report}
        onClick={() => printElement(printElementId)}
      >
        Print
      </button>

      <button
        type="button"
        className="btn btn-secondary"
        disabled={disabled || !report}
        onClick={() => downloadJson({ data: report, fileName })}
      >
        JSON
      </button>
    </div>
  );
};

export default ExportButtons;