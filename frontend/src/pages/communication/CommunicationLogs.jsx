import { useEffect, useState } from "react";
import { communicationApi } from "../../api/communicationApi.js";

const CommunicationLogs = () => {
  const [logs, setLogs] = useState([]);
  const [filters, setFilters] = useState({
    channel: "",
    type: "",
    status: "",
    page: 1,
    limit: 20,
  });
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadLogs = async () => {
    try {
      setLoading(true);

      const response = await communicationApi.getLogs(filters);
      setLogs(response.data?.data?.logs || []);
      setPagination(response.data?.data?.pagination || null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.channel, filters.type, filters.status, filters.page]);

  if (loading) return <div className="card">Loading communication logs...</div>;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Communication Logs</h1>
          <p>Email, WhatsApp and internal communication history.</p>
        </div>
      </div>

      <div className="card filters-grid">
        <select
          value={filters.channel}
          onChange={(event) =>
            setFilters((prev) => ({
              ...prev,
              channel: event.target.value,
              page: 1,
            }))
          }
        >
          <option value="">All Channels</option>
          <option value="internal">Internal</option>
          <option value="email">Email</option>
          <option value="whatsapp">WhatsApp</option>
        </select>

        <select
          value={filters.type}
          onChange={(event) =>
            setFilters((prev) => ({
              ...prev,
              type: event.target.value,
              page: 1,
            }))
          }
        >
          <option value="">All Types</option>
          <option value="announcement">Announcement</option>
          <option value="fee_reminder">Fee Reminder</option>
          <option value="attendance_alert">Attendance Alert</option>
          <option value="belt_test">Belt Test</option>
          <option value="championship">Championship</option>
          <option value="system">System</option>
        </select>

        <select
          value={filters.status}
          onChange={(event) =>
            setFilters((prev) => ({
              ...prev,
              status: event.target.value,
              page: 1,
            }))
          }
        >
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="sent">Sent</option>
          <option value="failed">Failed</option>
          <option value="skipped">Skipped</option>
        </select>
      </div>

      <div className="card table-card">
        <table className="data-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Channel</th>
              <th>Type</th>
              <th>Recipient</th>
              <th>Student</th>
              <th>Status</th>
              <th>Provider</th>
              <th>Error</th>
            </tr>
          </thead>

          <tbody>
            {logs.length === 0 ? (
              <tr>
                <td colSpan="8">No communication logs found.</td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log._id}>
                  <td>{new Date(log.createdAt).toLocaleString()}</td>
                  <td>{log.channel}</td>
                  <td>{log.type}</td>
                  <td>
                    {log.recipientUser?.name || "-"}
                    <br />
                    <small>{log.to || log.recipientUser?.email || "-"}</small>
                  </td>
                  <td>{log.relatedStudent?.name || "-"}</td>
                  <td>{log.status}</td>
                  <td>{log.provider || "-"}</td>
                  <td>{log.errorMessage || "-"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {pagination && (
          <div className="pagination-row">
            <button
              className="btn btn-secondary"
              disabled={filters.page <= 1}
              onClick={() =>
                setFilters((prev) => ({ ...prev, page: prev.page - 1 }))
              }
            >
              Previous
            </button>

            <span>
              Page {pagination.page} of {pagination.pages || 1}
            </span>

            <button
              className="btn btn-secondary"
              disabled={filters.page >= pagination.pages}
              onClick={() =>
                setFilters((prev) => ({ ...prev, page: prev.page + 1 }))
              }
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CommunicationLogs;