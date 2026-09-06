import { useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Activity, AlertTriangle, Award, BarChart3, CalendarCheck2, ChevronRight, CircleDollarSign, GraduationCap, Medal, RefreshCw, ShieldCheck, Sparkles, TrendingUp, Trophy, UserCheck, UserRoundX, Users } from "lucide-react";
import AcademyHeroHeader from "../../components/academy/AcademyHeroHeader.jsx";
import AnalyticsFilters from "../../components/analytics/AnalyticsFilters.jsx";
import { formatPaymentMode } from "../../utils/feePaymentModes.js";
import { getAcademyLogoUrl } from "../../utils/fileUrl.js";
import { scopeCurrencySource } from "../../utils/currency.js";
import useAnalyticsStudio from "./hooks/useAnalyticsStudio.js";
import { formatCurrency, joinAddress, normalizeBatchAttendance, normalizeDailyAttendance, normalizeDistribution, sumValues } from "./analyticsStudio.utils.js";
import styles from "./AnalyticsStudio.module.css";

const COLORS = ["#e50914", "#1f9d62", "#2878d0", "#7255c5", "#e79a18", "#64748b", "#0f766e"];
const TABS = [
  { id: "overview", label: "Overview", icon: BarChart3 },
  { id: "students", label: "Students", icon: GraduationCap },
  { id: "attendance", label: "Attendance", icon: CalendarCheck2 },
  { id: "fees", label: "Fees", icon: CircleDollarSign, feeOnly: true },
  { id: "performance", label: "Performance", icon: Trophy },
];
const tooltipStyle = { border: "1px solid #dce4ed", borderRadius: 10, boxShadow: "0 12px 32px rgba(15,23,42,.1)", fontSize: 12 };
const axisTick = { fill: "#65758b", fontSize: 11 };

const Kpi = ({ icon: Icon, label, value, detail, tone = "red" }) => (
  <article className={`${styles.kpi} ${styles[`tone${tone[0].toUpperCase()}${tone.slice(1)}`]}`}>
    <span><Icon size={21} /></span><div><small>{label}</small><strong>{value}</strong><p>{detail}</p></div>
  </article>
);

const ChartCard = ({ title, subtitle, children, empty = false, wide = false, action = null }) => (
  <article className={`${styles.chartCard} ${wide ? styles.wide : ""}`}>
    <header><div><h2>{title}</h2><p>{subtitle}</p></div>{action}</header>
    {empty ? <div className={styles.empty}><BarChart3 size={24} /><strong>No analytics available</strong><span>Try a wider date range or another branch.</span></div> : <div className={styles.chart}>{children}</div>}
  </article>
);

const DistributionPie = ({ data }) => <ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={data} dataKey="value" nameKey="label" innerRadius={55} outerRadius={82} paddingAngle={2} stroke="none">{data.map((item, index) => <Cell key={`${item.label}-${index}`} fill={COLORS[index % COLORS.length]} />)}</Pie><Tooltip contentStyle={tooltipStyle} /><Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} /></PieChart></ResponsiveContainer>;

const TrendArea = ({ data, dataKey = "value", color = "#e50914", currency = false, currencySource }) => <ResponsiveContainer width="100%" height="100%"><AreaChart data={data} margin={{ top: 12, right: 16, left: 4, bottom: 0 }}><defs><linearGradient id={`fill-${dataKey}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity={0.24}/><stop offset="100%" stopColor={color} stopOpacity={0}/></linearGradient></defs><CartesianGrid stroke="#e8edf3" strokeDasharray="3 4" vertical={false}/><XAxis dataKey="label" axisLine={false} tickLine={false} tick={axisTick}/><YAxis axisLine={false} tickLine={false} tick={axisTick} width={currency ? 58 : 36} tickFormatter={currency ? (value) => value >= 100000 ? `${(value / 100000).toFixed(1)}L` : value >= 1000 ? `${Math.round(value / 1000)}k` : value : undefined}/><Tooltip contentStyle={tooltipStyle} formatter={currency ? (value) => formatCurrency(value, currencySource) : undefined}/><Area type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2.5} fill={`url(#fill-${dataKey})`} dot={{ r: 3, fill: color, stroke: "#fff", strokeWidth: 2 }}/></AreaChart></ResponsiveContainer>;

const DistributionBars = ({ data, dataKey = "value", color = "#e50914", horizontal = false }) => <ResponsiveContainer width="100%" height="100%"><BarChart data={data} layout={horizontal ? "vertical" : "horizontal"} margin={{ top: 8, right: 20, left: horizontal ? 20 : 0, bottom: 0 }}><CartesianGrid stroke="#e8edf3" strokeDasharray="3 4" horizontal={!horizontal} vertical={horizontal}/>{horizontal ? <><XAxis type="number" axisLine={false} tickLine={false} tick={axisTick}/><YAxis type="category" dataKey="label" width={90} axisLine={false} tickLine={false} tick={axisTick}/></> : <><XAxis dataKey="label" axisLine={false} tickLine={false} tick={axisTick}/><YAxis axisLine={false} tickLine={false} tick={axisTick}/></>}<Tooltip contentStyle={tooltipStyle}/><Bar dataKey={dataKey} fill={color} radius={horizontal ? [0, 6, 6, 0] : [6, 6, 0, 0]} maxBarSize={38}/></BarChart></ResponsiveContainer>;

const Overview = ({ data, canManageFees, currencySource }) => {
  const dashboard = data.overview || {};
  const admissions = data.students?.admissionsByMonth || [];
  const attendance = normalizeDailyAttendance(data.attendance?.dailyAttendanceTrend);
  const medalCount = Object.values(dashboard.medalCount || {}).reduce((total, count) => total + Number(count || 0), 0);
  return <>
    <section className={styles.kpis}>
      <Kpi icon={Users} label="Active Students" value={dashboard.activeStudents || 0} detail={`${dashboard.totalStudents || 0} total student records`} tone="red" />
      <Kpi icon={CalendarCheck2} label="Today Attendance" value={`${dashboard.todayAttendancePercentage || 0}%`} detail={`${dashboard.todayAttendanceCount || 0} attendance records`} tone="blue" />
      {canManageFees ? <Kpi icon={CircleDollarSign} label="Monthly Collection" value={formatCurrency(dashboard.monthlyFeesCollected, currencySource)} detail={`${formatCurrency(dashboard.pendingFees, currencySource)} outstanding`} tone="green" /> : null}
      <Kpi icon={Trophy} label="Achievements" value={medalCount} detail={`${dashboard.upcomingBeltTests || 0} upcoming belt tests`} tone="purple" />
    </section>
    <section className={styles.chartGrid}>
      <ChartCard title="Academy Growth" subtitle="Monthly student admissions" empty={!admissions.length} wide><TrendArea data={admissions} /></ChartCard>
      <ChartCard title="Attendance Pulse" subtitle="Present students across marked days" empty={!attendance.length}><TrendArea data={attendance} dataKey="present" color="#1f9d62" /></ChartCard>
      <ChartCard title="Academy Records" subtitle="Operational document and student status summary"><div className={styles.recordList}><div><span><UserCheck size={17}/></span><p><strong>{dashboard.activeStudents || 0}</strong><small>Active students</small></p></div><div><span><UserRoundX size={17}/></span><p><strong>{(dashboard.inactiveStudents || 0) + (dashboard.leftStudents || 0)}</strong><small>Inactive / left</small></p></div><div><span><ShieldCheck size={17}/></span><p><strong>{dashboard.certificatesIssued || 0}</strong><small>Certificates issued</small></p></div><div><span><Award size={17}/></span><p><strong>{dashboard.idCardsGenerated || 0}</strong><small>ID cards generated</small></p></div></div></ChartCard>
    </section>
  </>;
};

const StudentsPanel = ({ data }) => {
  const admissions = data?.admissionsByMonth || [];
  const status = normalizeDistribution(data?.statusDistribution, (value) => String(value).replaceAll("_", " "));
  const belts = normalizeDistribution(data?.beltDistribution);
  const arts = normalizeDistribution(data?.martialArtDistribution);
  const total = sumValues(status);
  const active = status.find((item) => item.label.toLowerCase() === "active")?.value || 0;
  return <><section className={styles.kpis}><Kpi icon={Users} label="Students Analysed" value={total} detail="Within the selected scope"/><Kpi icon={UserCheck} label="Active Students" value={active} detail={`${total ? Math.round((active / total) * 100) : 0}% of analysed students`} tone="green"/><Kpi icon={TrendingUp} label="Admissions" value={sumValues(admissions)} detail="New records in selected period" tone="blue"/><Kpi icon={Medal} label="Belt Levels" value={belts.length} detail="Distinct recorded belt ranks" tone="purple"/></section><section className={styles.chartGrid}><ChartCard title="Admissions Trend" subtitle="Student growth by month" empty={!admissions.length} wide><TrendArea data={admissions}/></ChartCard><ChartCard title="Student Status" subtitle="Active, inactive and left distribution" empty={!status.length}><DistributionPie data={status}/></ChartCard><ChartCard title="Belt Distribution" subtitle="Students across belt ranks" empty={!belts.length}><DistributionBars data={belts} horizontal color="#7255c5"/></ChartCard><ChartCard title="Martial Art Mix" subtitle="Training disciplines selected by students" empty={!arts.length}><DistributionPie data={arts}/></ChartCard></section></>;
};

const AttendancePanel = ({ data }) => {
  const daily = normalizeDailyAttendance(data?.dailyAttendanceTrend);
  const batches = normalizeBatchAttendance(data?.batchAttendanceComparison);
  const totals = daily.reduce((result, row) => ({ present: result.present + row.present, absent: result.absent + row.absent, leave: result.leave + row.leave, late: result.late + row.late, total: result.total + row.total }), { present: 0, absent: 0, leave: 0, late: 0, total: 0 });
  const rate = totals.total ? Math.round((totals.present / totals.total) * 100) : 0;
  return <><section className={styles.kpis}><Kpi icon={Activity} label="Attendance Rate" value={`${rate}%`} detail={`${totals.present} present markings`} tone="green"/><Kpi icon={UserRoundX} label="Absences" value={totals.absent || data?.absentStudentsCount || 0} detail="Absence records in scope"/><Kpi icon={CalendarCheck2} label="Leave / Late" value={totals.leave + totals.late} detail={`${totals.leave} leave · ${totals.late} late`} tone="blue"/><Kpi icon={Users} label="Batches Compared" value={batches.length} detail={`${totals.total} total markings`} tone="purple"/></section><section className={styles.chartGrid}><ChartCard title="Daily Attendance Trend" subtitle="Present, absent, leave and late markings" empty={!daily.length} wide><ResponsiveContainer width="100%" height="100%"><LineChart data={daily} margin={{ top: 12, right: 16, left: 0, bottom: 0 }}><CartesianGrid stroke="#e8edf3" strokeDasharray="3 4" vertical={false}/><XAxis dataKey="label" axisLine={false} tickLine={false} tick={axisTick}/><YAxis axisLine={false} tickLine={false} tick={axisTick}/><Tooltip contentStyle={tooltipStyle}/><Legend iconType="circle" iconSize={8}/><Line type="monotone" dataKey="present" stroke="#1f9d62" strokeWidth={2.4}/><Line type="monotone" dataKey="absent" stroke="#e50914" strokeWidth={2.2}/><Line type="monotone" dataKey="leave" stroke="#e79a18" strokeWidth={2.2}/><Line type="monotone" dataKey="late" stroke="#2878d0" strokeWidth={2.2}/></LineChart></ResponsiveContainer></ChartCard><ChartCard title="Batch Consistency" subtitle="Attendance percentage by batch" empty={!batches.length}><DistributionBars data={batches} dataKey="rate" horizontal color="#2878d0"/></ChartCard></section></>;
};

const FeesPanel = ({ data, currencySource }) => {
  const trend = data?.monthlyCollectionTrend || [];
  const statuses = normalizeDistribution(data?.pendingPaidPartialStats, (value) => String(value).replaceAll("_", " "));
  const modes = normalizeDistribution(data?.paymentModeDistribution, (value) => formatPaymentMode(value, "Unknown"));
  const collected = sumValues(trend, "value");
  const transactions = sumValues(statuses);
  const paid = statuses.filter((item) => ["paid", "completed", "success"].includes(item.label.toLowerCase())).reduce((total, item) => total + item.value, 0);
  return <><section className={styles.kpis}><Kpi icon={CircleDollarSign} label="Collection" value={formatCurrency(collected, currencySource)} detail="Across the selected period" tone="green"/><Kpi icon={CircleDollarSign} label="Transactions" value={transactions} detail="All payment records" tone="blue"/><Kpi icon={ShieldCheck} label="Paid Records" value={paid} detail={`${transactions ? Math.round((paid / transactions) * 100) : 0}% of transactions`} tone="purple"/><Kpi icon={AlertTriangle} label="Needs Attention" value={Math.max(transactions - paid, 0)} detail="Due, partial or pending records"/></section><section className={styles.chartGrid}><ChartCard title="Collection Trend" subtitle="Fee amount collected by month" empty={!trend.length} wide><TrendArea data={trend} color="#1f9d62" currency currencySource={currencySource}/></ChartCard><ChartCard title="Fee Status" subtitle="Paid, pending and partial transactions" empty={!statuses.length}><DistributionPie data={statuses}/></ChartCard><ChartCard title="Payment Mix" subtitle="Cash, online and split payments" empty={!modes.length}><DistributionBars data={modes} horizontal color="#7255c5"/></ChartCard></section></>;
};

const PerformancePanel = ({ data }) => {
  const medals = normalizeDistribution(data?.medalCount);
  const belts = normalizeDistribution(data?.beltPromotions);
  return <><section className={styles.kpis}><Kpi icon={Trophy} label="Championship Results" value={sumValues(medals)} detail={`${medals.length} result categories`} tone="red"/><Kpi icon={Medal} label="Belt Promotions" value={sumValues(belts)} detail={`${belts.length} promoted belt ranks`} tone="purple"/><Kpi icon={Award} label="Certificates" value={data?.certificates || 0} detail="Certificates issued in scope" tone="blue"/><Kpi icon={Sparkles} label="Skill Average" value={`${data?.skillAverage || 0}%`} detail="Average assessment score" tone="green"/></section><section className={styles.chartGrid}><ChartCard title="Championship Performance" subtitle="Results and medal outcomes" empty={!medals.length} wide><DistributionBars data={medals} color="#e50914"/></ChartCard><ChartCard title="Belt Progression" subtitle="Promotions by awarded belt" empty={!belts.length}><DistributionBars data={belts} horizontal color="#7255c5"/></ChartCard></section></>;
};

const AnalyticsStudio = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const state = useAnalyticsStudio();
  const availableTabs = useMemo(() => TABS.filter((tab) => !tab.feeOnly || state.canManageFees), [state.canManageFees]);
  const requestedTab = searchParams.get("tab") || "overview";
  const activeTab = availableTabs.some((tab) => tab.id === requestedTab) ? requestedTab : "overview";
  const mainBranch = state.branches.find((item) => item?.isMainBranch) || state.branches[0];
  const currencySource = scopeCurrencySource(state.branches, state.filters.branch) || { currencyCode: "MIX", currencySymbol: "MIX " };
  const setTab = (tab) => { const next = new URLSearchParams(searchParams); tab === "overview" ? next.delete("tab") : next.set("tab", tab); setSearchParams(next, { replace: true }); };

  return <div className={`page ${styles.page}`}>
    <AcademyHeroHeader headingId="analytics-academy" academyName={state.academy?.academyName || "KHILADI Academy"} ownerName={state.academy?.ownerName || state.user?.name || "Academy Owner"} logoUrl={state.academy?.logo ? getAcademyLogoUrl(state.academy) : ""} eyebrow="Academy intelligence" addressLabel={mainBranch?.branchName || "Main Branch"} address={joinAddress(mainBranch) || joinAddress(state.academy) || "Complete main branch address not available"} summaryItems={[{ key: "branches", type: "branches", value: state.branches.length, label: `Active ${state.branches.length === 1 ? "Branch" : "Branches"}` }, { key: "students", icon: GraduationCap, value: state.data.overview?.activeStudents || 0, label: "Active Students" }]} action={<button type="button" className={styles.heroRefresh} onClick={state.reload} disabled={state.refreshing}><RefreshCw size={16} className={state.refreshing ? styles.spinning : ""}/>{state.refreshing ? "Refreshing" : "Refresh"}</button>} />
    <nav className={styles.breadcrumb}><Link to="/dashboard">Dashboard</Link><ChevronRight size={13}/><strong>Analytics Studio</strong></nav>
    <header className={styles.heading}><div className={styles.title}><span><BarChart3 size={25}/></span><div><small>Academy intelligence</small><h1>Analytics Studio</h1><p>Understand growth, consistency, collections and athlete progress from one place.</p></div></div></header>
    <AnalyticsFilters branches={state.branches} filters={state.filters} loading={state.refreshing} onChange={state.setFilters} onRefresh={state.reload}/>
    <nav className={styles.tabs} aria-label="Analytics categories">{availableTabs.map((tab) => { const Icon = tab.icon; return <button type="button" key={tab.id} className={activeTab === tab.id ? styles.activeTab : ""} onClick={() => setTab(tab.id)}><Icon size={17}/><span>{tab.label}</span></button>; })}</nav>
    {state.errors.length ? <div className={styles.error}><AlertTriangle size={18}/><div><strong>Some insights could not be loaded</strong><span>{state.errors.join(" · ")}</span></div><button type="button" onClick={state.reload}>Retry</button></div> : null}
    {state.loading ? <div className={styles.loading}><RefreshCw size={28}/><strong>Building your academy insights...</strong><span>Students, attendance, finance and performance data are being analysed.</span></div> : <main className={styles.content}>{activeTab === "overview" ? <Overview data={state.data} canManageFees={state.canManageFees} currencySource={currencySource}/> : null}{activeTab === "students" ? <StudentsPanel data={state.data.students}/> : null}{activeTab === "attendance" ? <AttendancePanel data={state.data.attendance}/> : null}{activeTab === "fees" && state.canManageFees ? <FeesPanel data={state.data.fees} currencySource={currencySource}/> : null}{activeTab === "performance" ? <PerformancePanel data={state.data.performance}/> : null}</main>}
  </div>;
};

export default AnalyticsStudio;
