import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createBranch } from "../../api/branchApi";

const initialForm = {
  branchName: "",
  branchCode: "",
  phone: "",
  email: "",
  address: "",
  city: "",
  state: "",
  country: "India",
  pincode: "",
  isMainBranch: false,
  isActive: true,
};

const AddBranch = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

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

      await createBranch(form);
      navigate("/branches");
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to create branch");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Add Branch</h1>
          <p>Create a new academy branch.</p>
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
            onClick={() => navigate("/branches")}
          >
            Cancel
          </button>

          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? "Saving..." : "Create Branch"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddBranch;