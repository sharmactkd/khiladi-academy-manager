import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import toast from "react-hot-toast";

import { batchApi } from "../../api/batchApi.js";
import { studentApi } from "../../api/studentApi.js";

const formatTime = (time) => {
  if (!time) return "-";

  const [hours, minutes] = time.split(":");

  const date = new Date();
  date.setHours(Number(hours));
  date.setMinutes(Number(minutes));

  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

const currency = (value) => `₹${Number(value || 0).toLocaleString("en-IN")}`;

const displayValue = (value) => {
  const text = String(value || "").trim();
  return text || "-";
};

const formatLabel = (value) => {
  const text = String(value || "").trim();

  if (!text) return "-";

  return text
    .split("-")
    .map((item) => item.charAt(0).toUpperCase() + item.slice(1))
    .join(" ");
};

const getStudentName = (student) => {
  const fullName = `${student.firstName || ""} ${student.lastName || ""}`.trim();
  return student.name || fullName || "-";
};

const getAvailableSeats = (capacity, studentCount) => {
  const max = Number(capacity || 0);
  if (!max) return "-";

  return Math.max(max - Number(studentCount || 0), 0);
};

const formatGenderGroup = (value) => {
  if (value === "male") return "Male";
  if (value === "female") return "Female";
  return "Male & Female";
};

const BatchDetail = () => {
  const { id } = useParams();

  const [batch, setBatch] = useState(null);
  const [studentCount, setStudentCount] = useState(0);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBatch = async () => {
      try {
        const [batchRes, studentRes] = await Promise.all([
          batchApi.getById(id),
          studentApi.getAll({ batch: id, status: "active" }),
        ]);

        const batchData = batchRes.data?.data || null;

        const studentList = Array.isArray(studentRes.data)
          ? studentRes.data
          : studentRes.data?.data?.students || studentRes.data?.data || [];

        setBatch(batchData);
        setStudentCount(studentList.length || batchData?.students?.length || 0);
        setStudents(Array.isArray(studentList) ? studentList : []);
      } catch (error) {
        toast.error(error.response?.data?.message || "Batch load nahi hua");
      } finally {
        setLoading(false);
      }
    };

    fetchBatch();
  }, [id]);

  if (loading) return <p>Loading batch...</p>;
  if (!batch) return <p>Batch not found.</p>;

  const firstSchedule = batch.schedule?.[0] || null;
  const availableSeats = getAvailableSeats(batch.capacity, studentCount);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>{batch.batchName}</h1>
          <p>
            {batch.martialArt || "-"}{" "}
            {batch.batchCode ? `• ${batch.batchCode}` : ""}
          </p>
        </div>

        <div className="actions">
          <Link className="btn btn-primary" to="/students/new">
            Add Student
          </Link>

          <Link className="btn btn-primary" to={`/batches/${batch._id}/edit`}>
            Edit Batch
          </Link>
        </div>
      </div>

      <div className="grid grid-4">
        <div className="card stat-card">
          <span>Status</span>
          <strong>{batch.isActive ? "active" : "inactive"}</strong>
        </div>

        <div className="card stat-card">
          <span>Students</span>
          <strong>
            {studentCount} / {batch.capacity || 0}
          </strong>
        </div>

        <div className="card stat-card">
          <span>Available Seats</span>
          <strong>{availableSeats}</strong>
        </div>

        <div className="card stat-card">
          <span>Time</span>
          <strong>
            {formatTime(firstSchedule?.startTime)} -{" "}
            {formatTime(firstSchedule?.endTime)}
          </strong>
        </div>

        <div className="card stat-card">
          <span>Monthly Fee</span>
          <strong>{currency(batch.monthlyFee)}</strong>
        </div>

        <div className="card stat-card">
          <span>Batch Type</span>
          <strong>{formatLabel(batch.batchType)}</strong>
        </div>

        <div className="card stat-card">
          <span>Skill Level</span>
          <strong>{formatLabel(batch.skillLevel)}</strong>
        </div>

        <div className="card stat-card">
          <span>Mode</span>
          <strong>{formatLabel(batch.mode)}</strong>
        </div>
      </div>

      <div className="card">
        <h2>Batch Details</h2>

        <div className="details-grid">
          <p>
            <strong>Batch Code:</strong> {displayValue(batch.batchCode)}
          </p>

          <p>
            <strong>Martial Art / Sport:</strong>{" "}
            {displayValue(batch.martialArt)}
          </p>

<p>
  <strong>Gender Group:</strong> {formatGenderGroup(batch.genderGroup)}
</p>

          <p>
            <strong>Branch:</strong>{" "}
            {batch.branch?.branchName || batch.branch?.branchCode || "-"}
          </p>

          <p>
            <strong>Batch Type:</strong> {formatLabel(batch.batchType)}
          </p>

          <p>
            <strong>Skill Level:</strong> {formatLabel(batch.skillLevel)}
          </p>

          <p>
            <strong>Mode:</strong> {formatLabel(batch.mode)}
          </p>

          <p>
            <strong>Session Slot:</strong> {formatLabel(batch.sessionSlot)}
          </p>

          <p>
            <strong>Venue / Hall:</strong> {displayValue(batch.venue)}
          </p>

          <p>
            <strong>Batch Color Tag:</strong> {displayValue(batch.batchColor)}
          </p>

          <p>
            <strong>Competition Batch:</strong>{" "}
            {batch.isCompetitionBatch ? "Yes" : "No"}
          </p>

          <p>
            <strong>Notes:</strong> {displayValue(batch.notes)}
          </p>
        </div>
      </div>

      <div className="card">
        <h2>Training Schedule</h2>

        <div className="details-grid">
          <p>
            <strong>Days:</strong>{" "}
            {batch.schedule?.map((item) => item.day).join(", ") || "-"}
          </p>

          <p>
            <strong>Start Time:</strong> {formatTime(firstSchedule?.startTime)}
          </p>

          <p>
            <strong>End Time:</strong> {formatTime(firstSchedule?.endTime)}
          </p>
        </div>
      </div>

      <div className="card">
        <h2>Coach Assignment</h2>

        <div className="details-grid">
          <p>
            <strong>System Coach:</strong> {batch.coach?.name || "-"}
          </p>

          <p>
            <strong>Head Coach:</strong> {displayValue(batch.headCoachName)}
          </p>

          <p>
            <strong>Assistant Coach:</strong>{" "}
            {displayValue(batch.assistantCoachName)}
          </p>

          <p>
            <strong>Additional Coaches:</strong>{" "}
            {Array.isArray(batch.additionalCoaches) &&
            batch.additionalCoaches.length
              ? batch.additionalCoaches
                  .filter((coach) => coach?.name || coach?.phone)
                  .map((coach) => {
                    const name = coach.name || "Coach";
                    const phone = coach.phone ? ` (${coach.phone})` : "";
                    return `${name}${phone}`;
                  })
                  .join(", ")
              : "-"}
          </p>
        </div>
      </div>

      <div className="card">
        <h2>Student Capacity & Eligibility</h2>

        <div className="details-grid">
          <p>
            <strong>Capacity:</strong> {batch.capacity || 0}
          </p>

          <p>
            <strong>Current Students:</strong> {studentCount}
          </p>

          <p>
            <strong>Available Seats:</strong> {availableSeats}
          </p>

          <p>
            <strong>Min Age:</strong>{" "}
            {batch.minAge === null || batch.minAge === undefined
              ? "-"
              : batch.minAge}
          </p>

          <p>
            <strong>Max Age:</strong>{" "}
            {batch.maxAge === null || batch.maxAge === undefined
              ? "-"
              : batch.maxAge}
          </p>

          <p>
            <strong>Minimum Belt:</strong> {displayValue(batch.minBelt)}
          </p>

          <p>
            <strong>Maximum Belt:</strong> {displayValue(batch.maxBelt)}
          </p>

          <p>
            <strong>Minimum Attendance %:</strong>{" "}
            {batch.minimumAttendancePercentage ?? 75}%
          </p>
        </div>
      </div>

      <div className="card">
        <h2>Batch Fee Structure</h2>

        <div className="details-grid">
          <p>
            <strong>Monthly Fee:</strong> {currency(batch.monthlyFee)}
          </p>

          <p>
            <strong>Quarterly Fee:</strong> {currency(batch.quarterlyFee)}
          </p>

          <p>
            <strong>Annual Fee:</strong> {currency(batch.annualFee)}
          </p>

          <p>
            <strong>Registration Fee:</strong> {currency(batch.registrationFee)}
          </p>

          <p>
            <strong>Uniform Fee:</strong> {currency(batch.uniformFee)}
          </p>

          <p>
            <strong>Examination Fee:</strong> {currency(batch.examinationFee)}
          </p>

          <p>
            <strong>Late Fee:</strong> {currency(batch.lateFee)}
          </p>

          <p>
            <strong>Fee Due Day:</strong> {batch.feeDueDay || 10}
          </p>
        </div>
      </div>

      <div className="card">
        <h2>Links & Communication</h2>

        <div className="details-grid">
          <p>
            <strong>Batch Language:</strong> {displayValue(batch.batchLanguage)}
          </p>

          <p>
            <strong>WhatsApp Group:</strong>{" "}
            {batch.whatsappGroupLink ? (
              <a
                href={batch.whatsappGroupLink}
                target="_blank"
                rel="noreferrer"
              >
                Open Link
              </a>
            ) : (
              "-"
            )}
          </p>

          <p>
            <strong>Google Meet:</strong>{" "}
            {batch.googleMeetLink ? (
              <a href={batch.googleMeetLink} target="_blank" rel="noreferrer">
                Open Link
              </a>
            ) : (
              "-"
            )}
          </p>
        </div>
      </div>

      <div className="card">
        <div className="page-header">
          <div>
            <h2>Students in this Batch</h2>
            <p>Active students list</p>
          </div>

          <Link to={`/attendance/batch/${batch._id}`}>Attendance History</Link>
        </div>

        {students.length === 0 ? (
          <p>No active students in this batch.</p>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Name</th>
                  <th>Phone</th>
                  <th>Belt</th>
                  <th>Batch Monthly Fee</th>
                </tr>
              </thead>

              <tbody>
                {students.map((student) => (
                  <tr key={student._id}>
                    <td>{student.studentCode || student.admissionNumber || "-"}</td>

                    <td>
                      <Link to={`/students/${student._id}`}>
                        {getStudentName(student)}
                      </Link>
                    </td>

                    <td>{student.phone || "-"}</td>

                    <td>{student.beltRank || "-"}</td>

                    <td>{currency(batch.monthlyFee)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default BatchDetail;