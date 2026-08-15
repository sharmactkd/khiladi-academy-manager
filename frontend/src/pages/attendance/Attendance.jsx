import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { Copy, Upload } from "lucide-react";

import { batchApi } from "../../api/batchApi.js";
import { attendanceApi } from "../../api/attendanceApi.js";
import { studentApi } from "../../api/studentApi.js";
import AttendanceTable from "../../components/attendance/AttendanceTable.jsx";
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

const sortRegisterRows = (list = []) => [...list].sort((a, b) => {
  const rank = (row) => row.rowType === "imported" ? 2 : row.status === "inactive" ? 1 : 0;
  const difference = rank(a) - rank(b);
  if (difference) return difference;
  if (rank(a) === 1) return new Date(b.statusUpdatedAt || 0) - new Date(a.statusUpdatedAt || 0);
  return Number(a.no || 0) - Number(b.no || 0);
});

const recalculateRow = (row, days) => {
  const values = days.map((day) => row.attendance?.[day.dateKey] || "");
  const presentCount = values.filter((v) => v === "P").length;
  const absentCount = values.filter((v) => v === "A").length;
  const leaveCount = values.filter((v) => v === "L").length;
  const lateCount = values.filter((v) => v === "LT").length;
  const marked = presentCount + absentCount + leaveCount + lateCount;
  return { ...row, presentCount, absentCount, leaveCount, lateCount, attendancePercentage: marked ? Math.round((presentCount / marked) * 100) : 0 };
};

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

const getAllowedMonthLimit = () => {
  const currentMonthIndex = now.getMonth();
  const currentYear = now.getFullYear();

  const nextMonthDate = new Date(currentYear, currentMonthIndex + 1, 1);

  return {
    currentYear,
    maxFutureYear: nextMonthDate.getFullYear(),
    maxFutureMonth: nextMonthDate.getMonth() + 1,
  };
};

const Attendance = () => {
  const printRef = useRef(null);

  const [batches, setBatches] = useState([]);
  const [batch, setBatch] = useState("");
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  const [days, setDays] = useState([]);
  const [rows, setRows] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [dayNotes, setDayNotes] = useState({});
  const [statusUpdatingIds, setStatusUpdatingIds] = useState([]);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);

  const allowedLimit = useMemo(() => getAllowedMonthLimit(), []);

  const yearOptions = useMemo(() => {
    const startYear = allowedLimit.currentYear - 30;
    const endYear = allowedLimit.maxFutureYear;

    return Array.from(
      { length: endYear - startYear + 1 },
      (_, index) => startYear + index
    );
  }, [allowedLimit]);

  const visibleMonths = useMemo(() => {
    return months.filter((item) => {
      if (year < allowedLimit.maxFutureYear) return true;

      if (year === allowedLimit.maxFutureYear) {
        return item.value <= allowedLimit.maxFutureMonth;
      }

      return false;
    });
  }, [year, allowedLimit]);

  const formattedRows = useMemo(() => formatRows(rows), [rows]);

  const selectedMonthLabel =
    months.find((item) => Number(item.value) === Number(month))?.label || "";

  const selectedMonthFullLabel =
    months.find((item) => Number(item.value) === Number(month))?.fullLabel ||
    selectedMonthLabel;

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

  const loadMonthlyRegister = useCallback(
    async (
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
        setDayNotes(data.dayNotes || {});
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
        setDayNotes({});
      } finally {
        setLoading(false);
      }
    },
    [batch, month, year]
  );

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
      setDayNotes(data.dayNotes || {});

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

  const saveDayNote = async (note) => {
    try {
      const response = await attendanceApi.saveDayNote({ batch, ...note });
      const saved = normalizeResponseData(response).note || normalizeResponseData(response);
      setDayNotes((current) => ({ ...current, [note.date]: { ...note, ...saved, date: note.date } }));
      toast.success("Date note saved");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Date note save nahi hua");
      throw error;
    }
  };

  const removeDayNote = async (date) => {
    try {
      await attendanceApi.removeDayNote({ batch, date });
      setDayNotes((current) => { const next = { ...current }; delete next[date]; return next; });
      toast.success("Date note removed");
    } catch (error) { toast.error(error?.response?.data?.message || "Date note remove nahi hua"); }
  };

  const toggleStudentStatus = async (row, status) => {
    if (!row.studentId || statusUpdatingIds.includes(row.studentId)) return;
    const changedAt = new Date().toISOString();
    const previous = rows;
    setStatusUpdatingIds((ids) => [...ids, row.studentId]);
    setRows((current) => sortRegisterRows(current.map((item) => item.studentId === row.studentId ? { ...item, status, statusUpdatedAt: changedAt } : item)));
    try {
      const response = await studentApi.updateStatus(row.studentId, status);
      const saved = normalizeResponseData(response);
      setRows((current) => sortRegisterRows(current.map((item) => item.studentId === row.studentId ? { ...item, status: saved.status || status, statusUpdatedAt: saved.statusUpdatedAt || changedAt } : item)));
      toast.success(`${row.name || "Student"} marked ${status}`);
    } catch (error) {
      setRows(previous);
      toast.error(error?.response?.data?.message || "Student status update failed");
    } finally { setStatusUpdatingIds((ids) => ids.filter((id) => id !== row.studentId)); }
  };

  const repeatAttendance = () => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const eligible = days.filter((day) => !day.isSunday && !dayNotes[day.dateKey] && new Date(`${day.dateKey}T00:00:00`) <= today);
    const isMarked = (dateKey) => rows.some((row) => ["P", "A", "L", "LT"].includes(row.attendance?.[dateKey]));
    let sourceIndex = -1;
    eligible.forEach((day, index) => { if (isMarked(day.dateKey)) sourceIndex = index; });
    if (sourceIndex < 0) return toast.error("Repeat karne ke liye pehle kisi din attendance mark karein");
    const target = eligible[sourceIndex + 1];
    if (!target) return toast("Aaj tak koi next eligible date available nahi hai");
    const source = eligible[sourceIndex];
    let copied = 0;
    const next = rows.map((row) => {
      const value = row.attendance?.[source.dateKey];
      if (!["P", "A", "L", "LT"].includes(value) || row.attendance?.[target.dateKey]) return row;
      copied += 1;
      return recalculateRow({ ...row, attendance: { ...row.attendance, [target.dateKey]: value } }, days);
    });
    if (!copied) return toast.error("Next date ke liye copy karne layak attendance nahi mili");
    setRows(next);
    toast.success(`${source.dateKey} se ${target.dateKey} tak ${copied} attendance copied. Save dabayein.`);
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

      await loadMonthlyRegister(batch, month, year);
      return summary;
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

    const workbook = XLSX.utils.book_new();

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

  const handleMonthClick = (targetMonth) => {
    if (targetMonth === month) return;

    setMonth(targetMonth);
  };

  useEffect(() => {
    loadBatches();
  }, [loadBatches]);

  useEffect(() => {
    if (!visibleMonths.some((item) => item.value === month)) {
      const lastAllowedMonth = visibleMonths[visibleMonths.length - 1]?.value;

      if (lastAllowedMonth) {
        setMonth(lastAllowedMonth);
      }
    }
  }, [visibleMonths, month]);

  useEffect(() => {
    if (!batch || !month || !year) return;

    loadMonthlyRegister(batch, month, year);
  }, [batch, month, year, loadMonthlyRegister]);

  return (
    <div className="page monthly-register-page">
      <AttendanceImportModal
        open={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        onImport={handleImportAttendance}
        fallbackBatch={batch}
      />

      <div className="page-header monthly-register-header">
        <div>
      <h1>Attendance</h1>
<p className="muted">
  Manage batch-wise daily and monthly attendance records.
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

          <button type="button" className="btn btn-secondary" onClick={repeatAttendance} disabled={loading || !rows.length} title="Copy latest marked day to only the next eligible day">
            <Copy size={16} /> Repeat Attendance
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

      <div className="card" style={{ marginBottom: 16 }}>
        <strong>Month</strong>

        <div className="batch-toggle-group" style={{ marginTop: 10 }}>
          {visibleMonths.map((item) => (
            <button
              key={item.value}
              type="button"
              className={`batch-toggle-btn ${
                month === item.value ? "active" : ""
              }`}
              onClick={() => handleMonthClick(item.value)}
              disabled={loading}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {selectedBatch && (
        <div className="monthly-register-title">
          <strong>{selectedBatch.batchName}</strong>
          <span>
            {selectedMonthFullLabel} {year}
          </span>
          <span>
            Records:{" "}
            {formattedRows.filter(
              (row) =>
                row.presentCount ||
                row.absentCount ||
                row.leaveCount ||
                row.lateCount
            ).length || 0}
          </span>
        </div>
      )}

      <div ref={printRef} className="monthly-register-print-area">
        <AttendanceTable
          days={days}
          rows={formattedRows}
          dayNotes={dayNotes}
          onRowsChange={setRows}
          onSaveDayNote={saveDayNote}
          onRemoveDayNote={removeDayNote}
          onToggleStudentStatus={toggleStudentStatus}
          statusUpdatingIds={statusUpdatingIds}
          loading={loading}
        />
      </div>
    </div>
  );
};

export default Attendance;
