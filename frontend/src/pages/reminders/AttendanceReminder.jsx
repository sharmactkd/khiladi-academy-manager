import { useEffect, useState } from "react";
import { communicationApi } from "../../api/communicationApi.js";
import api from "../../api/api.js";

const AttendanceReminder = () => {
  const [batches, setBatches] = useState([]);
  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    batch: "",
    channels: ["internal"],
    message: "",
  });
  const [result, setResult] = useState(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadBatches = async () => {
      try {
        const response = await api.get("/batches", {
          params: { limit: 200, status: "active" },
        });
        setBatches(response.data?.data?.batches || []);
      } catch {
        setBatches([]);
      }
    };

    loadBatches();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleChannelChange = (event) => {
    const { value, checked } = event.target;

    setForm((prev) => {
      const channels = new Set(prev.channels);

      if (checked) {
        channels.add(value);
      } else {
        channels.delete(value);
      }

      return {
        ...prev,
        channels: Array.from(channels),
      };
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setSending(true);
      setError("");
      setResult(null);

      const payload = {
        date: form.date,
        batch: form.batch || undefined,
        channels: form.channels.length ? form.channels : ["internal"],
        message: form.message || undefined,
      };

      const response = await communicationApi.sendAttendanceReminder(payload);

      setResult(response.data?.data || null);
      alert("Attendance reminders processed successfully");
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to send attendance reminders"
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Attendance Reminder</h1>
          <p>Send alerts to parents of students marked absent.</p>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <form className="card form-grid" onSubmit={handleSubmit}>
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
          Batch Optional
          <select name="batch" value={form.batch} onChange={handleChange}>
            <option value="">All Batches</option>
            {batches.map((batch) => (
              <option key={batch._id} value={batch._id}>
                {batch.batchName}
              </option>
            ))}
          </select>
        </label>

        <div className="full-width">
          <strong>Channels</strong>

          <div className="channel-row">
            <label className="checkbox-row">
              <input
                type="checkbox"
                value="internal"
                checked={form.channels.includes("internal")}
                onChange={handleChannelChange}
              />
              Internal Notification
            </label>

            <label className="checkbox-row">
              <input
                type="checkbox"
                value="email"
                checked={form.channels.includes("email")}
                onChange={handleChannelChange}
              />
              Email
            </label>

            <label className="checkbox-row">
              <input
                type="checkbox"
                value="whatsapp"
                checked={form.channels.includes("whatsapp")}
                onChange={handleChannelChange}
              />
              WhatsApp Log Only
            </label>
          </div>
        </div>

        <label className="full-width">
          Custom Message Optional
          <textarea
            name="message"
            rows="5"
            value={form.message}
            onChange={handleChange}
            placeholder="Leave empty to use default attendance message."
          />
        </label>

        <div className="form-actions full-width">
          <button className="btn btn-primary" type="submit" disabled={sending}>
            {sending ? "Sending..." : "Send Attendance Reminders"}
          </button>
        </div>
      </form>

      {result && (
        <div className="card">
          <h2>Reminder Result</h2>
          <p>
            <strong>Absent Count:</strong> {result.absentCount}
          </p>
          <p>
            <strong>Logs Created:</strong> {result.logsCount}
          </p>
        </div>
      )}
    </div>
  );
};

export default AttendanceReminder;