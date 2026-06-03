import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { championshipRecordApi } from "../../api/championshipRecordApi.js";

const getStudentName = (student) => {
  if (!student) return "Student";

  const fullName = `${student.firstName || ""} ${student.lastName || ""}`.trim();
  return student.name || fullName || "Student";
};

const formatDate = (value) => {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleDateString("en-IN");
};

const displayValue = (value) => {
  const text = String(value ?? "").trim();
  return text || "-";
};

const calculateSummary = (records = []) => {
  return records.reduce(
    (acc, record) => {
      acc.total += 1;
      acc.totalBouts += Number(record.totalBouts || 0);
      acc.boutsWon += Number(record.boutsWon || 0);
      acc.boutsLost += Number(record.boutsLost || 0);

      if (record.result === "Gold") acc.gold += 1;
      if (record.result === "Silver") acc.silver += 1;
      if (record.result === "Bronze") acc.bronze += 1;
      if (record.result === "Participation") acc.participation += 1;
      if (record.level === "National") acc.national += 1;
      if (record.level === "International") acc.international += 1;

      return acc;
    },
    {
      total: 0,
      gold: 0,
      silver: 0,
      bronze: 0,
      participation: 0,
      national: 0,
      international: 0,
      totalBouts: 0,
      boutsWon: 0,
      boutsLost: 0,
    }
  );
};

const StudentChampionshipHistory = () => {
  const { studentId } = useParams();

  const [student, setStudent] = useState(null);
  const [records, setRecords] = useState([]);
  const [apiSummary, setApiSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadHistory = async () => {
      try {
        setLoading(true);

        const response = await championshipRecordApi.getByStudent(studentId);

        setStudent(response.data?.data?.student || null);
        setRecords(response.data?.data?.championshipRecords || []);
        setApiSummary(response.data?.data?.summary || null);
      } catch (err) {
        setError(
          err.response?.data?.message || "Failed to load championship history"
        );
      } finally {
        setLoading(false);
      }
    };

    loadHistory();
  }, [studentId]);

  const summary = useMemo(() => {
    const localSummary = calculateSummary(records);
    return apiSummary || {
      ...localSummary,
      winPercentage:
        localSummary.totalBouts > 0
          ? Math.round((localSummary.boutsWon / localSummary.totalBouts) * 100)
          : 0,
    };
  }, [records, apiSummary]);

  if (loading) {
    return <div className="card">Loading championship history...</div>;
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Championship History</h1>
          <p>{getStudentName(student)} tournament and medal record.</p>
        </div>

        <div className="actions">
          <Link
            className="btn btn-primary"
            to={`/championship-records/new?student=${studentId}`}
          >
            Add Record
          </Link>

          <Link className="btn btn-secondary" to={`/students/${studentId}`}>
            Back to Student
          </Link>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="grid grid-4">
        <div className="card stat-card">
          <span>Total Championships</span>
          <strong>{summary.total || 0}</strong>
        </div>

        <div className="card stat-card">
          <span>Gold</span>
          <strong>{summary.gold || 0}</strong>
        </div>

        <div className="card stat-card">
          <span>Silver</span>
          <strong>{summary.silver || 0}</strong>
        </div>

        <div className="card stat-card">
          <span>Bronze</span>
          <strong>{summary.bronze || 0}</strong>
        </div>
      </div>

      <div className="grid grid-4">
        <div className="card stat-card">
          <span>Total Bouts</span>
          <strong>{summary.totalBouts || 0}</strong>
        </div>

        <div className="card stat-card">
          <span>Bouts Won</span>
          <strong>{summary.boutsWon || 0}</strong>
        </div>

        <div className="card stat-card">
          <span>Bouts Lost</span>
          <strong>{summary.boutsLost || 0}</strong>
        </div>

        <div className="card stat-card">
          <span>Win %</span>
          <strong>{summary.winPercentage || 0}%</strong>
        </div>
      </div>

      <div className="card table-card">
        <table className="data-table">
          <thead>
            <tr>
              <th>Start Date</th>
              <th>End Date</th>
              <th>Championship</th>
              <th>Type</th>
              <th>Official Category</th>
              <th>Level</th>
              <th>Grading</th>
              <th>Event</th>
              <th>Poomsae</th>
              <th>Age</th>
              <th>Weight</th>
              <th>Bouts</th>
              <th>Result</th>
              <th>Venue</th>
              <th>Location</th>
              <th>Certificate</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {records.length === 0 ? (
              <tr>
                <td colSpan="17">No championship history found.</td>
              </tr>
            ) : (
              records.map((record) => (
                <tr key={record._id}>
                  <td>{formatDate(record.startDate || record.date)}</td>
                  <td>{formatDate(record.endDate || record.date)}</td>
                  <td>{displayValue(record.championshipName)}</td>
                  <td>{displayValue(record.championshipType)}</td>
                  <td>{displayValue(record.officialCategory)}</td>
                  <td>{displayValue(record.level)}</td>
                  <td>{displayValue(record.grading)}</td>
                  <td>{displayValue(record.eventType)}</td>
                  <td>{displayValue(record.poomsaeType)}</td>
                  <td>{displayValue(record.ageCategory)}</td>
                  <td>{displayValue(record.weightCategory)}</td>
                  <td>{record.totalBouts ?? 0}</td>
                  <td>
                    <span className={`badge badge-${String(record.result).toLowerCase()}`}>
                      {displayValue(record.result)}
                    </span>
                  </td>
                  <td>{displayValue(record.venue)}</td>
                  <td>
                    {[record.district, record.state, record.country]
                      .filter(Boolean)
                      .join(", ") || "-"}
                  </td>
                  <td>
                    {record.certificateUrl ? (
                      <a
                        href={record.certificateUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Open
                      </a>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td>
                    <Link to={`/championship-records/${record._id}/edit`}>
                      Edit
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StudentChampionshipHistory;