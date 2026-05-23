import React, { useEffect, useState } from "react";

import { getBranches } from "../../api/branchApi";
import { getFeesAnalytics } from "../../api/analyticsApi";
import LineChartCard from "../../components/analytics/LineChartCard";
import PieChartCard from "../../components/analytics/PieChartCard";
import BarChartCard from "../../components/analytics/BarChartCard";

const normalizeStats = (items = []) =>
  items.map((item) => ({
    label: item._id || "Unknown",
    value: item.count || item.total || 0,
  }));

const FeesAnalytics = () => {
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

      const res = await getFeesAnalytics(params);
      setData(res.data || {});
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load fee analytics");
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
          <h1>Fees Analytics</h1>
          <p>Collection trends, pending fees and payment modes.</p>
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

      <div className="charts-grid">
        <LineChartCard
          title="Monthly Collection Trend"
          data={data?.monthlyCollectionTrend || []}
        />

        <PieChartCard
          title="Paid / Pending / Partial"
          data={normalizeStats(data?.pendingPaidPartialStats)}
        />

        <BarChartCard
          title="Payment Mode Distribution"
          data={normalizeStats(data?.paymentModeDistribution)}
        />
      </div>
    </div>
  );
};

export default FeesAnalytics;