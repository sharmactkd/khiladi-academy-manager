import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getBranchById } from "../../api/branchApi";
import AnalyticsCard from "../../components/analytics/AnalyticsCard";

const BranchDetail = () => {
  const { id } = useParams();

  const [branch, setBranch] = useState(null);
  const [counts, setCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadBranch = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await getBranchById(id);

      setBranch(res.data?.branch || res.data);
      setCounts(res.data?.counts || {});
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load branch");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBranch();
  }, [id]);

  if (loading) {
    return <div className="page">Loading branch...</div>;
  }

  if (error) {
    return <div className="page alert alert-error">{error}</div>;
  }

  if (!branch) {
    return <div className="page">Branch not found.</div>;
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>{branch.branchName}</h1>
          <p>{branch.branchCode}</p>
        </div>

        <Link to={`/branches/${branch._id}/edit`} className="btn btn-primary">
          Edit Branch
        </Link>
      </div>

      <div className="analytics-grid">
        <AnalyticsCard title="Total Students" value={counts.students || 0} />
        <AnalyticsCard
          title="Active Students"
          value={counts.activeStudents || 0}
        />
        <AnalyticsCard title="Batches" value={counts.batches || 0} />
        <AnalyticsCard
          title="Today Attendance"
          value={`${counts.todayAttendancePercentage || 0}%`}
        />
        <AnalyticsCard
          title="Pending Fees"
          value={`₹${counts.pendingFeesTotal || 0}`}
        />
      </div>

      <div className="detail-card">
        <h3>Branch Details</h3>

        <div className="detail-grid">
          <div>
            <strong>Phone</strong>
            <p>{branch.phone || "-"}</p>
          </div>

          <div>
            <strong>Email</strong>
            <p>{branch.email || "-"}</p>
          </div>

          <div>
            <strong>Address</strong>
            <p>{branch.address || "-"}</p>
          </div>

          <div>
            <strong>City</strong>
            <p>{branch.city || "-"}</p>
          </div>

          <div>
            <strong>State</strong>
            <p>{branch.state || "-"}</p>
          </div>

          <div>
            <strong>Country</strong>
            <p>{branch.country || "-"}</p>
          </div>

          <div>
            <strong>Pincode</strong>
            <p>{branch.pincode || "-"}</p>
          </div>

          <div>
            <strong>Main Branch</strong>
            <p>{branch.isMainBranch ? "Yes" : "No"}</p>
          </div>

          <div>
            <strong>Status</strong>
            <p>{branch.isActive ? "Active" : "Inactive"}</p>
          </div>

          <div>
            <strong>Manager</strong>
            <p>{branch.manager?.name || "-"}</p>
          </div>

          <div>
            <strong>Coaches</strong>
            <p>
              {Array.isArray(branch.coaches) && branch.coaches.length
                ? branch.coaches.map((coach) => coach.name).join(", ")
                : "-"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BranchDetail;