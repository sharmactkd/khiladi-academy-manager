import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { parentLinkApi } from "../../api/parentLinkApi.js";
import { studentApi } from "../../api/studentApi.js";
import api from "../../api/api.js";

const initialForm = {
  student: "",
  guardianUser: "",
  relationship: "guardian",
  canViewAttendance: true,
  canViewFees: true,
  canViewProgress: true,
  canViewDocuments: true,
  isPrimary: false,
};

const CreateParentLink = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState(initialForm);
  const [students, setStudents] = useState([]);
  const [users, setUsers] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadData = async () => {
      try {
        const [studentResponse, userResponse] = await Promise.all([
          studentApi.getAll({ limit: 100, status: "active" }),
          api.get("/admin/users", { params: { limit: 200 } }),
        ]);

        setStudents(studentResponse.data?.data?.students || []);

        const allUsers =
          userResponse.data?.data?.users ||
          userResponse.data?.data?.items ||
          userResponse.data?.data ||
          [];

        setUsers(
          allUsers.filter((user) => ["parent", "student"].includes(user.role))
        );
      } catch {
        setStudents([]);
        setUsers([]);
      }
    };

    loadData();
  }, []);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");
      await parentLinkApi.create(form);
      alert("Parent/student link created successfully");
      navigate("/parent-links");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create parent link");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Create Parent / Student Link</h1>
          <p>Attach a parent/student login user to a student profile.</p>
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
                {student.name} ({student.studentCode})
              </option>
            ))}
          </select>
        </label>

        <label>
          Parent / Student User
          <select
            name="guardianUser"
            value={form.guardianUser}
            onChange={handleChange}
            required
          >
            <option value="">Select User</option>
            {users.map((user) => (
              <option key={user._id || user.id} value={user._id || user.id}>
                {user.name} - {user.role} ({user.email || user.phone || "-"})
              </option>
            ))}
          </select>
        </label>

        <label>
          Relationship
          <select
            name="relationship"
            value={form.relationship}
            onChange={handleChange}
          >
            <option value="father">Father</option>
            <option value="mother">Mother</option>
            <option value="guardian">Guardian</option>
            <option value="self">Self</option>
            <option value="other">Other</option>
          </select>
        </label>

        <label className="checkbox-row">
          <input
            type="checkbox"
            name="isPrimary"
            checked={form.isPrimary}
            onChange={handleChange}
          />
          Primary Guardian
        </label>

        <label className="checkbox-row">
          <input
            type="checkbox"
            name="canViewAttendance"
            checked={form.canViewAttendance}
            onChange={handleChange}
          />
          Can View Attendance
        </label>

        <label className="checkbox-row">
          <input
            type="checkbox"
            name="canViewFees"
            checked={form.canViewFees}
            onChange={handleChange}
          />
          Can View Fees
        </label>

        <label className="checkbox-row">
          <input
            type="checkbox"
            name="canViewProgress"
            checked={form.canViewProgress}
            onChange={handleChange}
          />
          Can View Progress
        </label>

        <label className="checkbox-row">
          <input
            type="checkbox"
            name="canViewDocuments"
            checked={form.canViewDocuments}
            onChange={handleChange}
          />
          Can View Documents
        </label>

        <div className="form-actions full-width">
          <button className="btn btn-primary" type="submit" disabled={saving}>
            {saving ? "Saving..." : "Create Link"}
          </button>

          <button
            className="btn btn-secondary"
            type="button"
            onClick={() => navigate("/parent-links")}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateParentLink;