import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { parentPortalApi } from "../../api/parentPortalApi.js";

const ParentDashboard = () => {
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStudents = async () => {
      try {
        const response = await parentPortalApi.getMyStudents();
        setLinks(response.data?.data?.links || []);
      } finally {
        setLoading(false);
      }
    };

    loadStudents();
  }, []);

  if (loading) return <div className="card">Loading parent portal...</div>;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Parent Portal</h1>
          <p>View linked student details, attendance, fees and progress.</p>
        </div>
      </div>

      <div className="grid grid-3">
        {links.length === 0 ? (
          <div className="card">No linked students found.</div>
        ) : (
          links.map((link) => (
            <div className="card parent-student-card" key={link._id}>
              <h3>{link.student?.name}</h3>
              <p>{link.student?.studentCode}</p>
              <p>Belt: {link.student?.beltRank || "-"}</p>
              <p>Academy: {link.academy?.academyName || "-"}</p>

              <div className="actions">
                <Link to={`/parent/students/${link.student?._id}`}>Profile</Link>
                <Link to={`/parent/students/${link.student?._id}/attendance`}>
                  Attendance
                </Link>
                <Link to={`/parent/students/${link.student?._id}/fees`}>
                  Fees
                </Link>
                <Link to={`/parent/students/${link.student?._id}/progress`}>
                  Progress
                </Link>
                <Link to={`/parent/students/${link.student?._id}/documents`}>
                  Documents
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ParentDashboard;