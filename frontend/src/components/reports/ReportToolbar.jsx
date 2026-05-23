import React from "react";
import ExportButtons from "./ExportButtons";

const REPORT_OPTIONS = [
  { value: "students", label: "Students" },
  { value: "attendance", label: "Attendance" },
  { value: "fees", label: "Fees" },
  { value: "belt-tests", label: "Belt Tests" },
  { value: "championships", label: "Championships" },
  { value: "certificates", label: "Certificates" },
  { value: "id-cards", label: "ID Cards" },
  { value: "branches", label: "Branches" },
];

const ReportToolbar = ({
  reportType,
  setReportType,
  filters,
  setFilters,
  branches = [],
  onGenerate,
  loading = false,
  report = null,
}) => {
  const updateFilter = (name, value) => {
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <div className="report-toolbar">
      <div className="form-grid">
        <div className="form-group">
          <label>Report Type</label>
          <select
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
          >
            {REPORT_OPTIONS.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Branch</label>
          <select
            value={filters.branch || ""}
            onChange={(e) => updateFilter("branch", e.target.value)}
          >
            <option value="">All Branches</option>
            {branches.map((branch) => (
              <option key={branch._id} value={branch._id}>
                {branch.branchName}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>From Date</label>
          <input
            type="date"
            value={filters.fromDate || ""}
            onChange={(e) => updateFilter("fromDate", e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>To Date</label>
          <input
            type="date"
            value={filters.toDate || ""}
            onChange={(e) => updateFilter("toDate", e.target.value)}
          />
        </div>
      </div>

      <div className="report-toolbar__actions">
        <button
          type="button"
          className="btn btn-primary"
          disabled={loading}
          onClick={onGenerate}
        >
          {loading ? "Generating..." : "Generate Report"}
        </button>

        <ExportButtons report={report} disabled={loading} />
      </div>
    </div>
  );
};

export default ReportToolbar;