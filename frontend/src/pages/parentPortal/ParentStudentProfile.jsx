import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { parentPortalApi } from "../../api/parentPortalApi.js";

const ParentStudentProfile = () => {
  const { studentId } = useParams();

  const [student, setStudent] = useState(null);
  const [permissions, setPermissions] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await parentPortalApi.getStudentProfile(studentId);
        setStudent(response.data?.data?.student || null);
        setPermissions(response.data?.data?.permissions || null);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [studentId]);

  if (loading) return <div className="card">Loading profile...</div>;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>{student?.name}</h1>
          <p>{student?.studentCode}</p>
        </div>

        <Link className="btn btn-secondary" to="/parent">
          Back
        </Link>
      </div>

      <div className="grid grid-3">
        <div className="card stat-card">
          <span>Status</span>
          <strong>{student?.status || "-"}</strong>
        </div>

        <div className="card stat-card">
          <span>Belt Rank</span>
          <strong>{student?.beltRank || "-"}</strong>
        </div>

        <div className="card stat-card">
          <span>Martial Art</span>
          <strong>{student?.martialArt || "-"}</strong>
        </div>
      </div>

      <div className="card">
        <h2>Student Details</h2>

        <div className="details-grid">
          <p>
            <strong>Phone:</strong> {student?.phone || "-"}
          </p>
          <p>
            <strong>Email:</strong> {student?.email || "-"}
          </p>
          <p>
            <strong>Gender:</strong> {student?.gender || "-"}
          </p>
          <p>
            <strong>DOB:</strong>{" "}
            {student?.dob ? new Date(student.dob).toLocaleDateString() : "-"}
          </p>
          <p>
            <strong>Parent Name:</strong> {student?.parentName || "-"}
          </p>
          <p>
            <strong>Parent Phone:</strong> {student?.parentPhone || "-"}
          </p>
        </div>
      </div>

      <div className="card">
        <h2>Allowed Access</h2>
        <div className="actions">
          {permissions?.canViewAttendance && (
            <Link to={`/parent/students/${studentId}/attendance`}>
              Attendance
            </Link>
          )}
          {permissions?.canViewFees && (
            <Link to={`/parent/students/${studentId}/fees`}>Fees</Link>
          )}
          {permissions?.canViewProgress && (
            <Link to={`/parent/students/${studentId}/progress`}>Progress</Link>
          )}
          {permissions?.canViewDocuments && (
            <Link to={`/parent/students/${studentId}/documents`}>Documents</Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default ParentStudentProfile;