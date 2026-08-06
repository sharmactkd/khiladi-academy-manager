import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  Award,
  BadgeIndianRupee,
  CalendarCheck2,
  ChevronRight,
  CircleDollarSign,
  FileSpreadsheet,
  GraduationCap,
  IdCard,
  IndianRupee,
  Medal,
  Plus,
  RefreshCw,
  Sparkles,
  Trophy,
  UserCheck,
  UserPlus,
  UserRoundX,
  Users,
} from "lucide-react";
import {
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { academyApi } from "../../api/academyApi.js";
import { billingApi } from "../../api/billingApi.js";
import {
  getAttendanceAnalytics,
  getDashboardAnalytics,
  getFeesAnalytics,
} from "../../api/analyticsApi.js";
import { getAcademyLogoUrl } from "../../utils/fileUrl.js";
import useAuth from "../../hooks/useAuth.js";
import UsageMeter from "../../components/billing/UsageMeter.jsx";

const moneyFormatter = new Intl.NumberFormat("en-IN", {
  maximumFractionDigits: 0,
});

const dateFormatter = new Intl.DateTimeFormat("en-IN", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

const formatMoney = (value) => `₹${moneyFormatter.format(Number(value) || 0)}`;

const isEnabled = (value) =>
  value === true ||
  value === "true" ||
  value === "enabled" ||
  value === "yes" ||
  value === 1 ||
  value === "1" ||
  value === "unlimited";

const getPersonName = (person) =>
  `${person?.firstName || ""} ${person?.lastName || ""}`.trim() ||
  "Unknown student";

const formatRelativeTime = (value) => {
  if (!value) return "";
  const time = new Date(value).getTime();
  if (Number.isNaN(time)) return "";

  const difference = Math.max(0, Date.now() - time);
  const minutes = Math.floor(difference / 60000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;

  const days = Math.floor(hours / 24);
  return days === 1 ? "Yesterday" : `${days} days ago`;
};

const normalizeDailyAttendance = (items = []) => {
  const grouped = new Map();

  items.forEach((item) => {
    const parts = item?._id || {};
    if (!parts.year || !parts.month || !parts.day) return;

    const date = new Date(parts.year, parts.month - 1, parts.day);
    const key = `${parts.year}-${String(parts.month).padStart(2, "0")}-${String(
      parts.day
    ).padStart(2, "0")}`;

    if (!grouped.has(key)) {
      grouped.set(key, {
        key,
        label: `${parts.day} ${date.toLocaleDateString("en-IN", {
          month: "short",
        })}`,
        present: 0,
        absent: 0,
        leave: 0,
        late: 0,
      });
    }

    const row = grouped.get(key);
    const status = String(parts.status || "").toLowerCase();
    if (Object.hasOwn(row, status)) row[status] += Number(item.count) || 0;
  });

  return [...grouped.values()]
    .sort((left, right) => left.key.localeCompare(right.key))
    .slice(-12)
    .map((row) => {
      const total = row.present + row.absent + row.leave + row.late;
      return {
        ...row,
        attendance: total ? Math.round((row.present / total) * 100) : 0,
      };
    });
};

const StatCard = ({ icon: Icon, title, value, tone = "red", subtitle }) => (
  <article className={`owner-stat owner-stat--${tone}`}>
    <span className="owner-stat__icon" aria-hidden="true">
      <Icon size={23} strokeWidth={2.2} />
    </span>

    <span className="owner-stat__copy">
      <small>{title}</small>
      <strong>{value}</strong>
      {subtitle ? <span>{subtitle}</span> : null}
    </span>
  </article>
);

const EmptyChart = ({ children }) => (
  <div className="owner-dashboard__empty-chart">{children}</div>
);

const OwnerDashboard = () => {
  const { user } = useAuth();

  const [academy, setAcademy] = useState(null);
  const [billing, setBilling] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [attendanceAnalytics, setAttendanceAnalytics] = useState(null);
  const [feesAnalytics, setFeesAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [showLogoModal, setShowLogoModal] = useState(false);

  const canManageRecords = [
    "super_admin",
    "academy_owner",
    "assistant_coach",
  ].includes(user?.role);
  const canManageFees = ["super_admin", "academy_owner"].includes(user?.role);
  const canManageBilling = ["super_admin", "academy_owner"].includes(user?.role);

  const plan = billing?.plan || {};
  const usage = billing?.usage || {};
  const limits = plan?.limits || {};

  const hasAnalyticsAccess = useMemo(
    () => user?.role === "super_admin" || isEnabled(limits?.analytics),
    [limits?.analytics, user?.role]
  );

  const academyLogoUrl = academy?.logo ? getAcademyLogoUrl(academy) : "";
  const academyName = academy?.academyName || "KHILADI Academy";
  const academyLocation = [academy?.city, academy?.state]
    .filter(Boolean)
    .join(", ");

  const loadDashboard = useCallback(
    async ({ quiet = false } = {}) => {
      if (quiet) setRefreshing(true);
      else setLoading(true);
      setError("");

      try {
        const academyResponse = await academyApi.getMyAcademy();
        const academyData = academyResponse.data?.data?.academy || null;
        setAcademy(academyData);

        let billingData = null;
        if (canManageBilling) {
          try {
            const billingResponse = await billingApi.getMySubscription();
            billingData = billingResponse.data?.data || null;
            setBilling(billingData);
          } catch {
            setBilling(null);
          }
        }

        const analyticsAllowed =
          user?.role === "super_admin" ||
          isEnabled(billingData?.plan?.limits?.analytics);

        if (canManageRecords && analyticsAllowed) {
          const requests = [
            getDashboardAnalytics(),
            getAttendanceAnalytics(),
            canManageFees ? getFeesAnalytics() : Promise.resolve(null),
          ];

          const [dashboardResult, attendanceResult, feesResult] =
            await Promise.allSettled(requests);

          setDashboard(
            dashboardResult.status === "fulfilled"
              ? dashboardResult.value?.data || null
              : null
          );
          setAttendanceAnalytics(
            attendanceResult.status === "fulfilled"
              ? attendanceResult.value?.data || null
              : null
          );
          setFeesAnalytics(
            feesResult.status === "fulfilled"
              ? feesResult.value?.data || null
              : null
          );

          if (dashboardResult.status === "rejected") {
            setError(
              dashboardResult.reason?.response?.data?.message ||
                "Dashboard analytics could not be loaded."
            );
          }
        } else {
          setDashboard(null);
          setAttendanceAnalytics(null);
          setFeesAnalytics(null);
        }
      } catch (requestError) {
        setAcademy(null);
        setError(
          requestError?.response?.data?.message ||
            "Dashboard could not be loaded. Please try again."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [canManageBilling, canManageFees, canManageRecords, user?.role]
  );

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const attendanceChartData = useMemo(
    () =>
      normalizeDailyAttendance(
        attendanceAnalytics?.dailyAttendanceTrend || []
      ),
    [attendanceAnalytics?.dailyAttendanceTrend]
  );

  const feeTotal =
    Number(dashboard?.monthlyFeesCollected || 0) +
    Number(dashboard?.pendingFees || 0);
  const feeCollectionRate = feeTotal
    ? Math.round((Number(dashboard?.monthlyFeesCollected || 0) / feeTotal) * 100)
    : 0;
  const feeChartData = [
    {
      name: "Collected",
      value: Number(dashboard?.monthlyFeesCollected || 0),
      color: "#169447",
    },
    {
      name: "Outstanding",
      value: Number(dashboard?.pendingFees || 0),
      color: "#cf0006",
    },
  ];

  const recentActivity = useMemo(() => {
    const admissions = (dashboard?.recentAdmissions || []).map((student) => ({
      id: `student-${student._id}`,
      type: "student",
      title: `${getPersonName(student)} joined the academy`,
      meta: student.admissionNumber || "New admission",
      time: student.createdAt,
    }));

    const payments = (dashboard?.recentPayments || []).map((payment) => ({
      id: `payment-${payment._id}`,
      type: "payment",
      title: `Fee received from ${getPersonName(payment.student)}`,
      meta: formatMoney(payment.amountPaid || payment.amount),
      time: payment.createdAt || payment.paymentDate,
    }));

    return [...admissions, ...payments]
      .sort((left, right) => new Date(right.time || 0) - new Date(left.time || 0))
      .slice(0, 6);
  }, [dashboard?.recentAdmissions, dashboard?.recentPayments]);

  const incompleteRecentProfiles = (dashboard?.recentAdmissions || []).filter(
    (student) => student.profileStatus === "incomplete"
  ).length;

  const alerts = [
    incompleteRecentProfiles
      ? {
          icon: UserRoundX,
          title: "Profile incomplete",
          text: `${incompleteRecentProfiles} recent profile(s) need details`,
          count: incompleteRecentProfiles,
          tone: "orange",
          to: "/students",
        }
      : null,
    Number(dashboard?.pendingFees) > 0
      ? {
          icon: IndianRupee,
          title: "Fee outstanding",
          text: `${formatMoney(dashboard.pendingFees)} currently pending`,
          count: null,
          tone: "red",
          to: "/fees",
        }
      : null,
    Number(dashboard?.inactiveStudents) > 0
      ? {
          icon: UserRoundX,
          title: "Inactive students",
          text: `${dashboard.inactiveStudents} student(s) are inactive`,
          count: dashboard.inactiveStudents,
          tone: "slate",
          to: "/students",
        }
      : null,
    Number(dashboard?.upcomingBeltTests) > 0
      ? {
          icon: Award,
          title: "Belt tests scheduled",
          text: `${dashboard.upcomingBeltTests} upcoming test(s)`,
          count: dashboard.upcomingBeltTests,
          tone: "purple",
          to: "/belt-tests",
        }
      : null,
  ].filter(Boolean);

  const medalsTotal = Object.values(dashboard?.medalCount || {}).reduce(
    (sum, count) => sum + Number(count || 0),
    0
  );

  if (loading) {
    return (
      <div className="owner-dashboard owner-dashboard--loading" aria-live="polite">
        <div className="owner-dashboard__loader" />
        <strong>Preparing your academy dashboard…</strong>
      </div>
    );
  }

  return (
    <div className="owner-dashboard">
      <section className="owner-hero">
        <div className="owner-hero__brand" aria-hidden="true">
          {academyLogoUrl ? (
            <button type="button" onClick={() => setShowLogoModal(true)}>
              <img src={academyLogoUrl} alt="" />
            </button>
          ) : (
            <GraduationCap size={58} strokeWidth={1.7} />
          )}
        </div>

        <div className="owner-hero__content">
          <span className="owner-hero__eyebrow">Academy command center</span>
          <h1>{academyName}</h1>
          <p>{academyLocation || "Champions in training, leaders for life"}</p>
          <strong>
            <Sparkles size={15} aria-hidden="true" /> KHILADI Academy Manager
          </strong>
        </div>

        <div className="owner-hero__decoration" aria-hidden="true">
          <div className="owner-hero__dots" />
          <i />
          <i />
        </div>

        <button
          type="button"
          className="owner-dashboard__refresh"
          onClick={() => loadDashboard({ quiet: true })}
          disabled={refreshing}
          aria-label="Refresh dashboard"
          title="Refresh dashboard"
        >
          <RefreshCw size={17} className={refreshing ? "is-spinning" : ""} />
          {refreshing ? "Refreshing" : "Refresh"}
        </button>
      </section>

      {error ? (
        <div className="owner-dashboard__error" role="alert">
          <AlertTriangle size={18} />
          <span>{error}</span>
          <button type="button" onClick={() => loadDashboard()}>
            Retry
          </button>
        </div>
      ) : null}

      {!academy ? (
        <section className="owner-dashboard__onboarding">
          <GraduationCap size={38} />
          <div>
            <h2>Create your academy profile</h2>
            <p>Complete your academy identity before adding operational data.</p>
          </div>
          <Link className="btn btn-primary" to="/onboarding/create-academy">
            Create profile
          </Link>
        </section>
      ) : null}

      {hasAnalyticsAccess && dashboard ? (
        <>
          <section className="owner-stats" aria-label="Academy summary">
            <StatCard icon={Users} title="Total students" value={dashboard.totalStudents || 0} />
            <StatCard icon={UserCheck} title="Active students" value={dashboard.activeStudents || 0} tone="green" />
            <StatCard icon={UserRoundX} title="Inactive students" value={dashboard.inactiveStudents || 0} tone="orange" />
            <StatCard icon={CalendarCheck2} title="Today attendance" value={`${dashboard.todayAttendancePercentage || 0}%`} subtitle={`${dashboard.todayAttendanceCount || 0} marked`} tone="blue" />
            <StatCard icon={BadgeIndianRupee} title="Fees collected" value={formatMoney(dashboard.monthlyFeesCollected)} tone="green" />
            <StatCard icon={CircleDollarSign} title="Outstanding" value={formatMoney(dashboard.pendingFees)} tone="red" />
          </section>

          <section className="owner-insights">
            <article className="owner-panel owner-panel--attendance">
              <header className="owner-panel__header">
                <div><span>Performance</span><h2>Attendance overview</h2></div>
                <Link to="/analytics">Detailed analytics <ChevronRight size={15} /></Link>
              </header>

              {attendanceChartData.length ? (
                <div className="owner-chart">
                  <ResponsiveContainer width="100%" height={285}>
                    <ComposedChart data={attendanceChartData} margin={{ top: 18, right: 10, left: -22, bottom: 0 }}>
                      <CartesianGrid stroke="#e8edf3" strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="label" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis yAxisId="count" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis yAxisId="percentage" orientation="right" domain={[0, 100]} tickFormatter={(value) => `${value}%`} tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid #e2e8f0" }} />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                      <Bar yAxisId="count" dataKey="present" name="Present" fill="#169447" radius={[5, 5, 0, 0]} barSize={17} />
                      <Bar yAxisId="count" dataKey="absent" name="Absent" fill="#ef4444" radius={[5, 5, 0, 0]} barSize={17} />
                      <Line yAxisId="percentage" type="monotone" dataKey="attendance" name="Attendance %" stroke="#08162f" strokeWidth={2.5} dot={{ r: 3, fill: "#08162f" }} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <EmptyChart>Attendance trend will appear after attendance is marked.</EmptyChart>
              )}

              <footer className="owner-panel__metrics">
                <div><small>Today marked</small><strong>{dashboard.todayAttendanceCount || 0}</strong></div>
                <div><small>Attendance rate</small><strong>{dashboard.todayAttendancePercentage || 0}%</strong></div>
                <div><small>Active batches</small><strong>{dashboard.totalBatches || 0}</strong></div>
                <div><small>Upcoming tests</small><strong>{dashboard.upcomingBeltTests || 0}</strong></div>
              </footer>
            </article>

            <article className="owner-panel owner-panel--fees">
              <header className="owner-panel__header">
                <div><span>Finance</span><h2>Fee collection overview</h2></div>
                {canManageFees ? <Link to="/fees">Open fees <ChevronRight size={15} /></Link> : null}
              </header>

              {feeTotal > 0 ? (
                <div className="owner-fee-chart">
                  <div className="owner-fee-chart__visual">
                    <ResponsiveContainer width="100%" height={230}>
                      <PieChart>
                        <Pie data={feeChartData} dataKey="value" nameKey="name" innerRadius={68} outerRadius={94} startAngle={90} endAngle={-270} paddingAngle={2}>
                          {feeChartData.map((item) => <Cell key={item.name} fill={item.color} />)}
                        </Pie>
                        <Tooltip formatter={(value) => formatMoney(value)} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="owner-fee-chart__center"><strong>{feeCollectionRate}%</strong><small>collection rate</small></div>
                  </div>

                  <div className="owner-fee-chart__legend">
                    {feeChartData.map((item) => <div key={item.name}><span style={{ backgroundColor: item.color }} /><small>{item.name}</small><strong>{formatMoney(item.value)}</strong></div>)}
                  </div>
                </div>
              ) : (
                <EmptyChart>Fee summary will appear after fee records are added.</EmptyChart>
              )}
            </article>
          </section>

          <section className="owner-bottom-grid">
            <article className="owner-panel owner-quick-actions">
              <header className="owner-panel__header"><div><span>Shortcuts</span><h2>Quick actions</h2></div></header>
              <div className="owner-quick-actions__grid">
                <Link to="/attendance"><CalendarCheck2 /><span>Mark attendance</span></Link>
                <Link to="/students/new"><UserPlus /><span>Add student</span></Link>
                {canManageFees ? <Link to="/fees"><IndianRupee /><span>Collect fee</span></Link> : null}
                <Link to="/attendance/monthly-register"><FileSpreadsheet /><span>Monthly register</span></Link>
                <Link to="/id-cards/generate"><IdCard /><span>Generate ID</span></Link>
                <Link to="/belt-tests"><Award /><span>Belt tests</span></Link>
              </div>
            </article>

            <article className="owner-panel owner-activity">
              <header className="owner-panel__header"><div><span>Updates</span><h2>Recent activity</h2></div></header>
              <div className="owner-activity__list">
                {recentActivity.length ? recentActivity.map((item) => {
                  const Icon = item.type === "payment" ? IndianRupee : UserPlus;
                  return <div key={item.id} className={`owner-activity__item owner-activity__item--${item.type}`}><span><Icon size={16} /></span><div><strong>{item.title}</strong><small>{item.meta}</small></div><time>{formatRelativeTime(item.time)}</time></div>;
                }) : <p className="owner-panel__empty">No recent activity.</p>}
              </div>
            </article>

            <article className="owner-panel owner-alerts">
              <header className="owner-panel__header"><div><span>Attention</span><h2>Alerts</h2></div></header>
              <div className="owner-alerts__list">
                {alerts.length ? alerts.map((alert) => {
                  const Icon = alert.icon;
                  return <Link key={alert.title} to={alert.to} className={`owner-alert owner-alert--${alert.tone}`}><span><Icon size={17} /></span><div><strong>{alert.title}</strong><small>{alert.text}</small></div>{alert.count !== null ? <b>{alert.count}</b> : <ChevronRight size={16} />}</Link>;
                }) : <div className="owner-alerts__clear"><UserCheck size={28} /><strong>All clear</strong><small>No action-required alerts right now.</small></div>}
              </div>
            </article>
          </section>
        </>
      ) : canManageRecords ? (
        <section className="owner-dashboard__locked">
          <Sparkles size={30} />
          <div><h2>Unlock Academy Analytics</h2><p>Your current plan does not include the advanced dashboard. Upgrade to view attendance, fees and performance insights.</p></div>
          <Link className="btn btn-primary" to="/plans">View plans</Link>
        </section>
      ) : null}

      <section className="owner-management">
        <header><div><span>Academy workspace</span><h2>Management tools</h2></div><p>All existing academy, document and communication features remain available.</p></header>
        <div className="owner-management__grid">
          <article><span><Users /></span><h3>Academy records</h3><p>Students, branches, batches and reports.</p><div><Link to="/students">Students</Link><Link to="/branches">Branches</Link><Link to="/reports">Reports</Link></div></article>
          <article><span><Trophy /></span><h3>Achievements</h3><p>Belt tests, championships and performance.</p><div><Link to="/belt-tests">Belt tests</Link><Link to="/championship-records">Championships</Link><Link to="/skills">Skills</Link></div></article>
          <article><span><IdCard /></span><h3>Documents</h3><p>Generate professional identity and award documents.</p><div><Link to="/id-cards/generate">ID cards</Link><Link to="/certificates/generate">Certificates</Link><Link to="/certificate-templates">Templates</Link></div></article>
          <article><span><Medal /></span><h3>Communication</h3><p>Parent links, announcements and reminders.</p><div><Link to="/parent-links">Parents</Link><Link to="/announcements">Announcements</Link><Link to="/communication-logs">Logs</Link></div></article>
        </div>
      </section>

      {canManageBilling && billing ? (
        <section className="owner-plan owner-panel">
          <header className="owner-panel__header"><div><span>Subscription</span><h2>{plan.name || "Free"} plan usage</h2></div><Link to="/billing">Billing dashboard <ChevronRight size={15} /></Link></header>
          <div className="usage-grid"><UsageMeter label="Students" used={usage.students} limit={limits.students} /><UsageMeter label="Batches" used={usage.batches} limit={limits.batches} /><UsageMeter label="Certificates" used={usage.certificates} limit={limits.certificates} /><UsageMeter label="ID Cards" used={usage.idCards} limit={limits.idCards} /><UsageMeter label="Announcements" used={usage.announcements} limit={limits.announcements} /></div>
          <div className="owner-plan__links"><Link to="/plans">View plans</Link><Link to="/billing/invoices">Invoices</Link><Link to="/billing/payments">Payment history</Link></div>
        </section>
      ) : null}

      <footer className="owner-dashboard__footer">
        <span>KHILADI Academy Manager</span>
        <span>{dateFormatter.format(new Date())}</span>
        <span>{medalsTotal} recorded medal{medalsTotal === 1 ? "" : "s"}</span>
      </footer>

      {showLogoModal && academyLogoUrl ? (
        <div className="owner-logo-modal" onClick={() => setShowLogoModal(false)} role="presentation">
          <div onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true" aria-label="Academy logo preview">
            <header><div><span>Academy identity</span><h2>{academyName}</h2></div><button type="button" onClick={() => setShowLogoModal(false)}>Close</button></header>
            <img src={academyLogoUrl} alt={`${academyName} logo`} />
            <Link className="btn btn-primary" to="/academy/profile">Change logo</Link>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default OwnerDashboard;
