import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getBranches, deleteBranch } from "../../api/branchApi";

const Branches = () => {
  const [branches, setBranches] = useState([]);
  const [filters, setFilters] = useState({ search: "", status: "active" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadBranches = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await getBranches(filters);
      setBranches(res.data || []);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load branches");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBranches();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    loadBranches();
  };

  const handleDeactivate = async (id) => {
    const confirmed = window.confirm("Deactivate this branch?");
    if (!confirmed) return;

    try {
      await deleteBranch(id);
      loadBranches();
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to deactivate branch");
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Branches</h1>
          <p>Manage all academy branches from one place.</p>
        </div>

        <Link to="/branches/new" className="btn btn-primary">
          Add Branch
        </Link>
      </div>

      <form className="filter-card" onSubmit={handleSearch}>
        <input
          type="text"
          placeholder="Search branch, code, city..."
          value={filters.search}
          onChange={(e) =>
            setFilters((prev) => ({ ...prev, search: e.target.value }))
          }
        />

        <select
          value={filters.status}
          onChange={(e) =>
            setFilters((prev) => ({ ...prev, status: e.target.value }))
          }
        >
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="all">All</option>
        </select>

        <button type="submit" className="btn btn-secondary">
          Search
        </button>
      </form>

      {error ? <div className="alert alert-error">{error}</div> : null}

      {loading ? (
        <div className="card">Loading branches...</div>
      ) : (
        <div className="table-card">
          <table>
            <thead>
              <tr>
                <th>Branch</th>
                <th>Code</th>
                <th>City</th>
                <th>Phone</th>
                <th>Main</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {branches.length ? (
                branches.map((branch) => (
                  <tr key={branch._id}>
                    <td>{branch.branchName}</td>
                    <td>{branch.branchCode}</td>
                    <td>{branch.city || "-"}</td>
                    <td>{branch.phone || "-"}</td>
                    <td>{branch.isMainBranch ? "Yes" : "No"}</td>
                    <td>{branch.isActive ? "Active" : "Inactive"}</td>
                    <td>
                      <div className="table-actions">
                        <Link to={`/branches/${branch._id}`}>View</Link>
                        <Link to={`/branches/${branch._id}/edit`}>Edit</Link>
                        {branch.isActive ? (
                          <button
                            type="button"
                            onClick={() => handleDeactivate(branch._id)}
                          >
                            Deactivate
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7">No branches found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Branches;