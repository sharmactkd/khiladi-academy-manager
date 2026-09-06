import IntegrationStatusBadge from "./IntegrationStatusBadge.jsx";

const TournamentResultCard = ({ result }) => {
  const student = result?.student;

  return (
    <div className="card">
      <div className="page-header">
        <div>
          <h3>{result.tournamentName}</h3>
          <p>
            {student
              ? `${student.firstName || ""} ${student.lastName || ""}`.trim()
              : "Student"}
            {" • "}
            {result.externalTournamentId}
          </p>
        </div>

        <IntegrationStatusBadge status={result.syncStatus} />
      </div>

      <div className="details-grid">
        <p>
          <strong>Result:</strong> {result.result || "-"}
        </p>
        <p>
          <strong>Level:</strong> {result.level || "-"}
        </p>
        <p>
          <strong>Event:</strong> {result.eventType || "-"}
        </p>
        <p>
          <strong>Age Category:</strong> {result.ageCategory || "-"}
        </p>
        <p>
          <strong>Weight Category:</strong> {result.weightCategory || "-"}
        </p>
        <p>
          <strong>Date:</strong>{" "}
          {result.date ? new Date(result.date).toLocaleDateString() : "-"}
        </p>
        <p>
          <strong>Venue:</strong> {result.venue || "-"}
        </p>
        <p>
          <strong>Organizer:</strong> {result.organizer || "-"}
        </p>
        <p>
          <strong>Source:</strong> {result.syncSource || "-"}
        </p>
      </div>

      {result.remarks && (
        <p>
          <strong>Remarks:</strong> {result.remarks}
        </p>
      )}
    </div>
  );
};

export default TournamentResultCard;