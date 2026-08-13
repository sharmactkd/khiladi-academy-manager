import { useCallback, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Award, BadgeIndianRupee, CalendarCheck2, CircleDollarSign, GraduationCap, IndianRupee, RefreshCw, Sparkles, UserCheck, UserRoundX, Users } from "lucide-react";

import AcademyHeroHeader from "../../components/academy/AcademyHeroHeader.jsx";
import { getAcademyLogoUrl } from "../../utils/fileUrl.js";
import AcademyLogoModal from "./components/AcademyLogoModal.jsx";
import AttendanceOverview from "./components/AttendanceOverview.jsx";
import DashboardAlertsPanel from "./components/DashboardAlertsPanel.jsx";
import DashboardErrorBanner from "./components/DashboardErrorBanner.jsx";
import DashboardFooter from "./components/DashboardFooter.jsx";
import DashboardLoadingState from "./components/DashboardLoadingState.jsx";
import DashboardStats from "./components/DashboardStats.jsx";
import FeeCollectionOverview from "./components/FeeCollectionOverview.jsx";
import ManagementTools from "./components/ManagementTools.jsx";
import PlanUsagePanel from "./components/PlanUsagePanel.jsx";
import QuickActionsPanel from "./components/QuickActionsPanel.jsx";
import RecentActivityPanel from "./components/RecentActivityPanel.jsx";
import { getQuickActions, MANAGEMENT_GROUPS } from "./dashboard.config.js";
import { dateFormatter, formatMoney, getPersonName, joinAddressParts, normalizeDailyAttendance } from "./dashboard.utils.js";
import useOwnerDashboard from "./hooks/useOwnerDashboard.js";
import "./OwnerDashboard.module.css";

const OwnerDashboard = () => {
  const data = useOwnerDashboard();
  const [showLogoModal, setShowLogoModal] = useState(false);
  const closeLogoModal = useCallback(() => setShowLogoModal(false), []);

  const activeBranches = useMemo(
    () => Array.isArray(data.branches) ? data.branches.filter((branch) => branch?.isActive !== false) : [],
    [data.branches]
  );
  const mainBranch = useMemo(
    () => activeBranches.find((branch) => branch?.isMainBranch) || activeBranches[0] || null,
    [activeBranches]
  );
  const mainBranchAddress = useMemo(
    () => mainBranch
      ? joinAddressParts([mainBranch.address, mainBranch.city, mainBranch.state, mainBranch.country])
      : joinAddressParts([data.academy?.address, data.academy?.city, data.academy?.state, data.academy?.country]),
    [data.academy, mainBranch]
  );

  const activeBranchCount = Array.isArray(data.branches) ? activeBranches.length : 0;
  const activeBatchCount = Array.isArray(data.batches)
    ? data.batches.filter((batch) => batch?.isActive !== false).length
    : Number(data.dashboard?.totalBatches || 0);
  const academyLogoUrl = data.academy?.logo ? getAcademyLogoUrl(data.academy) : "";
  const academyName = data.academy?.academyName || "KHILADI Academy";
  const ownerName = data.academy?.ownerName || data.user?.name || "Academy Owner";

  const attendanceChartData = useMemo(
    () => normalizeDailyAttendance(data.attendanceAnalytics?.dailyAttendanceTrend || []),
    [data.attendanceAnalytics?.dailyAttendanceTrend]
  );
  const lastAttendanceMarked = useMemo(() => {
    const latest = [...attendanceChartData].reverse().find((item) => Number(item?.markedCount || 0) > 0);
    if (!latest?.key) return null;
    const [year, month, day] = latest.key.split("-").map(Number);
    const parsedDate = new Date(year, month - 1, day);
    return Number.isNaN(parsedDate.getTime()) ? null : { dateTime: latest.key, label: dateFormatter.format(parsedDate) };
  }, [attendanceChartData]);

  const feeTotal = Number(data.dashboard?.monthlyFeesCollected || 0) + Number(data.dashboard?.pendingFees || 0);
  const feeCollectionRate = feeTotal ? Math.round((Number(data.dashboard?.monthlyFeesCollected || 0) / feeTotal) * 100) : 0;
  const feeChartData = [
    { name: "Collected", value: Number(data.dashboard?.monthlyFeesCollected || 0), color: "#169447" },
    { name: "Outstanding", value: Number(data.dashboard?.pendingFees || 0), color: "#cf0006" },
  ];

  const recentActivity = useMemo(() => {
    const admissions = (data.dashboard?.recentAdmissions || []).map((student) => ({
      id: `student-${student._id}`,
      type: "student",
      title: `${getPersonName(student)} joined the academy`,
      meta: student.admissionNumber || "New admission",
      time: student.createdAt,
    }));
    const payments = (data.dashboard?.recentPayments || []).map((payment) => ({
      id: `payment-${payment._id}`,
      type: "payment",
      title: `Fee received from ${getPersonName(payment.student)}`,
      meta: formatMoney(payment.amountPaid || payment.amount),
      time: payment.createdAt || payment.paymentDate,
    }));
    return [...admissions, ...payments].sort((left, right) => new Date(right.time || 0) - new Date(left.time || 0)).slice(0, 6);
  }, [data.dashboard?.recentAdmissions, data.dashboard?.recentPayments]);

  const alerts = useMemo(() => {
    const incompleteProfiles = (data.dashboard?.recentAdmissions || []).filter((student) => student.profileStatus === "incomplete").length;
    return [
      incompleteProfiles ? { icon: UserRoundX, title: "Profile incomplete", text: `${incompleteProfiles} recent profile(s) need details`, count: incompleteProfiles, tone: "orange", to: "/students" } : null,
      Number(data.dashboard?.pendingFees) > 0 ? { icon: IndianRupee, title: "Fee outstanding", text: `${formatMoney(data.dashboard.pendingFees)} currently pending`, count: null, tone: "red", to: "/fees" } : null,
      Number(data.dashboard?.inactiveStudents) > 0 ? { icon: UserRoundX, title: "Inactive students", text: `${data.dashboard.inactiveStudents} student(s) are inactive`, count: data.dashboard.inactiveStudents, tone: "slate", to: "/students" } : null,
      Number(data.dashboard?.upcomingBeltTests) > 0 ? { icon: Award, title: "Belt tests scheduled", text: `${data.dashboard.upcomingBeltTests} upcoming test(s)`, count: data.dashboard.upcomingBeltTests, tone: "purple", to: "/belt-tests" } : null,
    ].filter(Boolean);
  }, [data.dashboard]);

  const stats = [
    { icon: Users, title: "Total students", value: data.dashboard?.totalStudents || 0 },
    { icon: UserCheck, title: "Active students", value: data.dashboard?.activeStudents || 0, tone: "green" },
    { icon: UserRoundX, title: "Inactive students", value: data.dashboard?.inactiveStudents || 0, tone: "orange" },
    { icon: CalendarCheck2, title: "Today attendance", value: `${data.dashboard?.todayAttendancePercentage || 0}%`, subtitle: `${data.dashboard?.todayAttendanceCount || 0} marked`, tone: "blue" },
    { icon: BadgeIndianRupee, title: "Fees collected", value: formatMoney(data.dashboard?.monthlyFeesCollected), tone: "green" },
    { icon: CircleDollarSign, title: "Outstanding", value: formatMoney(data.dashboard?.pendingFees), tone: "red" },
  ];
  const medalsTotal = Object.values(data.dashboard?.medalCount || {}).reduce((sum, count) => sum + Number(count || 0), 0);

  if (data.loading) return <DashboardLoadingState />;

  return (
    <div className="owner-dashboard">
      <AcademyHeroHeader
        academyName={academyName}
        ownerName={ownerName}
        logoUrl={academyLogoUrl}
        addressLabel={mainBranch?.branchName || "Main Branch"}
        address={mainBranchAddress}
        onLogoClick={academyLogoUrl ? () => setShowLogoModal(true) : undefined}
        summaryItems={[
          { type: "branches", value: activeBranchCount, label: `Active ${activeBranchCount === 1 ? "Branch" : "Branches"}` },
          { type: "batches", value: activeBatchCount, label: `Active ${activeBatchCount === 1 ? "Batch" : "Batches"}` },
        ]}
        action={
          <button type="button" className="owner-dashboard__refresh" onClick={() => data.loadDashboard({ quiet: true })} disabled={data.refreshing} aria-label="Refresh dashboard" title="Refresh dashboard">
            <RefreshCw size={17} className={data.refreshing ? "is-spinning" : ""} />
            {data.refreshing ? "Refreshing" : "Refresh"}
          </button>
        }
      />

      <DashboardErrorBanner error={data.error} onRetry={() => data.loadDashboard()} />

      {!data.academy ? (
        <section className="owner-dashboard__onboarding">
          <GraduationCap size={38} />
          <div><h2>Create your academy profile</h2><p>Complete your academy identity before adding operational data.</p></div>
          <Link className="btn btn-primary" to="/onboarding/create-academy">Create profile</Link>
        </section>
      ) : null}

      {data.hasAnalyticsAccess && data.dashboard ? (
        <>
          <DashboardStats items={stats} />
          <section className="owner-insights">
            <AttendanceOverview data={attendanceChartData} dashboard={data.dashboard} lastAttendanceMarked={lastAttendanceMarked} />
            <FeeCollectionOverview canManageFees={data.canManageFees} data={feeChartData} rate={feeCollectionRate} total={feeTotal} />
          </section>
          <section className="owner-bottom-grid">
            <QuickActionsPanel actions={getQuickActions(data.canManageFees)} />
            <RecentActivityPanel items={recentActivity} />
            <DashboardAlertsPanel alerts={alerts} />
          </section>
        </>
      ) : data.canManageRecords ? (
        <section className="owner-dashboard__locked">
          <Sparkles size={30} />
          <div><h2>Unlock Academy Analytics</h2><p>Your current plan does not include the advanced dashboard. Upgrade to view attendance, fees and performance insights.</p></div>
          <Link className="btn btn-primary" to="/plans">View plans</Link>
        </section>
      ) : null}

      <ManagementTools groups={MANAGEMENT_GROUPS} />
      {data.canManageBilling ? <PlanUsagePanel billing={data.billing} limits={data.limits} plan={data.plan} usage={data.usage} /> : null}
      <DashboardFooter medalsTotal={medalsTotal} />
      <AcademyLogoModal academyName={academyName} logoUrl={academyLogoUrl} onClose={closeLogoModal} open={showLogoModal} />
    </div>
  );
};

export default OwnerDashboard;
