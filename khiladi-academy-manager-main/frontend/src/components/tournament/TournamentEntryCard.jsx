import IntegrationStatusBadge from "./IntegrationStatusBadge.jsx";

const TournamentEntryCard = ({ entry, onCancel }) => {
  const student = entry?.student;

  return (
    <div className="card">
      <div className="page-header">
        <div>
          <h3>{entry.tournamentName}</h3>
          <p>
            {student
              ? `${student.firstName || ""} ${student.lastName || ""}`.trim()
              : "Student"}
            {" • "}
            {entry.externalTournamentId}
          </p>
        </div>

        <IntegrationStatusBadge status={entry.syncStatus} />
      </div>

      <div className="details-grid">
        <p>
          <strong>Event:</strong> {entry.eventType || "-"}
        </p>
        <p>
          <strong>Age Category:</strong> {entry.ageCategory || "-"}
        </p>
        <p>
          <strong>Weight Category:</strong> {entry.weightCategory || "-"}
        </p>
        <p>
          <strong>Gender:</strong> {entry.gender || "-"}
        </p>
        <p>
          <strong>External Player ID:</strong> {entry.externalPlayerId || "-"}
        </p>
        <p>
          <strong>Submitted:</strong>{" "}
          {entry.submittedAt
            ? new Date(entry.submittedAt).toLocaleString()
            : "-"}
        </p>
      </div>

      {entry.syncStatus !== "cancelled" && onCancel && (
        <div className="actions">
          <button
            type="button"
            className="btn btn-danger"
            onClick={() => onCancel(entry._id)}
          >
            Cancel Entry
          </button>
        </div>
      )}
    </div>
  );
};

export default TournamentEntryCard;