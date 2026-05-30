import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { championshipRecordApi } from "../../api/championshipRecordApi.js";
import { studentApi } from "../../api/studentApi.js";

const initialForm = {
  student: "",
  championshipName: "",
  level: "open",
  eventType: "kyorugi",
  ageCategory: "",
  weightCategory: "",
  result: "participated",
  date: "",
  venue: "",
  organizer: "",
  remarks: "",
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

const AddChampionshipRecord = () => {
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
            weightCategory: matchedStudent?.weightCategory || prev.weightCategory,
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

    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");

      await championshipRecordApi.create({
        ...form,
        date: form.date
          ? new Date(form.date).toISOString()
          : new Date().toISOString(),
      });

      alert("Championship record created successfully");
      navigate("/championship-records");
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to create championship record"
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Add Championship Record</h1>
          <p>Add tournament participation, medal or certificate record.</p>
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
          Championship Name
          <input
            name="championshipName"
            value={form.championshipName}
            onChange={handleChange}
            required
          />
        </label>

        <label>
          Level
          <select name="level" value={form.level} onChange={handleChange}>
            <option value="district">District</option>
            <option value="state">State</option>
            <option value="national">National</option>
            <option value="international">International</option>
            <option value="open">Open</option>
          </select>
        </label>

        <label>
          Event Type
          <select name="eventType" value={form.eventType} onChange={handleChange}>
            <option value="kyorugi">Kyorugi</option>
            <option value="poomsae">Poomsae</option>
            <option value="demo">Demo</option>
            <option value="other">Other</option>
          </select>
        </label>

        <label>
          Result
          <select name="result" value={form.result} onChange={handleChange}>
            <option value="gold">Gold</option>
            <option value="silver">Silver</option>
            <option value="bronze">Bronze</option>
            <option value="participated">Participated</option>
            <option value="disqualified">Disqualified</option>
          </select>
        </label>

        <label>
          Date
          <input
            type="date"
            name="date"
            value={form.date}
            onChange={handleChange}
            required
          />
        </label>

        <label>
          Age Category
          <input
            name="ageCategory"
            value={form.ageCategory}
            onChange={handleChange}
          />
        </label>

        <label>
          Weight Category
          <input
            name="weightCategory"
            value={form.weightCategory}
            onChange={handleChange}
          />
        </label>

        <label>
          Venue
          <input name="venue" value={form.venue} onChange={handleChange} />
        </label>

        <label>
          Organizer
          <input
            name="organizer"
            value={form.organizer}
            onChange={handleChange}
          />
        </label>

        {selectedStudent && (
          <div className="card full-width">
            <strong>Selected Student:</strong>{" "}
            {getStudentName(selectedStudent)} ({getStudentCode(selectedStudent)})
          </div>
        )}

        <label className="full-width">
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
            {saving ? "Saving..." : "Save Record"}
          </button>

          <button
            className="btn btn-secondary"
            type="button"
            onClick={() => navigate("/championship-records")}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddChampionshipRecord;