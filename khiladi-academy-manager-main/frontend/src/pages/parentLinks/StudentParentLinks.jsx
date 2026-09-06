import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { parentLinkApi } from "../../api/parentLinkApi.js";

const StudentParentLinks = () => {
  const { studentId } = useParams();

  const [student, setStudent] = useState(null);
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadLinks = async () => {
    try {
      setLoading(true);
      const response = await parentLinkApi.getByStudent(studentId);
      setStudent(response.data?.data?.student || null);
      setLinks(response.data?.data?.links || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLinks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId]);

  const handleDeactivate = async (id) => {
    const confirmed = window.confirm("Deactivate this link?");
    if (!confirmed) return;

    await parentLinkApi.remove(id);
    await loadLinks();
  };

  if (loading) return <div className="card">Loading parent links...</div>;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Student Parent Links</h1>
          <p>{student?.name || "Student"} linked parent/student users.</p>
        </div>

        <Link className="btn btn-primary" to="/parent-links/new">
          Create Link
        </Link>
      </div>

      <div className="card table-card">
        <table className="data-table">
          <thead>
            <tr>
              <th>User</th>
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
                <td colSpan="6">No links found.</td>
              </tr>
            ) : (
              links.map((link) => (
                <tr key={link._id}>
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
    </div>
  );
};

export default StudentParentLinks;