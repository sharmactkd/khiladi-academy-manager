import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { studentApi } from "../../api/studentApi.js";

const StudentProfile = () => {
  const { id } = useParams();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStudent = async () => {
      try {
        const response = await studentApi.getById(id);
        setStudent(response.data?.data?.student);
      } catch (error) {
        toast.error(error.response?.data?.message || "Student load nahi hua");
      } finally {
        setLoading(false);
      }
    };

    fetchStudent();
  }, [id]);

  if (loading) return <p>Loading student...</p>;
  if (!student) return <p>Student not found.</p>;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>{student.name}</h1>
          <p>{student.studentCode}</p>
        </div>

        <Link className="btn btn-primary" to={`/students/${student._id}/edit`}>
          Edit Student
        </Link>
      </div>

      <div className="grid grid-3">
        <div className="card stat-card">
          <span>Status</span>
          <strong>{student.status}</strong>
        </div>

        <div className="card stat-card">
          <span>Batch</span>
          <strong>{student.batch?.batchName || "-"}</strong>
        </div>

        <div className="card stat-card">
          <span>Belt Rank</span>
          <strong>{student.beltRank || "-"}</strong>
        </div>
      </div>

      <div className="card">
        <h2>Student Details</h2>

        <div className="details-grid">
          <p>
            <strong>Phone:</strong> {student.phone || "-"}
          </p>
          <p>
            <strong>Email:</strong> {student.email || "-"}
          </p>
          <p>
            <strong>Gender:</strong> {student.gender || "-"}
          </p>
          <p>
            <strong>DOB:</strong>{" "}
            {student.dob ? new Date(student.dob).toLocaleDateString() : "-"}
          </p>
          <p>
            <strong>Martial Art:</strong> {student.martialArt || "-"}
          </p>
          <p>
            <strong>Belt Rank:</strong> {student.beltRank || "-"}
          </p>
          <p>
            <strong>Parent:</strong> {student.parentName || "-"}
          </p>
          <p>
            <strong>Parent Phone:</strong> {student.parentPhone || "-"}
          </p>
          <p>
            <strong>City:</strong> {student.city || "-"}
          </p>
          <p>
            <strong>State:</strong> {student.state || "-"}
          </p>
        </div>

        <hr />

        <p>
          <strong>Address:</strong> {student.address || "-"}
        </p>
        <p>
          <strong>Medical Notes:</strong> {student.medicalNotes || "-"}
        </p>
      </div>

      <div className="card">
        <h2>Quick Links</h2>

        <div className="actions">
          <Link to={`/attendance/student/${student._id}`}>
            Attendance History
          </Link>
          <Link to={`/fees/student/${student._id}`}>Fee History</Link>
        </div>
      </div>
    </div>
  );
};

export default StudentProfile;