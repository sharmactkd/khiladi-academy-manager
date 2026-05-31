import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import { beltTestApi } from "../../api/beltTestApi.js";
import { studentApi } from "../../api/studentApi.js";
import { getStudentPhotoUrl } from "../../utils/fileUrl.js";

const initialForm = {
  student: "",
  currentBelt: "",
  promotedToBelt: "",
  testDate: "",
  result: "pending",
  examinerName: "",
  remarks: "",
  certificateNumber: "",
  certificateUrl: "",
};

const normalizeList = (response, nestedKey) => {
  const data = response?.data;

  if (Array.isArray(response)) return response;
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.data?.[nestedKey])) return data.data[nestedKey];
  if (Array.isArray(data?.[nestedKey])) return data[nestedKey];

  return [];
};

const getStudentName = (student) => {
  const fullName = `${student?.firstName || ""} ${
    student?.lastName || ""
  }`.trim();

  return student?.name || fullName || "Student";
};

const getStudentCode = (student) =>
  student?.studentCode || student?.admissionNumber || "-";

const AddBeltTest = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const studentIdFromUrl = searchParams.get("student") || "";

  const [form, setForm] = useState({
    ...initialForm,
    student: studentIdFromUrl,
  });

  const [students, setStudents] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showPhotoModal, setShowPhotoModal] = useState(false);

  const selectedStudent = useMemo(() => {
    return (
      students.find(
        (student) => String(student._id) === String(form.student)
      ) || null
    );
  }, [students, form.student]);

  useEffect(() => {
    const loadStudents = async () => {
      try {
        const response = await studentApi.getAll({});
        const list = normalizeList(response, "students");

        setStudents(list);

        if (studentIdFromUrl) {
          const matchedStudent = list.find(
            (student) => String(student._id) === String(studentIdFromUrl)
          );

          setForm((prev) => ({
            ...prev,
            student: studentIdFromUrl,
            currentBelt: matchedStudent?.beltRank || prev.currentBelt || "",
          }));
        }
      } catch {
        setStudents([]);
      }
    };

    loadStudents();
  }, [studentIdFromUrl]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    if (name === "student") {
      const nextStudent = students.find(
        (student) => String(student._id) === String(value)
      );

      setForm((prev) => ({
        ...prev,
        student: value,
        currentBelt: nextStudent?.beltRank || "",
      }));

      return;
    }

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");

      await beltTestApi.create({
        ...form,
        testDate: form.testDate
          ? new Date(form.testDate).toISOString()
          : new Date().toISOString(),
      });

      alert("Belt test created successfully");
      navigate("/belt-tests");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create belt test");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Add Belt Test</h1>
          <p>Create a new belt test and promotion record.</p>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <form className="card form-grid" onSubmit={handleSubmit}>
        <label>
          Student
          <select
            name="student"
            value={form.student}
            onChange={handleChange}
            required
          >
            <option value="">Select Student</option>

            {students.map((student) => (
              <option key={student._id} value={student._id}>
                {getStudentName(student)} ({getStudentCode(student)})
              </option>
            ))}
          </select>
        </label>

        <label>
          Current Belt
          <input
            name="currentBelt"
            value={form.currentBelt}
            onChange={handleChange}
            placeholder={selectedStudent?.beltRank || ""}
            required
          />
        </label>

        {selectedStudent && (
          <div className="full-width card subtle-card">
            <h3>Student Photo</h3>

            <button
              type="button"
              onClick={() => setShowPhotoModal(true)}
              style={{
                border: 0,
                background: "transparent",
                padding: 0,
                cursor: "pointer",
              }}
            >
              <img
                src={getStudentPhotoUrl(selectedStudent)}
                alt={getStudentName(selectedStudent)}
                onError={(event) => {
                  event.currentTarget.src = "/default-avatar.png";
                }}
                style={{
                  width: "120px",
                  height: "150px",
                  objectFit: "cover",
                  borderRadius: "12px",
                  border: "1px solid #d1d5db",
                  background: "#ffffff",
                }}
              />
            </button>

            <p style={{ marginTop: "10px", marginBottom: 0 }}>
              {getStudentName(selectedStudent)} ({getStudentCode(selectedStudent)})
            </p>
          </div>
        )}

        <label>
          Promoted To Belt
          <input
            name="promotedToBelt"
            value={form.promotedToBelt}
            onChange={handleChange}
            required
          />
        </label>

        <label>
          Test Date
          <input
            type="date"
            name="testDate"
            value={form.testDate}
            onChange={handleChange}
            required
          />
        </label>

        <label>
          Result
          <select name="result" value={form.result} onChange={handleChange}>
            <option value="pending">Pending</option>
            <option value="pass">Pass</option>
            <option value="fail">Fail</option>
          </select>
        </label>

        <label>
          Examiner Name
          <input
            name="examinerName"
            value={form.examinerName}
            onChange={handleChange}
          />
        </label>

        <label>
          Certificate Number
          <input
            name="certificateNumber"
            value={form.certificateNumber}
            onChange={handleChange}
          />
        </label>

        <label>
          Certificate URL
          <input
            name="certificateUrl"
            value={form.certificateUrl}
            onChange={handleChange}
          />
        </label>

        <label className="full-width">
          Remarks
          <textarea
            name="remarks"
            value={form.remarks}
            onChange={handleChange}
            rows="4"
          />
        </label>

        <div className="form-actions full-width">
          <button className="btn btn-primary" type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save Belt Test"}
          </button>

          <button
            className="btn btn-secondary"
            type="button"
            onClick={() => navigate("/belt-tests")}
          >
            Cancel
          </button>
        </div>
      </form>

      {showPhotoModal && selectedStudent && (
        <div
          onClick={() => setShowPhotoModal(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.72)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px",
          }}
        >
          <div
            onClick={(event) => event.stopPropagation()}
            style={{
              width: "min(520px, 95vw)",
              background: "#ffffff",
              borderRadius: "18px",
              padding: "24px",
              boxShadow: "0 25px 60px rgba(0,0,0,0.25)",
            }}
          >
            <div className="page-header">
              <div>
                <h2>Student Photo</h2>
                <p>
                  {getStudentName(selectedStudent)} (
                  {getStudentCode(selectedStudent)})
                </p>
              </div>

              <button
                type="button"
                className="btn"
                onClick={() => setShowPhotoModal(false)}
              >
                Close
              </button>
            </div>

            <div style={{ textAlign: "center", margin: "24px 0" }}>
              <img
                src={getStudentPhotoUrl(selectedStudent)}
                alt={getStudentName(selectedStudent)}
                onError={(event) => {
                  event.currentTarget.src = "/default-avatar.png";
                }}
                style={{
                  maxWidth: "100%",
                  maxHeight: "420px",
                  objectFit: "contain",
                  borderRadius: "14px",
                  border: "1px solid #e5e7eb",
                  background: "#ffffff",
                  padding: "8px",
                }}
              />
            </div>

            <div className="form-actions">
              <Link
                className="btn btn-primary"
                to={`/students/${selectedStudent._id}/edit`}
              >
                Change Photo
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddBeltTest;