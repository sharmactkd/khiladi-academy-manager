import { useEffect, useState } from "react";
import api from "../../api/api.js";

const initialForm = {
  academy: "",
  planCode: "pro",
  grantType: "free_access",
  startDate: "",
  endDate: "",
  reason: "",
};

const AdminGrants = () => {
  const [grants, setGrants] = useState([]);
  const [academies, setAcademies] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);

      const [grantResponse, academyResponse] = await Promise.allSettled([
        api.get("/admin/grants"),
        api.get("/admin/academies"),
      ]);

      if (grantResponse.status === "fulfilled") {
        setGrants(grantResponse.value.data?.data?.grants || []);
      }

      if (academyResponse.status === "fulfilled") {
        const payload = academyResponse.value.data?.data;
        setAcademies(payload?.academies || payload?.items || payload || []);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);

      await api.post("/admin/grants", {
        ...form,
        startDate: form.startDate || undefined,
        endDate: form.grantType === "lifetime" ? null : form.endDate || null,
      });

      setForm(initialForm);
      await loadData();
      alert("Admin grant created successfully");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to create admin grant");
    } finally {
      setSaving(false);
    }
  };

  const handleRevoke = async (id) => {
    const confirmed = window.confirm("Revoke this grant?");
    if (!confirmed) return;

    await api.patch(`/admin/grants/${id}/revoke`);
    await loadData();
  };

  if (loading) return <div className="card">Loading admin grants...</div>;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Admin Grants</h1>
          <p>Super admin can grant premium access without payment.</p>
        </div>
      </div>

      <form className="card form-grid" onSubmit={handleSubmit}>
        <h2 className="full-width">Create Grant</h2>

        <label>
          Academy
          <select
            name="academy"
            value={form.academy}
            onChange={handleChange}
            required
          >
            <option value="">Select Academy</option>
            {academies.map((academy) => (
              <option key={academy._id} value={academy._id}>
                {academy.academyName || academy.name} ({academy.city || "-"})
              </option>
            ))}
          </select>
        </label>

        <label>
          Plan
          <select name="planCode" value={form.planCode} onChange={handleChange}>
            <option value="free">Free</option>
            <option value="basic">Basic</option>
            <option value="pro">Pro</option>
            <option value="premium">Premium</option>
            <option value="enterprise">Enterprise</option>
          </select>
        </label>

        <label>
          Grant Type
          <select name="grantType" value={form.grantType} onChange={handleChange}>
            <option value="trial_extension">Trial Extension</option>
            <option value="free_access">Free Access</option>
            <option value="lifetime">Lifetime</option>
            <option value="custom">Custom</option>
          </select>
        </label>

        <label>
          Start Date
          <input
            type="date"
            name="startDate"
            value={form.startDate}
            onChange={handleChange}
          />
        </label>

        {form.grantType !== "lifetime" && (
          <label>
            End Date
            <input
              type="date"
              name="endDate"
              value={form.endDate}
              onChange={handleChange}
            />
          </label>
        )}

        <label className="full-width">
          Reason
          <textarea
            name="reason"
            value={form.reason}
            onChange={handleChange}
            rows="4"
          />
        </label>

        <div className="form-actions full-width">
          <button className="btn btn-primary" type="submit" disabled={saving}>
            {saving ? "Creating..." : "Create Grant"}
          </button>
        </div>
      </form>

      <div className="card table-card">
        <table className="data-table">
          <thead>
            <tr>
              <th>Academy</th>
              <th>Plan</th>
              <th>Type</th>
              <th>Start</th>
              <th>End</th>
              <th>Active</th>
              <th>Reason</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {grants.length === 0 ? (
              <tr>
                <td colSpan="8">No grants found.</td>
              </tr>
            ) : (
              grants.map((grant) => (
                <tr key={grant._id}>
                  <td>{grant.academy?.academyName || "-"}</td>
                  <td>{grant.planCode}</td>
                  <td>{grant.grantType}</td>
                  <td>
                    {grant.startDate
                      ? new Date(grant.startDate).toLocaleDateString()
                      : "-"}
                  </td>
                  <td>
                    {grant.endDate
                      ? new Date(grant.endDate).toLocaleDateString()
                      : "No expiry"}
                  </td>
                  <td>{grant.isActive ? "Yes" : "No"}</td>
                  <td>{grant.reason || "-"}</td>
                  <td>
                    {grant.isActive && (
                      <button
                        className="btn btn-secondary"
                        type="button"
                        onClick={() => handleRevoke(grant._id)}
                      >
                        Revoke
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminGrants;