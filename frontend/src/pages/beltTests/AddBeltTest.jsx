import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { beltTestApi } from "../../api/beltTestApi.js";
import { studentApi } from "../../api/studentApi.js";

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

  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.data?.[nestedKey])) return data.data[nestedKey];
  if (Array.isArray(data?.[nestedKey])) return data[nestedKey];

  return [];
};

const getStudentName = (student) => {
  const fullName = `${student.firstName || ""} ${student.lastName || ""}`.trim();
  return student.name || fullName || "Student";
};

const getStudentCode = (student) =>
  student.studentCode || student.admissionNumber || "-";

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

  const selectedStudent = useMemo(() => {
    return students.find((student) => student._id === form.student) || null;
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
      const nextStudent = students.find((student) => student._id === value);

      setForm((prev) => ({
        ...prev,
        student: value,
        currentBelt: nextStudent?.beltRank || "",
      }));

      return;
    }

    setForm((prev) => ({ ...prev, [name]: value }));
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
    </div>
  );
};

export default AddBeltTest;