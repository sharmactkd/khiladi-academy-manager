import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getBranchById, updateBranch } from "../../api/branchApi";

const EditBranch = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const loadBranch = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await getBranchById(id);
      const branch = res.data?.branch || res.data;

      setForm({
        branchName: branch.branchName || "",
        branchCode: branch.branchCode || "",
        phone: branch.phone || "",
        email: branch.email || "",
        address: branch.address || "",
        city: branch.city || "",
        state: branch.state || "",
        country: branch.country || "India",
        pincode: branch.pincode || "",
        isMainBranch: Boolean(branch.isMainBranch),
        isActive: Boolean(branch.isActive),
      });
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load branch");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBranch();
  }, [id]);

  const updateField = (name, value) => {
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);
      setError("");

      await updateBranch(id, form);
      navigate(`/branches/${id}`);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to update branch");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="page">Loading branch...</div>;
  }

  if (!form) {
    return <div className="page">Branch not found.</div>;
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Edit Branch</h1>
          <p>Update branch details.</p>
        </div>
      </div>

      {error ? <div className="alert alert-error">{error}</div> : null}

      <form className="form-card" onSubmit={handleSubmit}>
        <div className="form-grid">
          <div className="form-group">
            <label>Branch Name *</label>
            <input
              value={form.branchName}
              onChange={(e) => updateField("branchName", e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Branch Code *</label>
            <input
              value={form.branchCode}
              onChange={(e) => updateField("branchCode", e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Phone</label>
            <input
              value={form.phone}
              onChange={(e) => updateField("phone", e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => updateField("email", e.target.value)}
            />
          </div>

          <div className="form-group form-group-full">
            <label>Address</label>
            <textarea
              value={form.address}
              onChange={(e) => updateField("address", e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>City</label>
            <input
              value={form.city}
              onChange={(e) => updateField("city", e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>State</label>
            <input
              value={form.state}
              onChange={(e) => updateField("state", e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Country</label>
            <input
              value={form.country}
              onChange={(e) => updateField("country", e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Pincode</label>
            <input
              value={form.pincode}
              onChange={(e) => updateField("pincode", e.target.value)}
            />
          </div>
        </div>

        <div className="checkbox-row">
          <label>
            <input
              type="checkbox"
              checked={form.isMainBranch}
              onChange={(e) => updateField("isMainBranch", e.target.checked)}
            />
            Main Branch
          </label>

          <label>
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => updateField("isActive", e.target.checked)}
            />
            Active
          </label>
        </div>

        <div className="form-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate(`/branches/${id}`)}
          >
            Cancel
          </button>

          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? "Saving..." : "Update Branch"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditBranch;