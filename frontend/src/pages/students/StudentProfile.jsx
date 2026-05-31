import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { studentApi } from "../../api/studentApi.js";
import { getStudentPhotoUrl } from "../../utils/fileUrl.js";


const getStudentName = (student) => {
  const fullName = `${student?.firstName || ""} ${student?.lastName || ""}`.trim();
  return fullName || student?.name || "Student";
};


const StudentProfile = () => {
  const { id } = useParams();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStudent = async () => {
      try {
 const response = await studentApi.getById(id);

console.log("Student Response:", response);
console.log("Student Data:", response?.data);

setStudent(response?.data || null);
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
          <h1>{getStudentName(student)}</h1>
          <p>{student.admissionNumber || student.studentCode || "-"}</p>
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
          <span>Branch</span>
          <strong>{student.branch?.branchName || "-"}</strong>
        </div>

        <div className="card stat-card">
          <span>Belt Rank</span>
          <strong>{student.beltRank || "-"}</strong>
        </div>
      </div>

      <div className="card">
        <h2>Student Details</h2>

<div
  style={{
    display: "flex",
    justifyContent: "center",
    marginBottom: "24px",
  }}
>
  <img
    src={getStudentPhotoUrl(student)}
    alt={getStudentName(student)}
    onError={(event) => {
      event.currentTarget.src = "/default-avatar.png";
    }}
    style={{
      width: "160px",
      height: "200px",
      objectFit: "cover",
      borderRadius: "12px",
      border: "1px solid #d1d5db",
      background: "#fff",
    }}
  />
</div>

        <div className="details-grid">
          <p>
            <strong>Phone:</strong> {student.phone || "-"}
          </p>
          <p>
            <strong>Email:</strong> {student.email || "-"}
          </p>

          <p>
  <strong>School:</strong> {student.schoolName || "-"}
</p>

          <p>
            <strong>Gender:</strong> {student.gender || "-"}
          </p>
          <p>
            <strong>DOB:</strong>{" "}
            {student.dateOfBirth
              ? new Date(student.dateOfBirth).toLocaleDateString()
              : student.dob
                ? new Date(student.dob).toLocaleDateString()
                : "-"}
          </p>
          <p>
            <strong>Martial Art:</strong> {student.martialArt || "-"}
          </p>
          <p>
            <strong>Belt Rank:</strong> {student.beltRank || "-"}
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
          <strong>Notes:</strong> {student.notes || "-"}
        </p>
      </div>

      <div className="card">
        <h2>Quick Links</h2>

        <div className="actions">
          <Link to={`/attendance/student/${student._id}`}>
            Attendance History
          </Link>
          <Link to={`/fees/student/${student._id}`}>Fee History</Link>
          <Link to={`/students/${student._id}/belt-history`}>
            Belt History
          </Link>
          <Link to={`/students/${student._id}/championship-history`}>
            Championship History
          </Link>
          <Link to={`/students/${student._id}/tournament-history`}>
            Tournament History
          </Link>
          <Link to={`/students/${student._id}/timeline`}>
            Progress Timeline
          </Link>
          <Link to={`/students/${student._id}/id-cards`}>ID Cards</Link>
          <Link to={`/students/${student._id}/certificates`}>
            Certificates
          </Link>
        </div>
      </div>

      <div className="card">
  <div className="page-header">
    <div>
      <h2>Fees</h2>
      <p>Student fee summary</p>
    </div>

    <Link
      className="btn btn-primary"
      to={`/fees/student/${student._id}`}
    >
      View Fee History
    </Link>
  </div>

  <div className="grid grid-4">
    <div className="stat-card">
      <span>Monthly Fee</span>

      <strong>
        ₹
        {Number(
          student.monthlyFeeOverride || 0
        ).toLocaleString("en-IN")}
      </strong>
    </div>

    <div className="stat-card">
      <span>Fee Due Day</span>

      <strong>
        {student.feeDueDay || "-"}
      </strong>
    </div>

    <div className="stat-card">
      <span>Scholarship</span>

      <strong>
        ₹
        {Number(
          student.scholarshipAmount || 0
        ).toLocaleString("en-IN")}
      </strong>
    </div>

    <div className="stat-card">
      <span>Discount %</span>

      <strong>
        {student.discountPercent || 0}%
      </strong>
    </div>
  </div>

  <div style={{ marginTop: "16px" }}>
    <Link
      className="btn btn-primary"
      to={`/fees/collect?student=${student._id}`}
    >
      Collect Fee
    </Link>
  </div>
</div>
    </div>
  );
};

export default StudentProfile;