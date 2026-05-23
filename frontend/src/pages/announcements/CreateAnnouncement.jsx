import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { announcementApi } from "../../api/announcementApi.js";
import { studentApi } from "../../api/studentApi.js";
import api from "../../api/api.js";

const initialForm = {
  title: "",
  message: "",
  category: "general",
  audienceType: "all",
  batch: "",
  students: [],
  guardianUsers: [],
  publishAt: "",
  expiresAt: "",
  priority: "normal",
  channels: ["internal"],
  status: "published",
};

const CreateAnnouncement = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState(initialForm);
  const [students, setStudents] = useState([]);
  const [batches, setBatches] = useState([]);
  const [users, setUsers] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadData = async () => {
      try {
        const [studentResponse, batchResponse, userResponse] =
          await Promise.all([
            studentApi.getAll({ limit: 200, status: "active" }),
            api.get("/batches", { params: { limit: 200, status: "active" } }),
            api.get("/admin/users", { params: { limit: 300 } }),
          ]);

        setStudents(studentResponse.data?.data?.students || []);
        setBatches(batchResponse.data?.data?.batches || []);

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
        setBatches([]);
        setUsers([]);
      }
    };

    loadData();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleMultiSelect = (event) => {
    const { name, selectedOptions } = event.target;

    setForm((prev) => ({
      ...prev,
      [name]: Array.from(selectedOptions).map((option) => option.value),
    }));
  };

  const handleChannelChange = (event) => {
    const { value, checked } = event.target;

    setForm((prev) => {
      const existing = new Set(prev.channels);

      if (checked) {
        existing.add(value);
      } else {
        existing.delete(value);
      }

      return {
        ...prev,
        channels: Array.from(existing),
      };
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");

      const payload = {
        ...form,
        batch: form.batch || null,
        students: form.audienceType === "individual" ? form.students : [],
        guardianUsers:
          form.audienceType === "individual" ? form.guardianUsers : [],
        publishAt: form.publishAt || undefined,
        expiresAt: form.expiresAt || null,
        channels: form.channels.length ? form.channels : ["internal"],
      };

      await announcementApi.create(payload);
      alert("Announcement created successfully");
      navigate("/announcements");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create announcement");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Create Announcement</h1>
          <p>Send notice to parents, students, batches or selected users.</p>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <form className="card form-grid" onSubmit={handleSubmit}>
        <label>
          Title
          <input
            name="title"
            value={form.title}
            onChange={handleChange}
            required
          />
        </label>

        <label>
          Category
          <select
            name="category"
            value={form.category}
            onChange={handleChange}
          >
            <option value="general">General</option>
            <option value="fees">Fees</option>
            <option value="attendance">Attendance</option>
            <option value="belt_test">Belt Test</option>
            <option value="championship">Championship</option>
            <option value="holiday">Holiday</option>
            <option value="urgent">Urgent</option>
          </select>
        </label>

        <label>
          Audience Type
          <select
            name="audienceType"
            value={form.audienceType}
            onChange={handleChange}
          >
            <option value="all">All Linked Parents & Students</option>
            <option value="parents">Parents Only</option>
            <option value="students">Students Only</option>
            <option value="batch">Batch</option>
            <option value="individual">Individual</option>
          </select>
        </label>

        {form.audienceType === "batch" && (
          <label>
            Batch
            <select name="batch" value={form.batch} onChange={handleChange}>
              <option value="">Select Batch</option>
              {batches.map((batch) => (
                <option key={batch._id} value={batch._id}>
                  {batch.batchName}
                </option>
              ))}
            </select>
          </label>
        )}

        {form.audienceType === "individual" && (
          <>
            <label>
              Students
              <select
                name="students"
                multiple
                value={form.students}
                onChange={handleMultiSelect}
              >
                {students.map((student) => (
                  <option key={student._id} value={student._id}>
                    {student.name} ({student.studentCode})
                  </option>
                ))}
              </select>
            </label>

            <label>
              Parent / Student Users
              <select
                name="guardianUsers"
                multiple
                value={form.guardianUsers}
                onChange={handleMultiSelect}
              >
                {users.map((user) => (
                  <option key={user._id || user.id} value={user._id || user.id}>
                    {user.name} - {user.role} ({user.email || user.phone || "-"})
                  </option>
                ))}
              </select>
            </label>
          </>
        )}

        <label>
          Priority
          <select
            name="priority"
            value={form.priority}
            onChange={handleChange}
          >
            <option value="low">Low</option>
            <option value="normal">Normal</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </label>

        <label>
          Status
          <select name="status" value={form.status} onChange={handleChange}>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
          </select>
        </label>

        <label>
          Publish At
          <input
            type="datetime-local"
            name="publishAt"
            value={form.publishAt}
            onChange={handleChange}
          />
        </label>

        <label>
          Expires At
          <input
            type="datetime-local"
            name="expiresAt"
            value={form.expiresAt}
            onChange={handleChange}
          />
        </label>

        <div className="full-width">
          <strong>Channels</strong>
          <div className="channel-row">
            <label className="checkbox-row">
              <input
                type="checkbox"
                value="internal"
                checked={form.channels.includes("internal")}
                onChange={handleChannelChange}
              />
              Internal Notification
            </label>

            <label className="checkbox-row">
              <input
                type="checkbox"
                value="email"
                checked={form.channels.includes("email")}
                onChange={handleChannelChange}
              />
              Email
            </label>

            <label className="checkbox-row">
              <input
                type="checkbox"
                value="whatsapp"
                checked={form.channels.includes("whatsapp")}
                onChange={handleChannelChange}
              />
              WhatsApp Log Only
            </label>
          </div>
        </div>

        <label className="full-width">
          Message
          <textarea
            name="message"
            value={form.message}
            onChange={handleChange}
            rows="6"
            required
          />
        </label>

        <div className="form-actions full-width">
          <button className="btn btn-primary" type="submit" disabled={saving}>
            {saving ? "Publishing..." : "Create Announcement"}
          </button>

          <button
            className="btn btn-secondary"
            type="button"
            onClick={() => navigate("/announcements")}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateAnnouncement;