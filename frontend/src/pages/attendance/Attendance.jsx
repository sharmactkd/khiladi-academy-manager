import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { saveAs } from "file-saver";
import {
  CalendarCheck2, FileSpreadsheet, Printer, RefreshCcw, Save, TrendingUp,
  Upload, UserCheck, UsersRound, UserX,
} from "lucide-react";

import { academyApi } from "../../api/academyApi.js";
import { batchApi } from "../../api/batchApi.js";
import { attendanceApi } from "../../api/attendanceApi.js";
import { studentApi } from "../../api/studentApi.js";
import { getBranches } from "../../api/branchApi.js";
import AcademyHeroHeader from "../../components/academy/AcademyHeroHeader.jsx";
import AttendanceControls from "../../components/attendance/AttendanceControls.jsx";
import AttendanceTable from "../../components/attendance/AttendanceTable.jsx";
import AttendanceImportModal from "../../components/attendance/AttendanceImportModal.jsx";
import MembershipAdjustmentDrawer from "../../components/attendance/MembershipAdjustmentDrawer.jsx";
import useAuth from "../../hooks/useAuth.js";
import { getAcademyLogoUrl } from "../../utils/fileUrl.js";
import "./Attendance.module.css";

const now = new Date();

const numberFromSearch = (value, fallback, minimum, maximum) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= minimum && parsed <= maximum
    ? parsed
    : fallback;
};

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
  const rank = (row) => row.rowType === "raw-import" || row.status === "imported" ? 2 : row.status === "inactive" ? 1 : 0;
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
  const rowsRef = useRef([]);
  const editVersionRef = useRef(0);
  const saveInFlightRef = useRef(false);
  const pendingSaveRef = useRef(false);
  const autoSaveTimerRef = useRef(null);
  const saveRetryTimerRef = useRef(null);
  const saveRetryCountRef = useRef(0);
  const saveRegisterRef = useRef(null);
  const registerContextRef = useRef("");
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [academy, setAcademy] = useState(null);
  const [branches, setBranches] = useState([]);
  const [batches, setBatches] = useState([]);
  const [batch, setBatch] = useState(searchParams.get("batch") || "");
  const [month, setMonth] = useState(() =>
    numberFromSearch(searchParams.get("month"), now.getMonth() + 1, 1, 12)
  );
  const [year, setYear] = useState(() =>
    numberFromSearch(searchParams.get("year"), now.getFullYear(), 2000, 2100)
  );

  const [days, setDays] = useState([]);
  const [rows, setRows] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [dayNotes, setDayNotes] = useState({});
  const [statusUpdatingIds, setStatusUpdatingIds] = useState([]);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const [autoSaveError, setAutoSaveError] = useState("");
  const [membershipStudent, setMembershipStudent] = useState(null);

  const allowedLimit = useMemo(() => getAllowedMonthLimit(), []);
  registerContextRef.current = `${batch}:${month}:${year}`;

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

  const selectedBatchOption = useMemo(
    () => batches.find((item) => item._id === batch) || selectedBatch || null,
    [batches, batch, selectedBatch]
  );

  const openFeeCollection = useCallback(
    (row) => {
      if (!row?.studentId) return;

      const attendanceParams = new URLSearchParams();
      if (batch) attendanceParams.set("batch", batch);
      attendanceParams.set("month", String(month));
      attendanceParams.set("year", String(year));

      const feeParams = new URLSearchParams({
        student: String(row.studentId),
        month: String(month),
        year: String(year),
        returnTo: `/attendance?${attendanceParams.toString()}`,
      });

      navigate(`/fees/collect?${feeParams.toString()}`);
    },
    [batch, month, navigate, year]
  );

  const attendanceStats = useMemo(() => {
    const todayKey = new Date().toISOString().slice(0, 10);
    const selectedPeriodIsCurrent =
      Number(year) === now.getFullYear() && Number(month) === now.getMonth() + 1;
    const referenceDay = selectedPeriodIsCurrent
      ? todayKey
      : [...days].reverse().find((day) =>
          formattedRows.some((row) => ["P", "A", "L", "LT"].includes(row.attendance?.[day.dateKey]))
        )?.dateKey;
    const values = referenceDay
      ? formattedRows.map((row) => row.attendance?.[referenceDay] || "")
      : [];
    const present = values.filter((value) => value === "P").length;
    const absent = values.filter((value) => value === "A").length;
    const totalPresent = formattedRows.reduce((sum, row) => sum + Number(row.presentCount || 0), 0);
    const totalMarked = formattedRows.reduce(
      (sum, row) => sum + Number(row.presentCount || 0) + Number(row.absentCount || 0) + Number(row.leaveCount || 0) + Number(row.lateCount || 0),
      0
    );
    return {
      present,
      absent,
      rate: totalMarked ? Math.round((totalPresent / totalMarked) * 100) : 0,
      totalCells: formattedRows.length * days.length,
    };
  }, [formattedRows, days, month, year]);

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
        const loadedRows = Array.isArray(data.rows) ? data.rows : [];
        rowsRef.current = loadedRows;
        editVersionRef.current = 0;
        setRows(loadedRows);
        setSelectedBatch(data.batch || null);
        setDayNotes(data.dayNotes || {});
        setHasUnsavedChanges(false);
        setAutoSaveError("");
      } catch (error) {
        if (error?.response?.status === 401) {
          toast.error("Session expired. Please login again.");
        } else {
          toast.error(
            error?.response?.data?.message || "Attendance load nahi hui"
          );
        }

        setDays([]);
        rowsRef.current = [];
        setRows([]);
        setSelectedBatch(null);
        setDayNotes({});
      } finally {
        setLoading(false);
      }
    },
    [batch, month, year]
  );

  const saveRegister = useCallback(async ({ silent = false } = {}) => {
    if (!batch) {
      if (!silent) toast.error("Batch select karein");
      return;
    }

    if (saveInFlightRef.current) {
      pendingSaveRef.current = true;
      return;
    }

    const rowsSnapshot = rowsRef.current;
    if (!rowsSnapshot.length) return;
    const savingVersion = editVersionRef.current;
    const savingContext = `${batch}:${month}:${year}`;

    try {
      saveInFlightRef.current = true;
      setSaving(true);
      setAutoSaveError("");

      const response = await attendanceApi.saveMonthlyRegister({
        batch,
        month,
        year,
        rows: rowsSnapshot,
      });

      const data = normalizeResponseData(response);
      if (data.saveVerification?.verified !== true) {
        throw new Error("Server could not verify the saved attendance");
      }
      window.clearTimeout(saveRetryTimerRef.current);
      saveRetryCountRef.current = 0;
      const hasNewerChanges = editVersionRef.current !== savingVersion;

      if (registerContextRef.current === savingContext) {
        setDays(Array.isArray(data.days) ? data.days : []);
        setSelectedBatch(data.batch || null);
        setDayNotes(data.dayNotes || {});
        setLastSavedAt(new Date());

        if (hasNewerChanges) {
          pendingSaveRef.current = true;
        } else {
          const persistedRows = Array.isArray(data.rows) ? data.rows : rowsSnapshot;
          rowsRef.current = persistedRows;
          setRows(persistedRows);
          setHasUnsavedChanges(false);
        }
      }

      if (!silent) toast.success("Attendance saved successfully");
    } catch (error) {
      setAutoSaveError(
        error?.response?.data?.message || error?.message || "Attendance save nahi hui",
      );
      if (error?.response?.status === 401) {
        if (!silent) toast.error("Session expired. Please login again.");
      } else if (!silent) {
        toast.error(
          error?.response?.data?.message || error?.message || "Attendance save nahi hui"
        );
      }

      if (
        registerContextRef.current === savingContext &&
        saveRetryCountRef.current < 3
      ) {
        const retryDelay = 1500 * (2 ** saveRetryCountRef.current);
        saveRetryCountRef.current += 1;
        window.clearTimeout(saveRetryTimerRef.current);
        saveRetryTimerRef.current = window.setTimeout(() => {
          saveRegisterRef.current?.({ silent: true });
        }, retryDelay);
      }
    } finally {
      saveInFlightRef.current = false;
      setSaving(false);

      if (pendingSaveRef.current) {
        pendingSaveRef.current = false;
        window.clearTimeout(saveRetryTimerRef.current);
        window.clearTimeout(autoSaveTimerRef.current);
        autoSaveTimerRef.current = window.setTimeout(() => {
          saveRegisterRef.current?.({ silent: true });
        }, 250);
      }
    }
  }, [batch, month, year]);

  useEffect(() => {
    saveRegisterRef.current = saveRegister;
  }, [saveRegister]);

  useEffect(() => {
    window.clearTimeout(saveRetryTimerRef.current);
    saveRetryCountRef.current = 0;
  }, [batch, month, year]);

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
    rowsRef.current = next;
    editVersionRef.current += 1;
    setHasUnsavedChanges(true);
    setAutoSaveError("");
    toast.success(`${source.dateKey} se ${target.dateKey} tak ${copied} attendance copied. Auto-save scheduled.`);
  };

  const handleImportAttendance = async (payload) => {
    if (!batch) {
      toast.error("Pehle batch select karein");
      return;
    }

    try {
      const { deferRefresh = false, ...importPayload } = payload;
      const response = await attendanceApi.importOldAttendance({
        ...importPayload,
        fallbackBatch: batch,
        assignMissingBatch: true,
      });

      const summary = response?.data?.data || {};

      if (!deferRefresh) {
        toast.success(
          `Cells: ${summary.totalAttendanceCells || 0}, Imported: ${
            summary.imported || 0
          }, Skipped: ${summary.skipped || 0}, Failed: ${summary.failed || 0}`
        );
      }

      if (summary.errors?.length) {
        console.warn("IMPORT ERRORS:", summary.errors);
      }

      if (!deferRefresh) await loadMonthlyRegister(batch, month, year);
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

  const exportExcel = async () => {
    const XLSX = await import("xlsx");
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

  const handleRowsChange = (nextRows) => {
    window.clearTimeout(saveRetryTimerRef.current);
    saveRetryCountRef.current = 0;
    rowsRef.current = nextRows;
    editVersionRef.current += 1;
    setRows(nextRows);
    setHasUnsavedChanges(true);
    setAutoSaveError("");
  };

  const handleMembershipUpdated = (studentId, membership) => {
    setRows((current) => current.map((row) =>
      String(row.studentId) === String(studentId)
        ? {
            ...row,
            membership,
            feeDueDate: membership?.effectiveDueDate || row.feeDueDate,
            feeStatus: membership?.feeStatus || row.feeStatus,
          }
        : row
    ));
    setMembershipStudent((current) =>
      current && String(current.studentId) === String(studentId)
        ? { ...current, membership }
        : current
    );
  };

  const openAttendanceImport = () => {
    if (!batch) {
      toast.error("Attendance import karne se pehle batch select karein");
      return;
    }
    if (hasUnsavedChanges) return toast.error("Please wait for attendance auto-save before opening Imports.");
    navigate(`/imports?type=attendance&batch=${batch}`);
  };

  useEffect(() => {
    loadBatches();
  }, [loadBatches]);

  useEffect(() => {
    let mounted = true;
    Promise.allSettled([
      academyApi.getMyAcademy(),
      getBranches({ status: "active" }),
    ]).then(([academyResult, branchResult]) => {
      if (!mounted) return;
      if (academyResult.status === "fulfilled") {
        setAcademy(
          academyResult.value?.data?.data?.academy ||
          academyResult.value?.data?.academy ||
          null
        );
      }
      if (branchResult.status === "fulfilled") {
        const response = branchResult.value;
        const list = response?.data?.data || response?.data || [];
        setBranches(Array.isArray(list) ? list.filter((item) => item?.isActive !== false) : []);
      }
    });
    return () => { mounted = false; };
  }, []);

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

  useEffect(() => {
    window.clearTimeout(autoSaveTimerRef.current);
    if (!hasUnsavedChanges || loading || !batch || !rows.length) return undefined;

    autoSaveTimerRef.current = window.setTimeout(() => {
      saveRegisterRef.current?.({ silent: true });
    }, 900);

    return () => window.clearTimeout(autoSaveTimerRef.current);
  }, [batch, hasUnsavedChanges, loading, month, rows, year]);

  useEffect(() => () => {
    window.clearTimeout(autoSaveTimerRef.current);
    window.clearTimeout(saveRetryTimerRef.current);
  }, []);

  useEffect(() => {
    const warnBeforeLeaving = (event) => {
      if (!hasUnsavedChanges) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warnBeforeLeaving);
    return () => window.removeEventListener("beforeunload", warnBeforeLeaving);
  }, [hasUnsavedChanges]);

  const mainBranch = branches.find((item) => item?.isMainBranch) || branches[0];
  const academyAddress = [
    mainBranch?.address || academy?.address,
    mainBranch?.city || academy?.city,
    mainBranch?.state || academy?.state,
    mainBranch?.country || academy?.country,
  ].filter(Boolean).join(", ");

  return (
    <div className="page attendance-page monthly-register-page">
      <AttendanceImportModal
        open={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        onImport={handleImportAttendance}
        fallbackBatch={batch}
        selectedBatch={selectedBatchOption}
      />

      <MembershipAdjustmentDrawer
        open={Boolean(membershipStudent)}
        student={membershipStudent}
        onClose={() => setMembershipStudent(null)}
        onUpdated={handleMembershipUpdated}
      />

      <AcademyHeroHeader
        headingId="attendance-academy-name"
        academyName={academy?.academyName || "KHILADI Academy"}
        ownerName={academy?.ownerName || user?.name || "Academy Owner"}
        logoUrl={academy?.logo ? getAcademyLogoUrl(academy) : ""}
        addressLabel={mainBranch?.branchName || "Main Branch"}
        address={academyAddress || "Complete main branch address not available"}
        summaryItems={[
          { key: "branches", type: "branches", value: branches.length, label: `Active ${branches.length === 1 ? "Branch" : "Branches"}` },
          { key: "batches", type: "batches", value: batches.length, label: `Active ${batches.length === 1 ? "Batch" : "Batches"}` },
        ]}
      />

      <nav className="attendance-breadcrumb" aria-label="Breadcrumb">
        <Link to="/dashboard">Dashboard</Link><span>/</span><strong>Attendance</strong>
      </nav>

      <header className="attendance-heading">
        <div className="attendance-heading__title">
          <span><CalendarCheck2 size={25} /></span>
          <div><small>Academy Operations</small><h1>Attendance</h1><p>Manage daily attendance, monthly records and student participation.</p></div>
        </div>
        <div className="attendance-heading__actions">
          <button type="button" className="attendance-action" onClick={openAttendanceImport} disabled={!batch}><Upload size={16} /> Import Attendance</button>
          <button type="button" className="attendance-action" onClick={printRegister} disabled={!formattedRows.length}><Printer size={16} /> Print</button>
          <button type="button" className="attendance-action" onClick={exportExcel} disabled={!formattedRows.length}><FileSpreadsheet size={16} /> Export Excel</button>
          <button type="button" className="attendance-action attendance-action--primary" onClick={() => saveRegister({ silent: false })} disabled={saving || loading || !rows.length}><Save size={16} /> {saving ? "Saving…" : "Save Attendance"}</button>
        </div>
      </header>

      <section className="attendance-metrics" aria-label="Attendance overview">
        <article className="attendance-metric attendance-metric--red"><span><UsersRound /></span><div><small>Total Students</small><strong>{formattedRows.length}</strong></div></article>
        <article className="attendance-metric attendance-metric--green"><span><UserCheck /></span><div><small>Present {Number(month) === now.getMonth() + 1 && Number(year) === now.getFullYear() ? "Today" : "Latest Day"}</small><strong>{attendanceStats.present}</strong></div></article>
        <article className="attendance-metric attendance-metric--amber"><span><UserX /></span><div><small>Absent {Number(month) === now.getMonth() + 1 && Number(year) === now.getFullYear() ? "Today" : "Latest Day"}</small><strong>{attendanceStats.absent}</strong></div></article>
        <article className="attendance-metric attendance-metric--blue"><span><TrendingUp /></span><div><small>Attendance Rate</small><strong>{attendanceStats.rate}%</strong></div></article>
      </section>

      <AttendanceControls
        batches={batches} batch={batch} onBatchChange={setBatch}
        year={year} yearOptions={yearOptions} onYearChange={setYear}
        month={month} months={visibleMonths} onMonthChange={handleMonthClick}
        disabled={loading || saving || hasUnsavedChanges}
        repeatDisabled={loading || !rows.length} onRepeat={repeatAttendance}
      />

      <section className="attendance-register-card">
        <div ref={printRef} className="monthly-register-print-area attendance-register-body">
          <AttendanceTable
            days={days}
            rows={formattedRows}
            dayNotes={dayNotes}
            onRowsChange={handleRowsChange}
            onSaveDayNote={saveDayNote}
            onRemoveDayNote={removeDayNote}
            onToggleStudentStatus={toggleStudentStatus}
            onOpenMembership={setMembershipStudent}
            onOpenFeeCollection={openFeeCollection}
            canManageMembership={["academy_owner", "super_admin"].includes(user?.role)}
            statusUpdatingIds={statusUpdatingIds}
            loading={loading}
          />
        </div>

        <footer className="attendance-save-bar">
          <span className={hasUnsavedChanges ? "is-pending" : "is-saved"}><i />{hasUnsavedChanges ? "Unsaved changes" : "All changes saved"}</span>
          <span>{autoSaveError ? `Auto-save failed: ${autoSaveError}` : lastSavedAt ? `Last auto-saved ${lastSavedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : "Changes auto-save after editing"}</span>
          <div><span>{formattedRows.length} students · {attendanceStats.totalCells} attendance cells</span><button type="button" onClick={() => saveRegister({ silent: false })} disabled={saving || loading || !rows.length}><Save size={15} /> {saving ? "Saving…" : "Save Now"}</button></div>
        </footer>
      </section>
    </div>
  );
};

export default Attendance;
