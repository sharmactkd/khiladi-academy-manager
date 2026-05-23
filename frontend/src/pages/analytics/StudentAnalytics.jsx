import React, { useEffect, useState } from "react";

import { getBranches } from "../../api/branchApi";
import { getStudentAnalytics } from "../../api/analyticsApi";
import LineChartCard from "../../components/analytics/LineChartCard";
import PieChartCard from "../../components/analytics/PieChartCard";
import BarChartCard from "../../components/analytics/BarChartCard";

const normalizeDistribution = (items = []) =>
  items.map((item) => ({
    label: item._id || "Unknown",
    value: item.count || 0,
  }));

const StudentAnalytics = () => {
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

      const res = await getStudentAnalytics(params);
      setData(res.data || {});
    } catch (err) {
      setError(
        err?.response?.data?.message || "Failed to load student analytics"
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
          <h1>Student Analytics</h1>
          <p>Admissions, belt, status and martial art distribution.</p>
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
          title="Admissions by Month"
          data={data?.admissionsByMonth || []}
        />

        <PieChartCard
          title="Status Distribution"
          data={normalizeDistribution(data?.statusDistribution)}
        />

        <BarChartCard
          title="Belt Distribution"
          data={normalizeDistribution(data?.beltDistribution)}
        />

        <PieChartCard
          title="Martial Art Distribution"
          data={normalizeDistribution(data?.martialArtDistribution)}
        />
      </div>
    </div>
  );
};

export default StudentAnalytics;