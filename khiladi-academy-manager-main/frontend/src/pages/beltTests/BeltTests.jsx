import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { ArrowRight, Award, BadgeCheck, CalendarDays, CheckCircle2, ChevronLeft, ChevronRight, Clock3, GraduationCap, History, Medal, Pencil, Plus, RotateCcw, Search, ShieldCheck, SlidersHorizontal, Sparkles, Users, XCircle } from "lucide-react";
import { academyApi } from "../../api/academyApi.js";
import { batchApi } from "../../api/batchApi.js";
import { beltTestApi } from "../../api/beltTestApi.js";
import { getBranches } from "../../api/branchApi.js";
import { studentApi } from "../../api/studentApi.js";
import AcademyHeroHeader from "../../components/academy/AcademyHeroHeader.jsx";
import useAuth from "../../hooks/useAuth.js";
import { getAcademyLogoUrl } from "../../utils/fileUrl.js";
import styles from "./BeltTests.module.css";

const PAGE_SIZE = 20;
const normalizeList = (response, key) => { const data = response?.data; if (Array.isArray(response)) return response; if (Array.isArray(data)) return data; if (Array.isArray(data?.data)) return data.data; if (Array.isArray(data?.data?.[key])) return data.data[key]; if (Array.isArray(data?.[key])) return data[key]; return []; };
const getPayload = (response) => response?.data?.data || response?.data || response || {};
const normalizeAcademy = (response) => getPayload(response)?.academy || null;
const normalizeBranches = (response) => { const list = response?.data?.data || response?.data || []; return Array.isArray(list) ? list.filter((item) => item?.isActive !== false) : []; };
const getStudentName = (student) => student?.name || [student?.firstName, student?.lastName].filter(Boolean).join(" ").trim() || "Unknown Student";
const getStudentCode = (student) => student?.studentCode || student?.admissionNumber || "No admission number";
const getEntityId = (value) => String(value?._id || value || "");
const joinAddress = (source) => [source?.address, source?.city, source?.state, source?.country].map((item) => String(item || "").trim()).filter(Boolean).join(", ");
const formatDate = (value) => value ? new Date(value).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "Not tested";
const formatScore = (record) => { if (record?.marks === null || record?.marks === undefined || record?.marks === "") return "Not added"; if (record?.outOf === null || record?.outOf === undefined || record?.outOf === "") return String(record.marks); const percentage = Number(record.outOf) > 0 ? Math.round((Number(record.marks) / Number(record.outOf)) * 100) : null; return `${record.marks}/${record.outOf}${percentage === null ? "" : ` · ${percentage}%`}`; };
const getRank = (belt, dan) => [belt, dan].filter(Boolean).join(" · ") || "Not added";

const fetchLatestBeltTests = async () => {
  const response = await beltTestApi.getAll({ latestByStudent: true });
  const payload = getPayload(response);
  return {
    records: Array.isArray(payload?.beltTests) ? payload.beltTests : [],
    total: Number(payload?.pagination?.total || 0),
  };
};

const BeltTests = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [students, setStudents] = useState([]);
  const [batches, setBatches] = useState([]);
  const [beltTests, setBeltTests] = useState([]);
  const [totalTests, setTotalTests] = useState(0);
  const [academy, setAcademy] = useState(null);
  const [branches, setBranches] = useState([]);
  const [selectedBatchId, setSelectedBatchId] = useState("");
  const [viewMode, setViewMode] = useState("all");
  const [filters, setFilters] = useState({ search: "", result: "" });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [studentsResult, batchesResult, testsResult, academyResult, branchesResult] = await Promise.allSettled([studentApi.getAll({}), batchApi.getAll(), fetchLatestBeltTests(), academyApi.getMyAcademy(), getBranches({ status: "active" })]);
      if (studentsResult.status === "rejected" || testsResult.status === "rejected") throw studentsResult.reason || testsResult.reason;
      setStudents(normalizeList(studentsResult.value, "students"));
      setBeltTests(testsResult.value.records);
      setTotalTests(testsResult.value.total);
      setBatches(batchesResult.status === "fulfilled" ? normalizeList(batchesResult.value, "batches").filter((item) => item?.isActive !== false) : []);
      if (academyResult.status === "fulfilled") setAcademy(normalizeAcademy(academyResult.value));
      if (branchesResult.status === "fulfilled") setBranches(normalizeBranches(branchesResult.value));
    } catch (error) { toast.error(error?.response?.data?.message || "Belt test records load nahi ho sake"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);
  useEffect(() => { setPage(1); }, [selectedBatchId, viewMode, filters.search, filters.result]);

  const latestTestsByStudent = useMemo(() => {
    const map = new Map();
    beltTests.forEach((record) => { const id = getEntityId(record.student); if (!id) return; const saved = map.get(id); if (!saved || new Date(record.testDate || record.createdAt || 0) > new Date(saved.testDate || saved.createdAt || 0)) map.set(id, record); });
    return map;
  }, [beltTests]);
  const rows = useMemo(() => students.map((student) => ({ student, latestTest: latestTestsByStudent.get(getEntityId(student)) || null })), [students, latestTestsByStudent]);
  const stats = useMemo(() => ({ students: rows.length, tested: rows.filter((row) => row.latestTest).length, passed: rows.filter((row) => row.latestTest?.result === "pass").length, pending: rows.filter((row) => !row.latestTest || row.latestTest?.result === "pending").length }), [rows]);
  const filteredRows = useMemo(() => {
    const search = filters.search.trim().toLowerCase();
    return rows.filter(({ student, latestTest }) => {
      const matchesBatch = !selectedBatchId || getEntityId(student.batch) === selectedBatchId;
      const active = student.status === "active";
      const matchesView = viewMode === "all" || (viewMode === "active" ? active : !active);
      const matchesResult = !filters.result || (filters.result === "not-tested" ? !latestTest : latestTest?.result === filters.result);
      const matchesSearch = !search || [getStudentName(student), getStudentCode(student), student.phone, student.batch?.batchName, student.beltRank, latestTest?.promotedToBelt, latestTest?.examinerName].some((value) => String(value || "").toLowerCase().includes(search));
      return matchesBatch && matchesView && matchesResult && matchesSearch;
    });
  }, [rows, selectedBatchId, viewMode, filters]);

  const pages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  const safePage = Math.min(page, pages);
  const visibleRows = filteredRows.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const selectedBatch = batches.find((batch) => getEntityId(batch) === selectedBatchId) || null;
  const mainBranch = branches.find((branch) => branch?.isMainBranch) || branches[0];
  const filtersActive = Boolean(selectedBatchId || viewMode !== "all" || filters.search || filters.result);
  const resetFilters = () => { setSelectedBatchId(""); setViewMode("all"); setFilters({ search: "", result: "" }); };

  return <div className={`page ${styles.page}`}>
    <AcademyHeroHeader headingId="belt-records-academy" academyName={academy?.academyName || "KHILADI Academy"} ownerName={academy?.ownerName || user?.name || "Academy Owner"} logoUrl={academy?.logo ? getAcademyLogoUrl(academy) : ""} eyebrow="Belt progression desk" addressLabel={mainBranch?.branchName || "Main Branch"} address={joinAddress(mainBranch) || joinAddress(academy) || "Complete main branch address not available"} summaryItems={[{ key: "students", icon: GraduationCap, value: stats.students, label: "Students" }, { key: "tests", icon: Award, value: totalTests, label: "Tests Recorded" }, { key: "passed", icon: BadgeCheck, value: stats.passed, label: "Latest Passes" }]}/>
    <nav className={styles.breadcrumb}><Link to="/dashboard">Dashboard</Link><span>/</span><strong>Belt Test Records</strong></nav>
    <header className={styles.pageHeading}><div><span><Medal size={25}/></span><div><small>Progression records</small><h1>Belt Test Records</h1><p>Track student ranks, grading outcomes and complete promotion history.</p></div></div><Link to="/belt-tests/events"><Plus size={17}/>Manage Belt Test Events</Link></header>

    <section className={styles.summaryGrid}>{[
      { label: "Academy Students", value: stats.students, note: "Across all batches", icon: Users, tone: "navy" },
      { label: "Students Tested", value: stats.tested, note: `${Math.max(stats.students - stats.tested, 0)} awaiting first test`, icon: ShieldCheck, tone: "blue" },
      { label: "Latest Result: Pass", value: stats.passed, note: "Latest grading outcomes", icon: CheckCircle2, tone: "green" },
      { label: "Pending / Not Tested", value: stats.pending, note: "Requires follow-up", icon: Clock3, tone: "amber" },
    ].map(({ label, value, note, icon: Icon, tone }) => <article key={label} className={styles[`summary${tone}`]}><span><Icon size={19}/></span><div><small>{label}</small><strong>{value}</strong><p>{note}</p></div></article>)}</section>

    <section className={styles.controlCard}>
      <header><div><SlidersHorizontal size={17}/><span><strong>Find student records</strong><small>Filter by batch, status or latest grading result.</small></span></div>{filtersActive ? <button type="button" onClick={resetFilters}><RotateCcw size={14}/>Reset all</button> : null}</header>
      <div className={styles.batchScroller}><button type="button" className={!selectedBatchId ? styles.selectedBatch : ""} onClick={() => setSelectedBatchId("")}><Sparkles size={14}/><span>All Batches</span><small>Academy</small><b>{rows.length}</b></button>{batches.map((batch) => { const count = rows.filter(({ student }) => getEntityId(student.batch) === getEntityId(batch)).length; return <button key={batch._id} type="button" className={selectedBatchId === getEntityId(batch) ? styles.selectedBatch : ""} onClick={() => setSelectedBatchId(getEntityId(batch))}><span>{batch.batchName}</span><small>{batch.martialArt || "Martial Art"}</small><b>{count}</b></button>; })}</div>
      <div className={styles.filterRow}><label className={styles.searchField}><span>Search records</span><div><Search size={16}/><input value={filters.search} onChange={(event) => setFilters((prev) => ({ ...prev, search: event.target.value }))} placeholder="Name, code, phone, belt or examiner..."/></div></label><label><span>Latest result</span><select value={filters.result} onChange={(event) => setFilters((prev) => ({ ...prev, result: event.target.value }))}><option value="">All results</option><option value="pass">Pass</option><option value="pending">Pending</option><option value="fail">Fail</option><option value="not-tested">Not tested</option></select></label><div className={styles.segmented}><button type="button" className={viewMode === "all" ? styles.activeSegment : ""} onClick={() => setViewMode("all")}>All</button><button type="button" className={viewMode === "active" ? styles.activeSegment : ""} onClick={() => setViewMode("active")}>Active</button><button type="button" className={viewMode === "inactive" ? styles.activeSegment : ""} onClick={() => setViewMode("inactive")}>Inactive</button></div></div>
    </section>

    <section className={styles.recordsCard}>
      <header><div><small>{selectedBatch ? `${selectedBatch.batchName} · ${selectedBatch.martialArt || "Martial Art"}` : "All academy batches"}</small><h2>Student Progression Register</h2><p>Showing {filteredRows.length} matching student{filteredRows.length === 1 ? "" : "s"}</p></div><span><Award size={16}/>{totalTests} total tests</span></header>
      {loading ? <div className={styles.loadingState}><span/><span/><span/><p>Loading belt progression records...</p></div> : visibleRows.length ? <div className={styles.tableViewport}><table><thead><tr><th>No.</th><th>Student</th><th>Contact</th><th>Current Rank</th><th>Last Promotion</th><th>Score</th><th>Test Date</th><th>Result</th><th>Actions</th></tr></thead><tbody>{visibleRows.map(({ student, latestTest }, index) => <tr key={student._id} className={student.status !== "active" ? styles.inactiveRow : ""} tabIndex={0} aria-label={`View history for ${getStudentName(student)}`} onClick={(event) => { if (!event.target.closest("a, button, input, select")) navigate(`/students/${student._id}/belt-history`); }} onKeyDown={(event) => { if (event.target !== event.currentTarget) return; if (event.key === "Enter" || event.key === " ") { event.preventDefault(); navigate(`/students/${student._id}/belt-history`); } }}><td>{(safePage - 1) * PAGE_SIZE + index + 1}</td><td><div className={styles.studentCell}><span><button type="button" onClick={() => navigate(`/students/${student._id}`)}>{getStudentName(student)}</button></span></div></td><td><div className={styles.stackCell}><strong>{student.phone || "Not added"}</strong></div></td><td><span className={styles.rankPill}>{getRank(student.beltRank, student.danRank)}</span></td><td>{latestTest ? <div className={styles.promotionCell}><span>{getRank(latestTest.currentBelt, latestTest.currentDanRank)}</span><ArrowRight size={13}/><strong>{getRank(latestTest.promotedToBelt, latestTest.promotedToDanRank)}</strong></div> : <span className={styles.muted}>No test recorded</span>}</td><td><strong className={styles.score}>{formatScore(latestTest)}</strong></td><td><div className={styles.dateCell}><CalendarDays size={14}/><span>{formatDate(latestTest?.testDate)}</span></div></td><td>{latestTest ? <span className={`${styles.resultBadge} ${styles[`result${latestTest.result}`]}`}>{latestTest.result === "pass" ? <CheckCircle2 size={13}/> : latestTest.result === "fail" ? <XCircle size={13}/> : <Clock3 size={13}/>} {latestTest.result}</span> : <span className={styles.notTested}>Not tested</span>}</td><td><div className={styles.actions}><Link to={`/belt-tests/new?student=${student._id}`} title="Add belt test"><Plus size={15}/></Link>{latestTest ? <Link to={`/belt-tests/${latestTest._id}/edit`} title="Edit latest test"><Pencil size={14}/></Link> : null}<Link to={`/students/${student._id}/belt-history`} title="View belt history"><History size={15}/></Link></div></td></tr>)}</tbody></table></div> : <div className={styles.emptyState}><span><Award size={26}/></span><h3>No matching records</h3><p>Filters clear karein ya student ke liye pehla belt test add karein.</p><div><button type="button" onClick={resetFilters}><RotateCcw size={15}/>Clear Filters</button><Link to="/belt-tests/new"><Plus size={15}/>Add Belt Test</Link></div></div>}
      {!loading && filteredRows.length ? <footer><p>Showing <strong>{(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filteredRows.length)}</strong> of <strong>{filteredRows.length}</strong> students</p><div><button type="button" disabled={safePage === 1} onClick={() => setPage((value) => Math.max(1, value - 1))}><ChevronLeft size={15}/>Previous</button><span>Page <strong>{safePage}</strong> of {pages}</span><button type="button" disabled={safePage === pages} onClick={() => setPage((value) => Math.min(pages, value + 1))}>Next<ChevronRight size={15}/></button></div></footer> : null}
    </section>
  </div>;
};

export default BeltTests;
