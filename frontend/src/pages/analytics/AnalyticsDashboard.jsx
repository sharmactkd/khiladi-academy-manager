import React, { useEffect, useState } from "react";

import { getBranches } from "../../api/branchApi";
import { getDashboardAnalytics } from "../../api/analyticsApi";
import AnalyticsCard from "../../components/analytics/AnalyticsCard";

const AnalyticsDashboard = () => {
  const [branches, setBranches] = useState([]);
  const [filters, setFilters] = useState({
    branch: "",
    fromDate: "",
    toDate: "",
  });
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadBranches = async () => {
    try {
      const res = await getBranches({ status: "active" });
      setBranches(res.data || []);
    } catch {
      setBranches([]);
    }
  };

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError("");

      const params = Object.fromEntries(
        Object.entries(filters).filter(([, value]) => value)
      );

      const res = await getDashboardAnalytics(params);
      setData(res.data || {});
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBranches();
    loadAnalytics();
  }, []);

  const updateFilter = (name, value) => {
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Analytics Dashboard</h1>
          <p>Academy summary, attendance, fees and activity overview.</p>
        </div>

        <button className="btn btn-primary" onClick={loadAnalytics}>
          Refresh
        </button>
      </div>

      <div className="filter-card">
        <select
          value={filters.branch}
          onChange={(e) => updateFilter("branch", e.target.value)}
        >
          <option value="">All Branches</option>
          {branches.map((branch) => (
            <option key={branch._id} value={branch._id}>
              {branch.branchName}
            </option>
          ))}
        </select>

        <input
          type="date"
          value={filters.fromDate}
          onChange={(e) => updateFilter("fromDate", e.target.value)}
        />

        <input
          type="date"
          value={filters.toDate}
          onChange={(e) => updateFilter("toDate", e.target.value)}
        />

        <button className="btn btn-secondary" onClick={loadAnalytics}>
          Apply
        </button>
      </div>

      {error ? <div className="alert alert-error">{error}</div> : null}

      <div className="analytics-grid">
        <AnalyticsCard
          title="Total Students"
          value={data?.totalStudents}
          loading={loading}
        />
        <AnalyticsCard
          title="Active Students"
          value={data?.activeStudents}
          loading={loading}
        />
        <AnalyticsCard
          title="Inactive Students"
          value={data?.inactiveStudents}
          loading={loading}
        />
        <AnalyticsCard
          title="Left Students"
          value={data?.leftStudents}
          loading={loading}
        />
        <AnalyticsCard
          title="Total Batches"
          value={data?.totalBatches}
          loading={loading}
        />
        <AnalyticsCard
          title="Monthly Fees"
          value={`₹${data?.monthlyFeesCollected || 0}`}
          loading={loading}
        />
        <AnalyticsCard
          title="Pending Fees"
          value={`₹${data?.pendingFees || 0}`}
          loading={loading}
        />
        <AnalyticsCard
          title="Today Attendance"
          value={`${data?.todayAttendancePercentage || 0}%`}
          loading={loading}
        />
        <AnalyticsCard
          title="Upcoming Belt Tests"
          value={data?.upcomingBeltTests}
          loading={loading}
        />
        <AnalyticsCard
          title="Certificates Issued"
          value={data?.certificatesIssued}
          loading={loading}
        />
        <AnalyticsCard
          title="ID Cards Generated"
          value={data?.idCardsGenerated}
          loading={loading}
        />
      </div>

      <div className="dashboard-two-column">
        <div className="card">
          <h3>Recent Admissions</h3>
          {data?.recentAdmissions?.length ? (
            data.recentAdmissions.map((student) => (
              <div key={student._id} className="list-row">
                <strong>
                  {student.firstName} {student.lastName}
                </strong>
                <span>{student.admissionNumber}</span>
              </div>
            ))
          ) : (
            <p>No recent admissions.</p>
          )}
        </div>

        <div className="card">
          <h3>Recent Payments</h3>
          {data?.recentPayments?.length ? (
            data.recentPayments.map((payment) => (
              <div key={payment._id} className="list-row">
                <strong>
                  {payment.student?.firstName} {payment.student?.lastName}
                </strong>
                <span>₹{payment.amountPaid || payment.amount || 0}</span>
              </div>
            ))
          ) : (
            <p>No recent payments.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;