import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { beltTestApi } from "../../api/beltTestApi.js";

const EditBeltTest = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadRecord = async () => {
      try {
        setLoading(true);
        const response = await beltTestApi.getById(id);
        const record = response.data?.data?.beltTest;

        setForm({
          currentBelt: record.currentBelt || "",
          promotedToBelt: record.promotedToBelt || "",
          testDate: record.testDate ? record.testDate.slice(0, 10) : "",
          result: record.result || "pending",
          examinerName: record.examinerName || "",
          remarks: record.remarks || "",
          certificateNumber: record.certificateNumber || "",
          certificateUrl: record.certificateUrl || "",
        });
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load belt test");
      } finally {
        setLoading(false);
      }
    };

    loadRecord();
  }, [id]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);
      await beltTestApi.update(id, form);
      alert("Belt test updated successfully");
      navigate("/belt-tests");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update belt test");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="card">Loading belt test...</div>;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Edit Belt Test</h1>
          <p>Update belt test result and certificate details.</p>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {form && (
        <form className="card form-grid" onSubmit={handleSubmit}>
          <label>
            Current Belt
            <input
              name="currentBelt"
              value={form.currentBelt}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            Promoted To Belt
            <input
              name="promotedToBelt"
              value={form.promotedToBelt}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            Test Date
            <input
              type="date"
              name="testDate"
              value={form.testDate}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            Result
            <select name="result" value={form.result} onChange={handleChange}>
              <option value="pending">Pending</option>
              <option value="pass">Pass</option>
              <option value="fail">Fail</option>
            </select>
          </label>

          <label>
            Examiner Name
            <input
              name="examinerName"
              value={form.examinerName}
              onChange={handleChange}
            />
          </label>

          <label>
            Certificate Number
            <input
              name="certificateNumber"
              value={form.certificateNumber}
              onChange={handleChange}
            />
          </label>

          <label className="full-width">
            Certificate URL
            <input
              name="certificateUrl"
              value={form.certificateUrl}
              onChange={handleChange}
            />
          </label>

          <label className="full-width">
            Remarks
            <textarea
              name="remarks"
              value={form.remarks}
              onChange={handleChange}
              rows="4"
            />
          </label>

          <div className="form-actions full-width">
            <button className="btn btn-primary" type="submit" disabled={saving}>
              {saving ? "Saving..." : "Update Belt Test"}
            </button>

            <button
              className="btn btn-secondary"
              type="button"
              onClick={() => navigate("/belt-tests")}
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default EditBeltTest;