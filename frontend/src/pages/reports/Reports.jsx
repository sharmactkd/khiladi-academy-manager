import React, { useEffect, useState } from "react";
import { getBranches } from "../../api/branchApi";
import { getReportByType } from "../../api/reportApi";
import ReportToolbar from "../../components/reports/ReportToolbar";

const Reports = () => {
  const [branches, setBranches] = useState([]);
  const [reportType, setReportType] = useState("students");
  const [filters, setFilters] = useState({
    branch: "",
    fromDate: "",
    toDate: "",
  });
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadBranches = async () => {
    try {
      const res = await getBranches({ status: "active" });
      setBranches(res.data || []);
    } catch {
      setBranches([]);
    }
  };

  const generateReport = async () => {
    try {
      setLoading(true);
      setError("");

      const params = Object.fromEntries(
        Object.entries(filters).filter(([, value]) => value)
      );

      const res = await getReportByType(reportType, params);
      setReport(res.data || null);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to generate report");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBranches();
  }, []);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Reports</h1>
          <p>Generate academy reports and export them to Excel/PDF.</p>
        </div>
      </div>

      <ReportToolbar
        reportType={reportType}
        setReportType={setReportType}
        filters={filters}
        setFilters={setFilters}
        branches={branches}
        onGenerate={generateReport}
        loading={loading}
        report={report}
      />

      {error ? <div className="alert alert-error">{error}</div> : null}

      <div id="report-preview" className="report-preview">
        {report ? (
          <>
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

            {report.summary ? (
              <div className="analytics-grid">
                {Object.entries(report.summary).map(([key, value]) => (
                  <div className="analytics-card" key={key}>
                    <p className="analytics-card__title">{key}</p>
                    <h3 className="analytics-card__value">{value}</h3>
                  </div>
                ))}
              </div>
            ) : null}

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
          </>
        ) : (
          <div className="card">
            Select report filters and click Generate Report.
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports;