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
  { value: 1, label: "Jan" },
  { value: 2, label: "Feb" },
  { value: 3, label: "Mar" },
  { value: 4, label: "Apr" },
  { value: 5, label: "May" },
  { value: 6, label: "Jun" },
  { value: 7, label: "Jul" },
  { value: 8, label: "Aug" },
  { value: 9, label: "Sep" },
  { value: 10, label: "Oct" },
  { value: 11, label: "Nov" },
  { value: 12, label: "Dec" },
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

const MonthlyAttendanceRegister = () => {
  const printRef = useRef(null);

  const [batches, setBatches] = useState([]);
  const [batch, setBatch] = useState("");
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [days, setDays] = useState([]);
  const [rows, setRows] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);

  const yearOptions = useMemo(() => {
    const currentYear = now.getFullYear();
    const startYear = currentYear - 15;
    const endYear = currentYear + 5;

    return Array.from(
      { length: endYear - startYear + 1 },
      (_, index) => startYear + index
    );
  }, []);

  const formattedRows = useMemo(() => {
    return rows.map((row) => ({
      ...row,
      contact: formatPhoneNumber(row.contact),
    }));
  }, [rows]);

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

  const loadRegister = async (
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

  const saveRegister = async () => {
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
  }, Unmatched: ${summary.unmatchedStudents?.length || 0}`
);

      if (summary.unmatchedStudents?.length) {
        console.warn("UNMATCHED STUDENTS:", summary.unmatchedStudents);
        toast.error(`${summary.unmatchedStudents.length} students match nahi hue`);
      }

      if (summary.errors?.length) {
        console.warn("IMPORT ERRORS:", summary.errors);
      }

      await loadRegister(batch, month, year);
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
    if (!formattedRows.length) {
      toast.error("Export ke liye data nahi hai");
      return;
    }

    const exportRows = formattedRows.map((row) => {
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

    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    const workbook = XLSX.utils.book_new();

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

  useEffect(() => {
    loadBatches();
  }, [loadBatches]);

  useEffect(() => {
    if (batch && month && year) {
      loadRegister(batch, month, year);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [batch, month, year]);

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
            School register style monthly attendance with fee summary.
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

          <button
            type="button"
            className="btn btn-primary"
            onClick={saveRegister}
            disabled={saving || loading || !rows.length}
          >
            {saving ? "Saving..." : "Save"}
          </button>
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

      {selectedBatch && (
        <div className="monthly-register-title">
          <strong>{selectedBatch.batchName}</strong>
          <span>
            {months.find((item) => Number(item.value) === Number(month))?.label}
            -{String(year).slice(-2)}
          </span>
        </div>
      )}

      <div ref={printRef} className="monthly-register-print-area">
        <MonthlyAttendanceTable
          days={days}
          rows={formattedRows}
          onRowsChange={setRows}
          loading={loading}
        />
      </div>
    </div>
  );
};

export default MonthlyAttendanceRegister;