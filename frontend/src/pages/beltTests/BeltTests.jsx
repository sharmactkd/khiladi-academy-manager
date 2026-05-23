import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { beltTestApi } from "../../api/beltTestApi.js";

const BeltTests = () => {
  const [beltTests, setBeltTests] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [filters, setFilters] = useState({
    search: "",
    result: "",
    page: 1,
    limit: 20,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadBeltTests = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await beltTestApi.getAll(filters);
      setBeltTests(response.data?.data?.beltTests || []);
      setPagination(response.data?.data?.pagination || null);
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to load belt test records"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBeltTests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.page, filters.result]);

  const handleSearch = (event) => {
    event.preventDefault();
    setFilters((prev) => ({ ...prev, page: 1 }));
    loadBeltTests();
  };

  const handleDelete = async (id) => {
    const confirmed = window.confirm("Delete this belt test record?");
    if (!confirmed) return;

    try {
      await beltTestApi.remove(id);
      await loadBeltTests();
      alert("Belt test deleted successfully");
    } catch (err) {
      alert(err.response?.data?.message || "Delete failed");
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Belt Test Records</h1>
          <p>Manage belt tests, promotions, examiners and certificates.</p>
        </div>

        <Link className="btn btn-primary" to="/belt-tests/new">
          Add Belt Test
        </Link>
      </div>

      <form className="card filters-grid" onSubmit={handleSearch}>
        <input
          type="text"
          placeholder="Search belt, examiner, certificate..."
          value={filters.search}
          onChange={(event) =>
            setFilters((prev) => ({ ...prev, search: event.target.value }))
          }
        />

        <select
          value={filters.result}
          onChange={(event) =>
            setFilters((prev) => ({
              ...prev,
              result: event.target.value,
              page: 1,
            }))
          }
        >
          <option value="">All Results</option>
          <option value="pending">Pending</option>
          <option value="pass">Pass</option>
          <option value="fail">Fail</option>
        </select>

        <button className="btn btn-secondary" type="submit">
          Search
        </button>
      </form>

      {loading && <div className="card">Loading belt tests...</div>}
      {error && <div className="alert alert-error">{error}</div>}

      {!loading && !error && (
        <div className="card table-card">
          <table className="data-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Current Belt</th>
                <th>Promoted To</th>
                <th>Date</th>
                <th>Result</th>
                <th>Examiner</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {beltTests.length === 0 ? (
                <tr>
                  <td colSpan="7">No belt test records found.</td>
                </tr>
              ) : (
                beltTests.map((record) => (
                  <tr key={record._id}>
                    <td>
                      <strong>{record.student?.name || "Unknown"}</strong>
                      <br />
                      <small>{record.student?.studentCode}</small>
                    </td>
                    <td>{record.currentBelt}</td>
                    <td>{record.promotedToBelt}</td>
                    <td>
                      {record.testDate
                        ? new Date(record.testDate).toLocaleDateString()
                        : "-"}
                    </td>
                    <td>
                      <span className={`status-pill ${record.result}`}>
                        {record.result}
                      </span>
                    </td>
                    <td>{record.examinerName || "-"}</td>
                    <td className="table-actions">
                      <Link to={`/belt-tests/${record._id}/edit`}>Edit</Link>
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

export default BeltTests;