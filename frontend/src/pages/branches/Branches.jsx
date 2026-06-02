import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { getBranches, deleteBranch } from "../../api/branchApi";

const displayValue = (value) => {
  const text = String(value || "").trim();
  return text || "-";
};

const displayPhone = (countryCode, phone) => {
  const finalPhone = String(phone || "").trim();
  if (!finalPhone) return "-";

  return `${countryCode || "+91"} ${finalPhone}`;
};

const Branches = () => {
  const navigate = useNavigate();

  const [branches, setBranches] = useState([]);
  const [filters, setFilters] = useState({ search: "", status: "active" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadBranches = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await getBranches(filters);
      const payload = res?.data || res;

      setBranches(Array.isArray(payload) ? payload : payload?.data || []);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load branches");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBranches();
  }, []);

  const handleSearch = (event) => {
    event.preventDefault();
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
          placeholder="Search branch, code, district, coach..."
          value={filters.search}
          onChange={(event) =>
            setFilters((prev) => ({
              ...prev,
              search: event.target.value,
            }))
          }
        />

        <select
          value={filters.status}
          onChange={(event) =>
            setFilters((prev) => ({
              ...prev,
              status: event.target.value,
            }))
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
                <th>District</th>
                <th>Branch Phone</th>
                <th>Head Coach</th>
                <th>Coach Phone</th>
                <th>Main</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {branches.length ? (
                branches.map((branch) => (
                  <tr
                    key={branch._id}
                    onClick={() => navigate(`/branches/${branch._id}`)}
                    style={{ cursor: "pointer" }}
                  >
                    <td>{displayValue(branch.branchName)}</td>
                    <td>{displayValue(branch.branchCode)}</td>
                    <td>{displayValue(branch.city)}</td>
                    <td>{displayPhone(branch.countryCode, branch.phone)}</td>
                    <td>{displayValue(branch.headCoachName)}</td>
                    <td>
                      {displayPhone(
                        branch.headCoachCountryCode,
                        branch.headCoachPhone
                      )}
                    </td>
                    <td>{branch.isMainBranch ? "Yes" : "No"}</td>
                    <td>{branch.isActive ? "Active" : "Inactive"}</td>

                    <td onClick={(event) => event.stopPropagation()}>
                      <div className="table-actions">
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
                  <td colSpan="9">No branches found.</td>
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