import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { championshipRecordApi } from "../../api/championshipRecordApi.js";

const EditChampionshipRecord = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadRecord = async () => {
      try {
        const response = await championshipRecordApi.getById(id);
        const record = response.data?.data?.championshipRecord;

        setForm({
          championshipName: record.championshipName || "",
          level: record.level || "open",
          eventType: record.eventType || "kyorugi",
          ageCategory: record.ageCategory || "",
          weightCategory: record.weightCategory || "",
          result: record.result || "participated",
          date: record.date ? record.date.slice(0, 10) : "",
          venue: record.venue || "",
          organizer: record.organizer || "",
          remarks: record.remarks || "",
          certificateUrl: record.certificateUrl || "",
        });
      } catch (err) {
        setError(
          err.response?.data?.message || "Failed to load championship record"
        );
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
      await championshipRecordApi.update(id, form);
      alert("Championship record updated successfully");
      navigate("/championship-records");
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to update championship record"
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="card">Loading championship record...</div>;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Edit Championship Record</h1>
          <p>Update tournament result and certificate information.</p>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {form && (
        <form className="card form-grid" onSubmit={handleSubmit}>
          <label>
            Championship Name
            <input
              name="championshipName"
              value={form.championshipName}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            Level
            <select name="level" value={form.level} onChange={handleChange}>
              <option value="district">District</option>
              <option value="state">State</option>
              <option value="national">National</option>
              <option value="international">International</option>
              <option value="open">Open</option>
            </select>
          </label>

          <label>
            Event Type
            <select name="eventType" value={form.eventType} onChange={handleChange}>
              <option value="kyorugi">Kyorugi</option>
              <option value="poomsae">Poomsae</option>
              <option value="demo">Demo</option>
              <option value="other">Other</option>
            </select>
          </label>

          <label>
            Result
            <select name="result" value={form.result} onChange={handleChange}>
              <option value="gold">Gold</option>
              <option value="silver">Silver</option>
              <option value="bronze">Bronze</option>
              <option value="participated">Participated</option>
              <option value="disqualified">Disqualified</option>
            </select>
          </label>

          <label>
            Date
            <input
              type="date"
              name="date"
              value={form.date}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            Venue
            <input name="venue" value={form.venue} onChange={handleChange} />
          </label>

          <label>
            Age Category
            <input
              name="ageCategory"
              value={form.ageCategory}
              onChange={handleChange}
            />
          </label>

          <label>
            Weight Category
            <input
              name="weightCategory"
              value={form.weightCategory}
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
              {saving ? "Saving..." : "Update Record"}
            </button>

            <button
              className="btn btn-secondary"
              type="button"
              onClick={() => navigate("/championship-records")}
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default EditChampionshipRecord;