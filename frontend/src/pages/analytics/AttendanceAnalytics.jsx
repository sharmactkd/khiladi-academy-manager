import React, { useEffect, useState } from "react";

import { getBranches } from "../../api/branchApi";
import { getAttendanceAnalytics } from "../../api/analyticsApi";
import AnalyticsCard from "../../components/analytics/AnalyticsCard";
import LineChartCard from "../../components/analytics/LineChartCard";
import BarChartCard from "../../components/analytics/BarChartCard";

const getPayload = (response) => {
  return response?.data?.data || response?.data || response || {};
};

const normalizeDailyTrend = (items = []) => {
  if (!Array.isArray(items)) return [];

  const map = {};

  items.forEach((item) => {
    const id = item?._id || {};
    const year = id.year;
    const month = id.month;
    const day = id.day;
    const status = id.status || "value";

    if (!year || !month || !day) return;

    const label = `${year}-${String(month).padStart(2, "0")}-${String(
      day
    ).padStart(2, "0")}`;

    if (!map[label]) {
      map[label] = {
        label,
        present: 0,
        absent: 0,
        late: 0,
        leave: 0,
        value: 0,
      };
    }

    map[label][status] = item.count || 0;
    map[label].value += item.count || 0;
  });

  return Object.values(map);
};

const normalizeBatchComparison = (items = []) => {
  if (!Array.isArray(items)) return [];

  const map = {};

  items.forEach((item) => {
    const id = item?._id || {};
    const batchKey = String(id.batch || item.batchName || "unknown");
    const label = item.batchName || "Unknown Batch";
    const status = id.status || "value";

    if (!map[batchKey]) {
      map[batchKey] = {
        label,
        present: 0,
        absent: 0,
        late: 0,
        leave: 0,
        value: 0,
      };
    }

    map[batchKey][status] = item.count || 0;
    map[batchKey].value += item.count || 0;
  });

  return Object.values(map);
};

const AttendanceAnalytics = () => {
  const [branches, setBranches] = useState([]);
  const [filters, setFilters] = useState({
    branch: "",
    fromDate: "",
    toDate: "",
  });
  const [data, setData] = useState({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const loadBranches = async () => {
    try {
      const res = await getBranches({ status: "active" });
      const payload = getPayload(res);
      setBranches(Array.isArray(payload) ? payload : []);
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
      const payload = getPayload(res);

      setData(payload || {});
    } catch (err) {
      setData({});
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
              {branch.branchName || branch.name || "Unnamed Branch"}
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

        <button
          type="button"
          className="btn btn-primary"
          onClick={loadAnalytics}
          disabled={loading}
        >
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
  {dailyTrend.length ? (
    <LineChartCard title="Daily Attendance Trend" data={dailyTrend} />
  ) : (
    <div className="card">
      <h3>Daily Attendance Trend</h3>
      <p className="muted">No attendance trend data found.</p>
    </div>
  )}

  {batchComparison.length ? (
    <BarChartCard
      title="Batch Attendance Comparison"
      data={batchComparison}
    />
  ) : (
    <div className="card">
      <h3>Batch Attendance Comparison</h3>
      <p className="muted">No batch comparison data found.</p>
    </div>
  )}
</div>
    </div>
  );
};

export default AttendanceAnalytics;