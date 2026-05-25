import IntegrationStatusBadge from "./IntegrationStatusBadge.jsx";

const SyncLogTable = ({ logs = [] }) => {
  if (!logs.length) {
    return <p>No integration logs found.</p>;
  }

  return (
    <div className="table-wrapper">
      <table className="data-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Type</th>
            <th>Direction</th>
            <th>Status</th>
            <th>Error</th>
          </tr>
        </thead>

        <tbody>
          {logs.map((log) => (
            <tr key={log._id}>
              <td>
                {log.createdAt
                  ? new Date(log.createdAt).toLocaleString()
                  : "-"}
              </td>
              <td>{log.type}</td>
              <td>{log.direction}</td>
              <td>
                <IntegrationStatusBadge status={log.status} />
              </td>
              <td>{log.errorMessage || "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default SyncLogTable;