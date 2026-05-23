import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import ExportButtons from "../../components/reports/ExportButtons";

const ReportPreview = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const report = location.state?.report || null;

  if (!report) {
    return (
      <div className="page">
        <div className="card">
          <h2>No report selected</h2>
          <p>Please generate a report first.</p>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => navigate("/reports")}
          >
            Go to Reports
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>{report.title}</h1>
          <p>Preview and export report.</p>
        </div>

        <ExportButtons report={report} printElementId="report-preview" />
      </div>

      <div id="report-preview" className="report-preview">
        <div className="report-preview__header">
          <h2>{report.title}</h2>
          <p>
            Generated At:{" "}
            {report.generatedAt
              ? new Date(report.generatedAt).toLocaleString()
              : "-"}
          </p>
          <p>Total Rows: {report.totalRows || 0}</p>
        </div>

        <div className="table-card">
          <table>
            <thead>
              <tr>
                {(report.columns || []).map((column) => (
                  <th key={column.key}>{column.label}</th>
                ))}
              </tr>
            </thead>

            <tbody>
              {report.rows?.length ? (
                report.rows.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {(report.columns || []).map((column) => (
                      <td key={column.key}>
                        {row[column.key] === null ||
                        row[column.key] === undefined
                          ? "-"
                          : String(row[column.key])}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={report.columns?.length || 1}>
                    No report data found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ReportPreview;