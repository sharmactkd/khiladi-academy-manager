import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { championshipRecordApi } from "../../api/championshipRecordApi.js";

const ChampionshipRecords = () => {
  const [records, setRecords] = useState([]);
  const [filters, setFilters] = useState({
    search: "",
    level: "",
    eventType: "",
    result: "",
    page: 1,
    limit: 20,
  });
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadRecords = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await championshipRecordApi.getAll(filters);
      setRecords(response.data?.data?.championshipRecords || []);
      setPagination(response.data?.data?.pagination || null);
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to load championship records"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecords();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.page, filters.level, filters.eventType, filters.result]);

  const handleSearch = (event) => {
    event.preventDefault();
    setFilters((prev) => ({ ...prev, page: 1 }));
    loadRecords();
  };

  const handleDelete = async (id) => {
    const confirmed = window.confirm("Delete this championship record?");
    if (!confirmed) return;

    try {
      await championshipRecordApi.remove(id);
      await loadRecords();
      alert("Championship record deleted successfully");
    } catch (err) {
      alert(err.response?.data?.message || "Delete failed");
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Championship Records</h1>
          <p>Track tournaments, medals, participation and certificates.</p>
        </div>

        <Link className="btn btn-primary" to="/championship-records/new">
          Add Record
        </Link>
      </div>

      <form className="card filters-grid" onSubmit={handleSearch}>
        <input
          type="text"
          placeholder="Search championship, venue, organizer..."
          value={filters.search}
          onChange={(event) =>
            setFilters((prev) => ({ ...prev, search: event.target.value }))
          }
        />

        <select
          value={filters.level}
          onChange={(event) =>
            setFilters((prev) => ({ ...prev, level: event.target.value, page: 1 }))
          }
        >
          <option value="">All Levels</option>
          <option value="district">District</option>
          <option value="state">State</option>
          <option value="national">National</option>
          <option value="international">International</option>
          <option value="open">Open</option>
        </select>

        <select
          value={filters.eventType}
          onChange={(event) =>
            setFilters((prev) => ({
              ...prev,
              eventType: event.target.value,
              page: 1,
            }))
          }
        >
          <option value="">All Events</option>
          <option value="kyorugi">Kyorugi</option>
          <option value="poomsae">Poomsae</option>
          <option value="demo">Demo</option>
          <option value="other">Other</option>
        </select>

        <select
          value={filters.result}
          onChange={(event) =>
            setFilters((prev) => ({ ...prev, result: event.target.value, page: 1 }))
          }
        >
          <option value="">All Results</option>
          <option value="gold">Gold</option>
          <option value="silver">Silver</option>
          <option value="bronze">Bronze</option>
          <option value="participated">Participated</option>
          <option value="disqualified">Disqualified</option>
        </select>

        <button className="btn btn-secondary" type="submit">
          Search
        </button>
      </form>

      {loading && <div className="card">Loading championship records...</div>}
      {error && <div className="alert alert-error">{error}</div>}

      {!loading && !error && (
        <div className="card table-card">
          <table className="data-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Championship</th>
                <th>Level</th>
                <th>Event</th>
                <th>Result</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {records.length === 0 ? (
                <tr>
                  <td colSpan="7">No championship records found.</td>
                </tr>
              ) : (
                records.map((record) => (
                  <tr key={record._id}>
                    <td>
                      <strong>{record.student?.name || "Unknown"}</strong>
                      <br />
                      <small>{record.student?.studentCode}</small>
                    </td>
                    <td>{record.championshipName}</td>
                    <td>{record.level}</td>
                    <td>{record.eventType}</td>
                    <td>{record.result}</td>
                    <td>{new Date(record.date).toLocaleDateString()}</td>
                    <td className="table-actions">
                      <Link to={`/championship-records/${record._id}/edit`}>
                        Edit
                      </Link>
                      <button type="button" onClick={() => handleDelete(record._id)}>
                        Delete
                      </button>
                    </td>
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
      )}
    </div>
  );
};

export default ChampionshipRecords;