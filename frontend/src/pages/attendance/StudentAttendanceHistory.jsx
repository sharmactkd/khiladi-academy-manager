import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  CalendarCheck2,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileDown,
  FileSpreadsheet,
  MapPin,
  Printer,
  RefreshCw,
  Search,
  UserRound,
  UserX,
} from "lucide-react";

import { academyApi } from "../../api/academyApi.js";
import { attendanceApi } from "../../api/attendanceApi.js";
import { studentApi } from "../../api/studentApi.js";
import { getBranches } from "../../api/branchApi.js";
import AcademyHeroHeader from "../../components/academy/AcademyHeroHeader.jsx";
import StudentYearlyAttendanceProfile from "../../components/attendance/StudentYearlyAttendanceProfile.jsx";
import useAuth from "../../hooks/useAuth.js";
import { printDomElement } from "../../utils/securePrint.js";
import { attendanceExportPeriodLabel, filterAttendanceHistoryMonths, validateAttendanceExportScope } from "../../utils/attendanceHistoryExport.js";
import { exportAttendanceHistoryPdf, exportAttendanceHistoryWorkbook } from "../../utils/attendanceHistoryVisualExport.js";
import { getAcademyLogoUrl, getStudentPhotoUrl } from "../../utils/fileUrl.js";
import styles from "./StudentAttendanceHistory.module.css";

const getStudentName = (student) =>
  String(student?.importedName || student?.name || "Student").trim() || "Student";

const getStudentStatus = (status) => {
  const normalized = String(status || "active").toLowerCase();
  if (normalized === "left") return { label: "Left Academy", active: false };
  if (normalized === "inactive") return { label: "Inactive Student", active: false };
  return { label: "Active Student", active: true };
};

const formatDate = (value) => {
  if (!value) return "Not added";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Not added"
    : date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

const joinAddress = (source) =>
  [source?.address, source?.city, source?.state, source?.country]
    .map((item) => String(item || "").trim())
    .filter(Boolean)
    .join(", ");

const normalizeAcademy = (response) =>
  response?.data?.data?.academy || response?.data?.academy || null;

const normalizeBranches = (response) => {
  const list = response?.data?.data || response?.data || [];
  return Array.isArray(list) ? list.filter((item) => item?.isActive !== false) : [];
};

const getSummary = (months = []) => {
  const totals = months.reduce((result, month) => ({
    present: result.present + Number(month.presentCount || 0),
    absent: result.absent + Number(month.absentCount || 0),
    leave: result.leave + Number(month.leaveCount || 0),
    late: result.late + Number(month.lateCount || 0),
  }), { present: 0, absent: 0, leave: 0, late: 0 });
  const marked = totals.present + totals.absent + totals.leave + totals.late;
  return { ...totals, marked, rate: marked ? Math.round((totals.present / marked) * 100) : 0 };
};

const StudentAttendanceHistory = () => {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [academy, setAcademy] = useState(null);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [exportType, setExportType] = useState("");
  const [exporting, setExporting] = useState(false);
  const [exportProfile, setExportProfile] = useState(null);
  const [studentQuery, setStudentQuery] = useState("");
  const [studentResults, setStudentResults] = useState([]);
  const [searchingStudents, setSearchingStudents] = useState(false);
  const [exportOptions, setExportOptions] = useState({ scope: "complete", from: "", to: "", year: "", month: "" });
  const loadMoreRef = useRef(null);
  const exportRef = useRef(null);

  const fetchProfile = useCallback(async ({ quiet = false } = {}) => {
    quiet ? setRefreshing(true) : setLoading(true);
    setError("");
    try {
      const response = await attendanceApi.getStudentYearlyProfile(studentId, { timeline: true, offset: 0, limit: 12 });
      setProfile(response.data?.data || null);
    } catch (requestError) {
      const message = requestError.response?.data?.message || "Student yearly attendance could not be loaded.";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [studentId]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !profile?.pagination?.hasMore) return;
    setLoadingMore(true);
    try {
      const response = await attendanceApi.getStudentYearlyProfile(studentId, {
        timeline: true,
        offset: profile.months?.length || 0,
        limit: 12,
      });
      const next = response.data?.data;
      if (!next) return;
      setProfile((current) => ({
        ...current,
        ...next,
        student: current?.student || next.student,
        months: [...(current?.months || []), ...(next.months || [])],
        dayNotes: { ...(current?.dayNotes || {}), ...(next.dayNotes || {}) },
      }));
    } catch (requestError) {
      toast.error(requestError.response?.data?.message || "More attendance could not be loaded.");
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, profile, studentId]);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);
  useEffect(() => {
    const query = studentQuery.trim();
    if (query.length < 2) { setStudentResults([]); return undefined; }
    const timer = window.setTimeout(async () => {
      setSearchingStudents(true);
      try {
        const response = await studentApi.getAll({ search: query, limit: 12, paginated: true });
        const list = response?.data?.students || response?.students || response?.data || [];
        setStudentResults(Array.isArray(list) ? list : []);
      } catch { setStudentResults([]); }
      finally { setSearchingStudents(false); }
    }, 250);
    return () => window.clearTimeout(timer);
  }, [studentQuery]);
  useEffect(() => {
    const target = loadMoreRef.current;
    if (!target || !profile?.pagination?.hasMore) return undefined;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting) loadMore();
    }, { rootMargin: "240px" });
    observer.observe(target);
    return () => observer.disconnect();
  }, [loadMore, profile?.pagination?.hasMore]);

  useEffect(() => {
    let mounted = true;
    Promise.allSettled([academyApi.getMyAcademy(), getBranches({ status: "active" })])
      .then(([academyResult, branchResult]) => {
        if (!mounted) return;
        if (academyResult.status === "fulfilled") setAcademy(normalizeAcademy(academyResult.value));
        if (branchResult.status === "fulfilled") setBranches(normalizeBranches(branchResult.value));
      });
    return () => { mounted = false; };
  }, []);

  const student = profile?.student || {};
  const months = Array.isArray(profile?.months) ? profile.months : [];
  const summary = useMemo(() => getSummary(months), [months]);
  const studentName = getStudentName(student);
  const mainBranch = branches.find((item) => item?.isMainBranch) || branches[0];
  const academyAddress = joinAddress(mainBranch) || joinAddress(academy);
  const studentBranch = student.branch?.branchName || "Not assigned";
  const studentBatch = student.batch?.batchName || "Not assigned";
  const studentStatus = getStudentStatus(student.status);

  const openExport = (type) => {
    const latestYear = profile?.availableYears?.at(-1) || new Date().getFullYear();
    setExportOptions((current) => ({ ...current, year: current.year || String(latestYear) }));
    setExportType(type);
  };

  const fetchCompleteHistory = async () => {
    const allMonths = [];
    const allDayNotes = {};
    let offset = 0;
    let hasMore = true;
    while (hasMore) {
      const response = await attendanceApi.getStudentYearlyProfile(studentId, { timeline: true, offset, limit: 240 });
      const data = response.data?.data || {};
      const batch = Array.isArray(data.months) ? data.months : [];
      allMonths.push(...batch);
      Object.assign(allDayNotes, data.dayNotes || {});
      hasMore = Boolean(data.pagination?.hasMore);
      offset += batch.length;
      if (!batch.length) break;
    }
    return { months: allMonths, dayNotes: allDayNotes };
  };

  const runExport = async () => {
    const validation = validateAttendanceExportScope(exportOptions);
    if (validation) { toast.error(validation); return; }
    const printWindow = exportType === "print" ? window.open("about:blank", "_blank", "width=1200,height=800") : null;
    if (exportType === "print" && !printWindow) { toast.error("Print popup block ho gaya. Browser me popups allow karein."); return; }
    setExporting(true);
    try {
      const completeHistory = await fetchCompleteHistory();
      const selectedMonths = filterAttendanceHistoryMonths(completeHistory.months, exportOptions);
      if (!selectedMonths.length) { printWindow?.close(); toast.error("Selected period me attendance record nahi mila."); return; }
      const period = attendanceExportPeriodLabel(exportOptions);
      const fileName = `${studentName}-attendance-history-${period}`;
      const preparedProfile = { ...profile, timeline: true, months: selectedMonths, dayNotes: completeHistory.dayNotes, pagination: { hasMore: false } };
      if (exportType === "excel") {
        exportAttendanceHistoryWorkbook({ months: selectedMonths, dayNotes: completeHistory.dayNotes, studentName, academyName: academy?.academyName || "KHILADI Academy", period });
      } else if (exportType === "pdf") {
        setExportProfile(preparedProfile);
        await new Promise((resolve) => window.requestAnimationFrame(() => window.requestAnimationFrame(resolve)));
        await exportAttendanceHistoryPdf({ root: exportRef.current, fileName, studentName, academyName: academy?.academyName || "KHILADI Academy", period });
      } else {
        setExportProfile(preparedProfile);
        await new Promise((resolve) => window.requestAnimationFrame(() => window.requestAnimationFrame(resolve)));
        printDomElement({ element: exportRef.current, title: `${studentName} Attendance History`, targetWindow: printWindow, landscape: true });
      }
      setExportType("");
    } catch (requestError) {
      printWindow?.close();
      toast.error(requestError.response?.data?.message || "Attendance export could not be prepared.");
    } finally { setExporting(false); setExportProfile(null); }
  };

  return (
    <div className={styles.page}>
      <AcademyHeroHeader
        headingId="student-attendance-academy"
        academyName={academy?.academyName || "KHILADI Academy"}
        ownerName={academy?.ownerName || user?.name || "Academy Owner"}
        logoUrl={academy?.logo ? getAcademyLogoUrl(academy) : ""}
        eyebrow="Attendance intelligence"
        addressLabel={mainBranch?.branchName || "Main Branch"}
        address={academyAddress || "Complete main branch address not available"}
        summaryItems={[
          { key: "student", icon: UserRound, value: studentName, label: "Student" },
          { key: "period", icon: CalendarDays, value: "All History", label: "Period" },
        ]}
      />

      <nav className={styles.breadcrumb} aria-label="Breadcrumb">
        <Link to="/dashboard">Dashboard</Link><span>/</span>
        <Link to="/attendance">Attendance</Link><span>/</span>
        <strong>{studentName}</strong>
      </nav>

      <header className={styles.pageHeading}>
        <div className={styles.headingTitle}>
          <span><CalendarCheck2 size={25} /></span>
          <div><small>Attendance insights</small><h1>Student Attendance</h1><p>Yearly attendance, fee context and training consistency.</p></div>
        </div>
        <div className={styles.actions}>
          <span className={styles.yearSelect}><CalendarDays size={16} /><span>All History</span></span>
          <button type="button" onClick={() => fetchProfile({ quiet: true })} disabled={refreshing}><RefreshCw size={16} className={refreshing ? styles.spinning : ""} />Refresh</button>
          <button type="button" onClick={() => openExport("print")} disabled={!months.length}><Printer size={16} />Print</button>
          <button type="button" onClick={() => openExport("pdf")} disabled={!months.length}><FileDown size={16} />Save PDF</button>
          <button type="button" className={styles.primaryAction} onClick={() => openExport("excel")} disabled={!months.length}><FileSpreadsheet size={16} />Export Excel</button>
        </div>
      </header>

      <section className={styles.studentSearch}>
        <Search size={18} />
        <div><small>Switch student</small><input value={studentQuery} onChange={(event) => setStudentQuery(event.target.value)} placeholder="Search by name, phone or admission number…" aria-label="Search another student's attendance history" /></div>
        {searchingStudents ? <span className={styles.searchLoader} /> : null}
        {studentQuery.trim().length >= 2 ? <div className={styles.searchResults}>
          {studentResults.length ? studentResults.map((result) => <button key={result._id} type="button" onMouseDown={() => { setStudentQuery(""); setStudentResults([]); navigate(`/attendance/student/${result._id}`); }}>
            <img src={getStudentPhotoUrl(result)} alt="" /><span><strong>{getStudentName(result)}</strong><small>{result.admissionNumber || result.phone || "No identifier"}</small></span><em>{getStudentStatus(result.status).label}</em>
          </button>) : !searchingStudents ? <p>No matching student found.</p> : null}
        </div> : null}
      </section>

      {exportType ? <div className={styles.exportOverlay} role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !exporting) setExportType(""); }}>
        <section className={styles.exportDialog} role="dialog" aria-modal="true" aria-labelledby="attendance-export-title">
          <header><div><small>Attendance export</small><h2 id="attendance-export-title">{exportType === "pdf" ? "Save attendance PDF" : exportType === "print" ? "Print attendance history" : "Export attendance Excel"}</h2><p>Screen par loaded months se independent, selected period ka complete record export hoga.</p></div><button type="button" onClick={() => setExportType("")} disabled={exporting} aria-label="Close export options">×</button></header>
          <div className={styles.exportScopes}>
            {[["complete", "Complete history", "Every available attendance month"], ["range", "Custom date range", "Choose a start and end month"], ["year", "Specific year", "One complete calendar year"], ["month", "Specific month", "One attendance month"]].map(([value, label, help]) => <label key={value} className={exportOptions.scope === value ? styles.exportScopeActive : ""}><input type="radio" name="attendance-export-scope" value={value} checked={exportOptions.scope === value} onChange={(event) => setExportOptions((current) => ({ ...current, scope: event.target.value }))} /><span><strong>{label}</strong><small>{help}</small></span></label>)}
          </div>
          {exportOptions.scope === "range" ? <div className={styles.exportFields}><label>Start month<input type="month" value={exportOptions.from} onChange={(event) => setExportOptions((current) => ({ ...current, from: event.target.value }))} /></label><label>End month<input type="month" value={exportOptions.to} onChange={(event) => setExportOptions((current) => ({ ...current, to: event.target.value }))} /></label></div> : null}
          {exportOptions.scope === "year" ? <div className={styles.exportFields}><label>Attendance year<select value={exportOptions.year} onChange={(event) => setExportOptions((current) => ({ ...current, year: event.target.value }))}>{(profile?.availableYears || []).map((year) => <option key={year} value={year}>{year}</option>)}</select></label></div> : null}
          {exportOptions.scope === "month" ? <div className={styles.exportFields}><label>Attendance month<input type="month" value={exportOptions.month} onChange={(event) => setExportOptions((current) => ({ ...current, month: event.target.value }))} /></label></div> : null}
          <footer><button type="button" onClick={() => setExportType("")} disabled={exporting}>Cancel</button><button type="button" className={styles.primaryAction} onClick={runExport} disabled={exporting}>{exporting ? "Preparing complete history…" : exportType === "pdf" ? "Save PDF" : exportType === "print" ? "Open Print" : "Export Excel"}</button></footer>
        </section>
      </div> : null}

      {error ? <section className={styles.errorBanner}><div><UserX size={18} /><span><strong>Attendance could not be loaded</strong><small>{error}</small></span></div><button type="button" onClick={() => fetchProfile()}>Try again</button></section> : null}

      {loading ? (
        <section className={styles.loadingState}><span /><span /><span /></section>
      ) : profile ? (
        <>
          <section className={styles.studentOverview}>
            <article className={styles.studentIdentity}>
              <img src={getStudentPhotoUrl(student)} alt={studentName} />
              <div className={styles.studentName}><small>Student profile</small><h2>{studentName}</h2><b>{student.admissionNumber || "Admission number not added"}</b></div>
              <dl>
                <div><dt><MapPin size={14} />Branch</dt><dd>{studentBranch}</dd></div>
                <div><dt><Clock3 size={14} />Batch</dt><dd>{studentBatch}</dd></div>
                <div><dt><CheckCircle2 size={14} />Status</dt><dd className={studentStatus.active ? styles.activeText : styles.inactiveText}>{studentStatus.label}</dd></div>
                <div><dt><CalendarDays size={14} />Joined</dt><dd>{formatDate(student.joiningDate)}</dd></div>
              </dl>
              <Link to={`/students/${student._id}`}><UserRound size={15} />View Profile</Link>
            </article>

            <div className={styles.metrics}>
              <article className={styles.metricPresent}><span><CheckCircle2 /></span><div><small>Present</small><strong>{summary.present}</strong></div></article>
              <article className={styles.metricAbsent}><span><UserX /></span><div><small>Absent</small><strong>{summary.absent}</strong></div></article>
              <article className={styles.metricLeave}><span><CalendarDays /></span><div><small>Marked Days</small><strong>{summary.marked}</strong></div></article>
              <article className={styles.metricRate}><span><CalendarCheck2 /></span><div><small>Attendance Rate</small><strong>{summary.rate}%</strong></div></article>
            </div>
          </section>

          <StudentYearlyAttendanceProfile data={profile} summary={summary} />
          <div ref={loadMoreRef} className={styles.loadMoreHistory}>
            {profile?.pagination?.hasMore ? <button type="button" onClick={loadMore} disabled={loadingMore}>{loadingMore ? "Loading more months…" : "Load more attendance"}</button> : months.length ? <span>Complete attendance history loaded</span> : null}
          </div>
        </>
      ) : null}

      <Link className={styles.backLink} to="/attendance"><ArrowLeft size={15} />Back to Attendance</Link>
      {exportProfile ? <div ref={exportRef} className={styles.exportSurface} data-attendance-export-root>
        <header><div><small>{academy?.academyName || "KHILADI Academy"}</small><h1>{studentName} Attendance History</h1><p>{attendanceExportPeriodLabel(exportOptions)} · Generated {new Date().toLocaleDateString("en-IN")}</p></div></header>
        <StudentYearlyAttendanceProfile data={exportProfile} summary={getSummary(exportProfile.months)} exportMode />
      </div> : null}
    </div>
  );
};

export default StudentAttendanceHistory;
