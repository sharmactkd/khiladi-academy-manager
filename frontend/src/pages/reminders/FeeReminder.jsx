import { useState } from "react";
import { communicationApi } from "../../api/communicationApi.js";

const FeeReminder = () => {
  const [form, setForm] = useState({
    channels: ["internal"],
    message: "",
  });
  const [result, setResult] = useState(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

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

      const response = await communicationApi.sendFeeReminder({
        channels: form.channels.length ? form.channels : ["internal"],
        message: form.message || undefined,
      });

      setResult(response.data?.data || null);
      alert("Fee reminders processed successfully");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send fee reminders");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Fee Reminder</h1>
          <p>Send reminders to parents of pending, overdue or partial fees.</p>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <form className="card form-grid" onSubmit={handleSubmit}>
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
            rows="5"
            value={form.message}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, message: event.target.value }))
            }
            placeholder="Leave empty to use default fee reminder message."
          />
        </label>

        <div className="form-actions full-width">
          <button className="btn btn-primary" type="submit" disabled={sending}>
            {sending ? "Sending..." : "Send Fee Reminders"}
          </button>
        </div>
      </form>

      {result && (
        <div className="card">
          <h2>Reminder Result</h2>
          <p>
            <strong>Payments Count:</strong> {result.paymentsCount}
          </p>
          <p>
            <strong>Logs Created:</strong> {result.logsCount}
          </p>
        </div>
      )}
    </div>
  );
};

export default FeeReminder;