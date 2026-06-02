import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import toast from "react-hot-toast";

import { studentApi } from "../../api/studentApi.js";
import { getStudentPhotoUrl } from "../../utils/fileUrl.js";

const getStudentName = (student) => {
  const fullName = `${student?.firstName || ""} ${student?.lastName || ""}`.trim();
  return fullName || student?.name || "Student";
};

const formatDate = (value) => {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleDateString("en-IN");
};

const displayValue = (value) => {
  const text = String(value ?? "").trim();
  return text || "-";
};

const displayPhone = (countryCode, phone) => {
  const cleanPhone = String(phone || "").trim();
  if (!cleanPhone) return "-";

  return `${countryCode || "+91"} ${cleanPhone}`;
};

const displayBelt = (student) => {
  const belt = student?.beltRank || "-";

  if (belt === "Black" && student?.danRank) {
    return `${belt} (${student.danRank})`;
  }

  return belt;
};

const displayList = (value) => {
  if (!Array.isArray(value) || !value.length) return "-";
  return value.filter(Boolean).join(", ") || "-";
};

const getHeight = (student) => {
  const value = student?.heightCm ?? student?.physicalInfo?.heightCm;
  return value ? `${value} cm` : "-";
};

const getWeight = (student) => {
  const value = student?.weightKg ?? student?.physicalInfo?.weightKg;
  return value ? `${value} kg` : "-";
};

const StudentProfile = () => {
  const { id } = useParams();

  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStudent = async () => {
      try {
        const response = await studentApi.getById(id);
        const studentData =
          response?.data?.data || response?.data?.student || response?.data || null;

        setStudent(studentData);
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

      <div className="grid grid-4">
        <div className="card stat-card">
          <span>Status</span>
          <strong>{student.status || "-"}</strong>
        </div>

        <div className="card stat-card">
          <span>Age</span>
          <strong>{student.age !== null && student.age !== undefined ? `${student.age} Years` : "-"}</strong>
        </div>

        <div className="card stat-card">
          <span>Age Category</span>
          <strong>{student.ageCategory || "-"}</strong>
        </div>

        <div className="card stat-card">
          <span>Belt Rank</span>
          <strong>{displayBelt(student)}</strong>
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
            <strong>Admission Number:</strong>{" "}
            {displayValue(student.admissionNumber || student.studentCode)}
          </p>

          <p>
            <strong>Aadhaar Number:</strong> {displayValue(student.aadhaarNumber)}
          </p>

          <p>
            <strong>Gender:</strong> {displayValue(student.gender)}
          </p>

          <p>
            <strong>DOB:</strong> {formatDate(student.dateOfBirth || student.dob)}
          </p>

          <p>
            <strong>Age:</strong>{" "}
            {student.age !== null && student.age !== undefined
              ? `${student.age} Years`
              : "-"}
          </p>

          <p>
            <strong>Age Category:</strong> {displayValue(student.ageCategory)}
          </p>

          <p>
            <strong>Phone:</strong>{" "}
            {displayPhone(student.countryCode, student.phone)}
          </p>

          <p>
            <strong>Email:</strong> {displayValue(student.email)}
          </p>

          <p>
            <strong>Branch:</strong> {displayValue(student.branch?.branchName)}
          </p>

          <p>
            <strong>Batch:</strong> {displayValue(student.batch?.batchName)}
          </p>

          <p>
            <strong>City:</strong> {displayValue(student.city)}
          </p>

          <p>
            <strong>State:</strong> {displayValue(student.state)}
          </p>

          <p>
            <strong>Country:</strong> {displayValue(student.country)}
          </p>
        </div>

        <hr />

        <p>
          <strong>Address:</strong> {displayValue(student.address)}
        </p>
      </div>

      <div className="card">
        <h2>Education Information</h2>

        <div className="details-grid">
          <p>
            <strong>School Name:</strong>{" "}
            {displayValue(student.schoolName || student.education?.schoolName)}
          </p>

          <p>
            <strong>Class:</strong>{" "}
            {displayValue(student.className || student.education?.className)}
          </p>

          <p>
            <strong>Section:</strong>{" "}
            {displayValue(student.section || student.education?.section)}
          </p>

          <p>
            <strong>College Name:</strong>{" "}
            {displayValue(student.collegeName || student.education?.collegeName)}
          </p>

          <p>
            <strong>Occupation:</strong>{" "}
            {displayValue(student.occupation || student.education?.occupation)}
          </p>
        </div>
      </div>

      <div className="card">
        <h2>Training Information</h2>

        <div className="details-grid">
          <p>
            <strong>Martial Art / Sport:</strong>{" "}
            {displayValue(student.martialArt)}
          </p>

          <p>
            <strong>Belt Rank:</strong> {displayBelt(student)}
          </p>

          <p>
            <strong>Joining Date:</strong> {formatDate(student.joiningDate)}
          </p>
        </div>
      </div>

      <div className="card">
        <h2>Physical Information</h2>

        <div className="details-grid">
          <p>
            <strong>Height:</strong> {getHeight(student)}
          </p>

          <p>
            <strong>Weight:</strong> {getWeight(student)}
          </p>
        </div>
      </div>

      <div className="card">
        <h2>Medical Information</h2>

        <div className="details-grid">
          <p>
            <strong>Blood Group:</strong>{" "}
            {displayValue(student.bloodGroup || student.medicalInfo?.bloodGroup)}
          </p>

          <p>
            <strong>Medical Conditions:</strong>{" "}
            {displayList(
              student.medicalConditions || student.medicalInfo?.medicalConditions
            )}
          </p>
        </div>

        <p>
          <strong>Medical Notes:</strong>{" "}
          {displayValue(student.notes || student.medicalInfo?.notes)}
        </p>
      </div>

      <div className="card">
        <h2>Parent & Emergency Contact</h2>

        <div className="details-grid">
          <p>
            <strong>Parent Name:</strong> {displayValue(student.parentName)}
          </p>

          <p>
            <strong>Parent Phone:</strong>{" "}
            {displayPhone(student.parentCountryCode, student.parentPhone)}
          </p>

          <p>
            <strong>Emergency Contact Name:</strong>{" "}
            {displayValue(student.emergencyContact?.name)}
          </p>

          <p>
            <strong>Emergency Contact Phone:</strong>{" "}
            {displayPhone(
              student.emergencyContact?.countryCode,
              student.emergencyContact?.phone
            )}
          </p>
        </div>
      </div>

      <div className="card">
        <h2>Quick Links</h2>

        <div className="actions">
          <Link to={`/attendance/student/${student._id}`}>Attendance History</Link>
          <Link to={`/fees/student/${student._id}`}>Fee History</Link>
          <Link to={`/students/${student._id}/belt-history`}>Belt History</Link>
          <Link to={`/students/${student._id}/championship-history`}>
            Championship History
          </Link>
          <Link to={`/students/${student._id}/tournament-history`}>
            Tournament History
          </Link>
          <Link to={`/students/${student._id}/timeline`}>Progress Timeline</Link>
          <Link to={`/students/${student._id}/id-cards`}>ID Cards</Link>
          <Link to={`/students/${student._id}/certificates`}>Certificates</Link>
        </div>
      </div>

      <div className="card">
        <div className="page-header">
          <div>
            <h2>Fees</h2>
            <p>Student fee summary</p>
          </div>

          <Link className="btn btn-primary" to={`/fees/student/${student._id}`}>
            View Fee History
          </Link>
        </div>

        <div className="grid grid-4">
          <div className="stat-card">
            <span>Monthly Fee</span>
            <strong>
              ₹{Number(student.monthlyFeeOverride || 0).toLocaleString("en-IN")}
            </strong>
          </div>

          <div className="stat-card">
            <span>Fee Due Day</span>
            <strong>{student.feeDueDay || "-"}</strong>
          </div>

          <div className="stat-card">
            <span>Scholarship</span>
            <strong>
              ₹{Number(student.scholarshipAmount || 0).toLocaleString("en-IN")}
            </strong>
          </div>

          <div className="stat-card">
            <span>Discount %</span>
            <strong>{student.discountPercent || 0}%</strong>
          </div>
        </div>

        <div style={{ marginTop: "16px" }}>
          <Link className="btn btn-primary" to={`/fees/collect?student=${student._id}`}>
            Collect Fee
          </Link>
        </div>
      </div>
    </div>
  );
};

export default StudentProfile;