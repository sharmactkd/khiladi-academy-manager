import { useEffect, useState } from "react";
import { adminApi } from "../../api/adminApi.js";

const Users = () => {
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [filters, setFilters] = useState({
    search: "",
    role: "",
    page: 1,
    limit: 10,
  });

  const [error, setError] = useState("");

  const loadUsers = async () => {
    try {
      setError("");
      const response = await adminApi.getUsers(filters);
      setUsers(response.data?.data?.users || []);
      setPagination(response.data?.data?.pagination || null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load users");
    }
  };

  useEffect(() => {
    loadUsers();
  }, [filters.page, filters.role]);

  const handleSearch = (event) => {
    event.preventDefault();
    setFilters((prev) => ({ ...prev, page: 1 }));
    loadUsers();
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Admin Users</h1>
          <p className="muted">View registered users safely.</p>
        </div>
      </div>

      <form className="filter-bar" onSubmit={handleSearch}>
        <input
          value={filters.search}
          placeholder="Search user..."
          onChange={(event) =>
            setFilters((prev) => ({ ...prev, search: event.target.value }))
          }
        />

        <select
          value={filters.role}
          onChange={(event) =>
            setFilters((prev) => ({ ...prev, role: event.target.value, page: 1 }))
          }
        >
          <option value="">All Roles</option>
          <option value="super_admin">Super Admin</option>
          <option value="academy_owner">Academy Owner</option>
          <option value="assistant_coach">Assistant Coach</option>
          <option value="parent">Parent</option>
          <option value="student">Student</option>
        </select>

        <button className="btn btn-primary" type="submit">
          Search
        </button>
      </form>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="card table-card">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Role</th>
              <th>Active</th>
              <th>Suspended</th>
            </tr>
          </thead>
          <tbody>
            {users.map((item) => (
              <tr key={item.id}>
                <td>{item.name}</td>
                <td>{item.email || "-"}</td>
                <td>{item.phone || "-"}</td>
                <td>{item.role}</td>
                <td>{item.isActive ? "Yes" : "No"}</td>
                <td>{item.isSuspended ? "Yes" : "No"}</td>
              </tr>
            ))}

            {users.length === 0 && (
              <tr>
                <td colSpan="6">No users found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {pagination && (
        <div className="pagination">
          <button
            className="btn btn-outline"
            disabled={pagination.page <= 1}
            onClick={() =>
              setFilters((prev) => ({ ...prev, page: prev.page - 1 }))
            }
          >
            Previous
          </button>

          <span>
            Page {pagination.page} of {pagination.totalPages || 1}
          </span>

          <button
            className="btn btn-outline"
            disabled={pagination.page >= pagination.totalPages}
            onClick={() =>
              setFilters((prev) => ({ ...prev, page: prev.page + 1 }))
            }
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default Users;