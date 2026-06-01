import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { Upload } from "lucide-react";

import { batchApi } from "../../api/batchApi.js";
import { attendanceApi } from "../../api/attendanceApi.js";
import MonthlyAttendanceTable from "../../components/attendance/MonthlyAttendanceTable.jsx";
import AttendanceImportModal from "../../components/attendance/AttendanceImportModal.jsx";

const now = new Date();

const months = [
  { value: 1, label: "Jan", fullLabel: "January" },
  { value: 2, label: "Feb", fullLabel: "February" },
  { value: 3, label: "Mar", fullLabel: "March" },
  { value: 4, label: "Apr", fullLabel: "April" },
  { value: 5, label: "May", fullLabel: "May" },
  { value: 6, label: "Jun", fullLabel: "June" },
  { value: 7, label: "Jul", fullLabel: "July" },
  { value: 8, label: "Aug", fullLabel: "August" },
  { value: 9, label: "Sep", fullLabel: "September" },
  { value: 10, label: "Oct", fullLabel: "October" },
  { value: 11, label: "Nov", fullLabel: "November" },
  { value: 12, label: "Dec", fullLabel: "December" },
];

const normalizeResponseData = (response) => {
  return response?.data?.data || response?.data || {};
};

const formatPhoneNumber = (value) => {
  const digits = String(value || "").replace(/\D/g, "");

  if (digits.length !== 10) {
    return value || "-";
  }

  return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6)}`;
};

const formatRows = (rows = []) =>
  rows.map((row) => ({
    ...row,
    contact: formatPhoneNumber(row.contact),
  }));

const buildExportRows = ({ rows, days }) => {
  return rows.map((row) => {
    const item = {
      No: row.no,
      Name: row.name,
      Contact: row.contact,
      "Due Date": row.feeDueDate
        ? new Date(row.feeDueDate).toLocaleDateString("en-GB")
        : "-",
      "Fee Paid": row.feePaid || "",
      "Fee Status": row.feeStatus || "",
    };

    days.forEach((day) => {
      item[day.dateKey] = row.attendance?.[day.dateKey] || "";
    });

    item.ABSENT = row.absentCount || 0;
    item.PRESENT = row.presentCount || 0;
    item.LEAVE = row.leaveCount || 0;
    item.LATE = row.lateCount || 0;
    item["Attendance %"] = row.attendancePercentage || 0;

    return item;
  });
};

const MonthlyAttendanceRegister = () => {
  const printRef = useRef(null);

  const [batches, setBatches] = useState([]);
  const [batch, setBatch] = useState("");
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [viewMode, setViewMode] = useState("year");

  const [days, setDays] = useState([]);
  const [rows, setRows] = useState([]);
  const [yearMonths, setYearMonths] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState(null);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);

  const yearOptions = useMemo(() => {
    const currentYear = now.getFullYear();
    const startYear = currentYear - 30;
    const endYear = currentYear + 5;

    return Array.from(
      { length: endYear - startYear + 1 },
      (_, index) => startYear + index
    );
  }, []);

  const formattedRows = useMemo(() => formatRows(rows), [rows]);

  const formattedYearMonths = useMemo(() => {
    return yearMonths.map((monthItem) => ({
      ...monthItem,
      rows: formatRows(monthItem.rows || []),
    }));
  }, [yearMonths]);

  const selectedMonthLabel =
    months.find((item) => Number(item.value) === Number(month))?.label || "";

  const loadBatches = useCallback(async () => {
    try {
      const response = await batchApi.getAll();
      const list = response?.data?.data || response?.data || [];

      const activeBatches = Array.isArray(list)
        ? list.filter((item) => item.isActive)
        : [];

      setBatches(activeBatches);

      if (activeBatches.length) {
        setBatch((prev) => prev || activeBatches[0]._id);
      }
    } catch (error) {
      if (error?.response?.status === 401) {
        toast.error("Session expired. Please login again.");
        return;
      }

      toast.error("Batches load nahi hue");
    }
  }, []);

  const loadMonthlyRegister = async (
    selectedBatchId = batch,
    selectedMonth = month,
    selectedYear = year
  ) => {
    if (!selectedBatchId) return;

    try {
      setLoading(true);

      const response = await attendanceApi.getMonthlyRegister({
        batch: selectedBatchId,
        month: selectedMonth,
        year: selectedYear,
      });

      const data = normalizeResponseData(response);

      setDays(Array.isArray(data.days) ? data.days : []);
      setRows(Array.isArray(data.rows) ? data.rows : []);
      setSelectedBatch(data.batch || null);
    } catch (error) {
      if (error?.response?.status === 401) {
        toast.error("Session expired. Please login again.");
      } else {
        toast.error(
          error?.response?.data?.message || "Monthly attendance load nahi hui"
        );
      }

      setDays([]);
      setRows([]);
      setSelectedBatch(null);
    } finally {
      setLoading(false);
    }
  };

  const loadYearlyRegister = async (
    selectedBatchId = batch,
    selectedYear = year
  ) => {
    if (!selectedBatchId) return;

    try {
      setLoading(true);

      const response = await attendanceApi.getYearlyRegister({
        batch: selectedBatchId,
        year: selectedYear,
      });

      const data = normalizeResponseData(response);

      setYearMonths(Array.isArray(data.months) ? data.months : []);
      setSelectedBatch(data.batch || null);
    } catch (error) {
      if (error?.response?.status === 401) {
        toast.error("Session expired. Please login again.");
      } else {
        toast.error(
          error?.response?.data?.message || "Yearly attendance load nahi hui"
        );
      }

      setYearMonths([]);
      setSelectedBatch(null);
    } finally {
      setLoading(false);
    }
  };

  const reloadCurrentView = async () => {
    if (viewMode === "year") {
      await loadYearlyRegister(batch, year);
      return;
    }

    await loadMonthlyRegister(batch, month, year);
  };

  const saveRegister = async () => {
    if (viewMode === "year") {
      toast.error("Full Year view read-only hai. Edit ke liye Single Month mode use karein.");
      return;
    }

    if (!batch) {
      toast.error("Batch select karein");
      return;
    }

    try {
      setSaving(true);

      const response = await attendanceApi.saveMonthlyRegister({
        batch,
        month,
        year,
        rows,
      });

      const data = normalizeResponseData(response);

      setDays(Array.isArray(data.days) ? data.days : []);
      setRows(Array.isArray(data.rows) ? data.rows : []);
      setSelectedBatch(data.batch || null);

      toast.success("Monthly attendance saved successfully");
    } catch (error) {
      if (error?.response?.status === 401) {
        toast.error("Session expired. Please login again.");
      } else {
        toast.error(
          error?.response?.data?.message || "Monthly attendance save nahi hui"
        );
      }
    } finally {
      setSaving(false);
    }
  };

  const handleImportAttendance = async (payload) => {
    if (!batch) {
      toast.error("Pehle batch select karein");
      return;
    }

    try {
      const response = await attendanceApi.importOldAttendance({
        ...payload,
        fallbackBatch: batch,
        assignMissingBatch: true,
      });

      const summary = response?.data?.data || {};

      console.log("ATTENDANCE IMPORT RESPONSE:", response?.data);

      toast.success(
        `Cells: ${summary.totalAttendanceCells || 0}, Imported: ${
          summary.imported || 0
        }, Skipped: ${summary.skipped || 0}, Failed: ${
          summary.failed || 0
        }, Raw: ${summary.rawImportedStudents || 0}`
      );

      if (summary.errors?.length) {
        console.warn("IMPORT ERRORS:", summary.errors);
      }

      await reloadCurrentView();
    } catch (error) {
      console.error("ATTENDANCE IMPORT ERROR:", error);

      if (error?.response?.status === 401) {
        toast.error("Session expired. Please login again.");
      } else {
        toast.error(
          error?.response?.data?.message || "Attendance import nahi ho paya"
        );
      }

      throw error;
    }
  };

  const printRegister = () => {
    window.print();
  };

  const exportExcel = () => {
    const workbook = XLSX.utils.book_new();

    if (viewMode === "year") {
      const exportableMonths = formattedYearMonths.filter(
        (item) => Array.isArray(item.rows) && item.rows.length
      );

      if (!exportableMonths.length) {
        toast.error("Export ke liye data nahi hai");
        return;
      }

      exportableMonths.forEach((monthItem) => {
        const exportRows = buildExportRows({
          rows: monthItem.rows,
          days: monthItem.days || [],
        });

        const worksheet = XLSX.utils.json_to_sheet(exportRows);
        XLSX.utils.book_append_sheet(
          workbook,
          worksheet,
          `${monthItem.label}-${year}`
        );
      });

      const buffer = XLSX.write(workbook, {
        bookType: "xlsx",
        type: "array",
      });

      saveAs(
        new Blob([buffer], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        }),
        `yearly-attendance-${year}.xlsx`
      );

      return;
    }

    if (!formattedRows.length) {
      toast.error("Export ke liye data nahi hai");
      return;
    }

    const exportRows = buildExportRows({
      rows: formattedRows,
      days,
    });

    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    XLSX.utils.book_append_sheet(workbook, worksheet, "Attendance");

    const buffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });

    saveAs(
      new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      }),
      `monthly-attendance-${year}-${String(month).padStart(2, "0")}.xlsx`
    );
  };

  const scrollToMonth = (targetMonth) => {
    const element = document.getElementById(`attendance-month-${targetMonth}`);
    element?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  useEffect(() => {
    loadBatches();
  }, [loadBatches]);

  useEffect(() => {
    if (!batch || !year) return;

    if (viewMode === "year") {
      loadYearlyRegister(batch, year);
      return;
    }

    loadMonthlyRegister(batch, month, year);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [batch, month, year, viewMode]);

  return (
    <div className="page monthly-register-page">
      <AttendanceImportModal
        open={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        onImport={handleImportAttendance}
      />

      <div className="page-header monthly-register-header">
        <div>
          <h1>Monthly Attendance Register</h1>
          <p className="muted">
            Single month edit mode aur full year vertical attendance view.
          </p>
        </div>

        <div className="monthly-register-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setImportModalOpen(true)}
          >
            <Upload size={16} />
            Import Attendance
          </button>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={printRegister}
          >
            Print
          </button>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={exportExcel}
          >
            Excel Export
          </button>

          {viewMode === "month" && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={saveRegister}
              disabled={saving || loading || !rows.length}
            >
              {saving ? "Saving..." : "Save"}
            </button>
          )}
        </div>
      </div>

      <div className="monthly-register-toolbar card">
        <div className="batch-toggle-section">
          <span className="batch-toggle-label">Batch</span>

          <div className="batch-toggle-group">
            {batches.map((item) => (
              <button
                key={item._id}
                type="button"
                className={`batch-toggle-btn ${
                  batch === item._id ? "active" : ""
                }`}
                onClick={() => setBatch(item._id)}
              >
                {item.batchName} - {item.martialArt}
              </button>
            ))}
          </div>
        </div>

        <label>
          View
          <select
            value={viewMode}
            onChange={(event) => setViewMode(event.target.value)}
          >
            <option value="year">Full Year</option>
            <option value="month">Single Month</option>
          </select>
        </label>

        {viewMode === "month" && (
          <label>
            Month
            <select
              value={month}
              onChange={(event) => setMonth(Number(event.target.value))}
            >
              {months.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
        )}

        <label>
          Year
          <select
            value={year}
            onChange={(event) => setYear(Number(event.target.value))}
          >
            {yearOptions.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
      </div>

      {viewMode === "year" && (
        <div className="card" style={{ marginBottom: 16 }}>
          <strong>Jump to Month</strong>
          <div className="batch-toggle-group" style={{ marginTop: 10 }}>
            {months.map((item) => (
              <button
                key={item.value}
                type="button"
                className="batch-toggle-btn"
                onClick={() => scrollToMonth(item.value)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {selectedBatch && viewMode === "month" && (
        <div className="monthly-register-title">
          <strong>{selectedBatch.batchName}</strong>
          <span>
            {selectedMonthLabel}-{String(year).slice(-2)}
          </span>
        </div>
      )}

      {selectedBatch && viewMode === "year" && (
        <div className="monthly-register-title">
          <strong>{selectedBatch.batchName}</strong>
          <span>Full Year - {year}</span>
        </div>
      )}

      <div ref={printRef} className="monthly-register-print-area">
        {viewMode === "month" ? (
          <MonthlyAttendanceTable
            days={days}
            rows={formattedRows}
            onRowsChange={setRows}
            loading={loading}
          />
        ) : (
          <div className="yearly-attendance-stack">
            {loading ? (
              <div className="card">
                <p className="muted">Loading yearly attendance...</p>
              </div>
            ) : null}

            {!loading &&
              formattedYearMonths.map((monthItem) => (
                <section
                  key={monthItem.value}
                  id={`attendance-month-${monthItem.value}`}
                  className="yearly-attendance-month"
                  style={{ marginBottom: 28, scrollMarginTop: 90 }}
                >
                  <div className="monthly-register-title">
                    <strong>
                      {monthItem.fullLabel || monthItem.label} {year}
                    </strong>
                    <span>
                      Records:{" "}
                      {(monthItem.rows || []).filter(
                        (row) =>
                          row.presentCount ||
                          row.absentCount ||
                          row.leaveCount ||
                          row.lateCount
                      ).length || 0}
                    </span>
                  </div>

                  <MonthlyAttendanceTable
                    days={monthItem.days || []}
                    rows={monthItem.rows || []}
                    onRowsChange={() => {}}
                    loading={false}
                  />
                </section>
              ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MonthlyAttendanceRegister;