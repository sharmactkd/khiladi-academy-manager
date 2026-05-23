import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { parentLinkApi } from "../../api/parentLinkApi.js";

const ParentLinks = () => {
  const [links, setLinks] = useState([]);
  const [filters, setFilters] = useState({ isActive: "" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadLinks = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await parentLinkApi.getAll(filters);
      setLinks(response.data?.data?.links || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load parent links");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLinks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.isActive]);

  const handleDeactivate = async (id) => {
    const confirmed = window.confirm("Deactivate this parent/student link?");
    if (!confirmed) return;

    try {
      await parentLinkApi.remove(id);
      await loadLinks();
      alert("Link deactivated successfully");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to deactivate link");
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Parent / Student Links</h1>
          <p>Link parent or student login accounts with academy students.</p>
        </div>

        <Link className="btn btn-primary" to="/parent-links/new">
          Create Link
        </Link>
      </div>

      <div className="card filters-grid">
        <select
          value={filters.isActive}
          onChange={(event) =>
            setFilters((prev) => ({ ...prev, isActive: event.target.value }))
          }
        >
          <option value="">All Links</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
      </div>

      {loading && <div className="card">Loading links...</div>}
      {error && <div className="alert alert-error">{error}</div>}

      {!loading && !error && (
        <div className="card table-card">
          <table className="data-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Guardian User</th>
                <th>Relationship</th>
                <th>Primary</th>
                <th>Active</th>
                <th>Permissions</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {links.length === 0 ? (
                <tr>
                  <td colSpan="7">No parent links found.</td>
                </tr>
              ) : (
                links.map((link) => (
                  <tr key={link._id}>
                    <td>
                      <strong>{link.student?.name || "-"}</strong>
                      <br />
                      <small>{link.student?.studentCode || "-"}</small>
                    </td>
                    <td>
                      <strong>{link.guardianUser?.name || "-"}</strong>
                      <br />
                      <small>
                        {link.guardianUser?.email ||
                          link.guardianUser?.phone ||
                          "-"}
                      </small>
                    </td>
                    <td>{link.relationship}</td>
                    <td>{link.isPrimary ? "Yes" : "No"}</td>
                    <td>{link.isActive ? "Active" : "Inactive"}</td>
                    <td>
                      Attendance: {link.canViewAttendance ? "Yes" : "No"}
                      <br />
                      Fees: {link.canViewFees ? "Yes" : "No"}
                      <br />
                      Progress: {link.canViewProgress ? "Yes" : "No"}
                      <br />
                      Documents: {link.canViewDocuments ? "Yes" : "No"}
                    </td>
                    <td className="table-actions">
                      <Link to={`/students/${link.student?._id}/parent-links`}>
                        Student Links
                      </Link>
                      {link.isActive && (
                        <button
                          type="button"
                          onClick={() => handleDeactivate(link._id)}
                        >
                          Deactivate
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ParentLinks;