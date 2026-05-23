import React, { useEffect, useState } from "react";

import { getBranches } from "../../api/branchApi";
import { getPerformanceAnalytics } from "../../api/analyticsApi";
import AnalyticsCard from "../../components/analytics/AnalyticsCard";
import BarChartCard from "../../components/analytics/BarChartCard";

const normalizeItems = (items = []) =>
  items.map((item) => ({
    label: item._id || "Unknown",
    value: item.count || 0,
  }));

const PerformanceAnalytics = () => {
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

      const res = await getPerformanceAnalytics(params);
      setData(res.data || {});
    } catch (err) {
      setError(
        err?.response?.data?.message || "Failed to load performance analytics"
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

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Performance Analytics</h1>
          <p>Medals, belt promotions, certificates and skill averages.</p>
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
          title="Certificates"
          value={data?.certificates || 0}
          loading={loading}
        />

        <AnalyticsCard
          title="Skill Average"
          value={`${data?.skillAverage || 0}%`}
          loading={loading}
        />
      </div>

      <div className="charts-grid">
        <BarChartCard title="Medal Count" data={normalizeItems(data?.medalCount)} />

        <BarChartCard
          title="Belt Promotions"
          data={normalizeItems(data?.beltPromotions)}
        />
      </div>
    </div>
  );
};

export default PerformanceAnalytics;