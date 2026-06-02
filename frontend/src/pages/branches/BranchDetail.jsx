import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { getBranchById } from "../../api/branchApi";
import AnalyticsCard from "../../components/analytics/AnalyticsCard";

const displayValue = (value) => {
  const text = String(value || "").trim();
  return text || "-";
};

const displayList = (value) => {
  if (!Array.isArray(value) || !value.length) return "-";
  return value.filter(Boolean).join(", ") || "-";
};

const displayPhone = (countryCode, phone) => {
  const finalPhone = String(phone || "").trim();
  if (!finalPhone) return "-";

  return `${countryCode || "+91"} ${finalPhone}`;
};

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
      const payload = res?.data || res;

      setBranch(payload?.branch || payload?.data?.branch || payload);
      setCounts(payload?.counts || payload?.data?.counts || {});
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
            <p>{displayPhone(branch.countryCode, branch.phone)}</p>
          </div>

          <div>
            <strong>Email</strong>
            <p>{displayValue(branch.email)}</p>
          </div>

          <div>
            <strong>Branch Since</strong>
            <p>{displayValue(branch.branchSince)}</p>
          </div>

          <div>
            <strong>Address</strong>
            <p>{displayValue(branch.address)}</p>
          </div>

          <div>
            <strong>District</strong>
            <p>{displayValue(branch.city)}</p>
          </div>

          <div>
            <strong>State</strong>
            <p>{displayValue(branch.state)}</p>
          </div>

          <div>
            <strong>Country</strong>
            <p>{displayValue(branch.country)}</p>
          </div>

          <div>
            <strong>Main Branch</strong>
            <p>{branch.isMainBranch ? "Yes" : "No"}</p>
          </div>

          <div>
            <strong>Status</strong>
            <p>{branch.isActive ? "Active" : "Inactive"}</p>
          </div>
        </div>
      </div>

      <div className="detail-card">
        <h3>Coaches</h3>

        <div className="detail-grid">
          <div>
            <strong>Branch In-charge / Head Coach</strong>
            <p>{displayValue(branch.headCoachName)}</p>
          </div>

          <div>
            <strong>Head Coach Mobile</strong>
            <p>
              {displayPhone(
                branch.headCoachCountryCode,
                branch.headCoachPhone
              )}
            </p>
          </div>

          <div>
            <strong>Assistant Coach</strong>
            <p>{displayValue(branch.assistantCoachName)}</p>
          </div>

          <div>
            <strong>Assistant Coach Mobile</strong>
            <p>
              {displayPhone(
                branch.assistantCoachCountryCode,
                branch.assistantCoachPhone
              )}
            </p>
          </div>

       <div>
  <strong>Additional Coaches</strong>
  <p>
    {Array.isArray(branch.additionalCoaches) &&
    branch.additionalCoaches.length
      ? branch.additionalCoaches
          .filter((coach) => coach?.name || coach?.phone)
          .map((coach) => {
            const name = coach.name || "Coach";
            const phone = coach.phone
              ? `${coach.countryCode || "+91"} ${coach.phone}`
              : "No mobile";

            return `${name} (${phone})`;
          })
          .join(", ")
      : "-"}
  </p>
</div>

          <div>
            <strong>Manager</strong>
            <p>{branch.manager?.name || "-"}</p>
          </div>

          <div>
            <strong>System Coaches</strong>
            <p>
              {Array.isArray(branch.coaches) && branch.coaches.length
                ? branch.coaches.map((coach) => coach.name).join(", ")
                : "-"}
            </p>
          </div>
        </div>
      </div>

      <div className="detail-card">
        <h3>Facilities & Languages</h3>

        <div className="detail-grid">
          <div>
            <strong>Facilities</strong>
            <p>{displayList(branch.facilities)}</p>
          </div>

          <div>
            <strong>Languages Spoken</strong>
            <p>{displayList(branch.languagesSpoken)}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BranchDetail;