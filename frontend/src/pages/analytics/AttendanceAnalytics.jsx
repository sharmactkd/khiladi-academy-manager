import React, { useEffect, useState } from "react";

import { getBranches } from "../../api/branchApi";
import { getAttendanceAnalytics } from "../../api/analyticsApi";
import AnalyticsCard from "../../components/analytics/AnalyticsCard";
import LineChartCard from "../../components/analytics/LineChartCard";
import BarChartCard from "../../components/analytics/BarChartCard";

const normalizeDailyTrend = (items = []) => {
  const map = {};

  items.forEach((item) => {
    const label = `${item._id.year}-${String(item._id.month).padStart(
      2,
      "0"
    )}-${String(item._id.day).padStart(2, "0")}`;

    if (!map[label]) {
      map[label] = { label, present: 0, absent: 0, late: 0, value: 0 };
    }

    map[label][item._id.status || "value"] = item.count;
    map[label].value += item.count;
  });

  return Object.values(map);
};

const normalizeBatchComparison = (items = []) =>
  items.map((item, index) => ({
    label: item._id.batch || `Batch ${index + 1}`,
    value: item.count || 0,
  }));

const AttendanceAnalytics = () => {
  const [branches, setBranches] = useState([]);
  const [filters, setFilters] = useState({
    branch: "",
    fromDate: "",
    toDate: "",
  });
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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

      const res = await getAttendanceAnalytics(params);
      setData(res.data || {});
    } catch (err) {
      setError(
        err?.response?.data?.message || "Failed to load attendance analytics"
      );
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

  const dailyTrend = normalizeDailyTrend(data?.dailyAttendanceTrend);
  const batchComparison = normalizeBatchComparison(
    data?.batchAttendanceComparison
  );

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Attendance Analytics</h1>
          <p>Daily attendance trend and batch comparison.</p>
        </div>
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

        <button className="btn btn-primary" onClick={loadAnalytics}>
          {loading ? "Loading..." : "Apply"}
        </button>
      </div>

      {error ? <div className="alert alert-error">{error}</div> : null}

      <div className="analytics-grid">
        <AnalyticsCard
          title="Absent Students"
          value={data?.absentStudentsCount || 0}
          loading={loading}
        />
      </div>

      <div className="charts-grid">
        <LineChartCard title="Daily Attendance Trend" data={dailyTrend} />
        <BarChartCard
          title="Batch Attendance Comparison"
          data={batchComparison}
        />
      </div>
    </div>
  );
};

export default AttendanceAnalytics;