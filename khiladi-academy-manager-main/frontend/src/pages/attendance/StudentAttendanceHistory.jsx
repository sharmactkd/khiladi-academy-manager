import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  CalendarCheck2,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileSpreadsheet,
  MapPin,
  Printer,
  RefreshCw,
  UserRound,
  UserX,
} from "lucide-react";

import { academyApi } from "../../api/academyApi.js";
import { attendanceApi } from "../../api/attendanceApi.js";
import { getBranches } from "../../api/branchApi.js";
import AcademyHeroHeader from "../../components/academy/AcademyHeroHeader.jsx";
import StudentYearlyAttendanceProfile from "../../components/attendance/StudentYearlyAttendanceProfile.jsx";
import useAuth from "../../hooks/useAuth.js";
import { exportReportToExcel } from "../../utils/exportUtils.js";
import { getAcademyLogoUrl, getStudentPhotoUrl } from "../../utils/fileUrl.js";
import styles from "./StudentAttendanceHistory.module.css";

const DAYS = Array.from({ length: 31 }, (_, index) => index + 1);

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

const buildExportRows = (months = []) => months.map((month) => {
  const row = {
    Month: month.fullLabel,
    "Fee Paid": month.importedFeePaid || "",
    "Fee Status": month.importedFeeStatus || "",
  };
  DAYS.forEach((day) => {
    const dayInfo = month.days?.find((item) => Number(item.day) === day);
    row[String(day).padStart(2, "0")] = dayInfo ? month.attendance?.[dayInfo.dateKey] || "" : "";
  });
  row.Present = month.presentCount || 0;
  row.Absent = month.absentCount || 0;
  row.Leave = month.leaveCount || 0;
  row.Late = month.lateCount || 0;
  row["Attendance %"] = month.attendancePercentage || 0;
  return row;
});

const StudentAttendanceHistory = () => {
  const { studentId } = useParams();
  const { user } = useAuth();
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [profile, setProfile] = useState(null);
  const [academy, setAcademy] = useState(null);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const yearOptions = useMemo(() => {
    const start = currentYear - 30;
    const end = currentYear + 2;
    return Array.from({ length: end - start + 1 }, (_, index) => start + index);
  }, [currentYear]);

  const fetchProfile = useCallback(async ({ quiet = false } = {}) => {
    quiet ? setRefreshing(true) : setLoading(true);
    setError("");
    try {
      const response = await attendanceApi.getStudentYearlyProfile(studentId, { year });
      setProfile(response.data?.data || null);
    } catch (requestError) {
      const message = requestError.response?.data?.message || "Student yearly attendance could not be loaded.";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [studentId, year]);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

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

  const exportExcel = () => {
    if (!months.length) return;
    exportReportToExcel({
      rows: buildExportRows(months),
      fileName: `${studentName}-${year}-attendance`,
      sheetName: String(year),
    });
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
          { key: "year", icon: CalendarDays, value: year, label: "Year" },
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
          <label className={styles.yearSelect}><CalendarDays size={16} /><span>Year</span><select value={year} onChange={(event) => setYear(Number(event.target.value))}>{yearOptions.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
          <button type="button" onClick={() => fetchProfile({ quiet: true })} disabled={refreshing}><RefreshCw size={16} className={refreshing ? styles.spinning : ""} />Refresh</button>
          <button type="button" onClick={() => window.print()} disabled={!profile}><Printer size={16} />Print</button>
          <button type="button" className={styles.primaryAction} onClick={exportExcel} disabled={!months.length}><FileSpreadsheet size={16} />Export Excel</button>
        </div>
      </header>

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
              <article className={styles.metricLeave}><span><CalendarDays /></span><div><small>Leave</small><strong>{summary.leave}</strong></div></article>
              <article className={styles.metricRate}><span><CalendarCheck2 /></span><div><small>Attendance</small><strong>{summary.rate}%</strong></div></article>
            </div>
          </section>

          <StudentYearlyAttendanceProfile data={profile} summary={summary} />
        </>
      ) : null}

      <Link className={styles.backLink} to="/attendance"><ArrowLeft size={15} />Back to Attendance</Link>
    </div>
  );
};

export default StudentAttendanceHistory;