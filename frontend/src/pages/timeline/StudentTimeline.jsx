import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { studentTimelineApi } from "../../api/studentTimelineApi.js";
import TimelineList from "../../components/timeline/TimelineList.jsx";

const StudentTimeline = () => {
  const { studentId } = useParams();

  const [student, setStudent] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [note, setNote] = useState({
    title: "",
    description: "",
    date: new Date().toISOString().slice(0, 10),
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const loadTimeline = async () => {
    try {
      setLoading(true);
      const response = await studentTimelineApi.getByStudent(studentId);
      setStudent(response.data?.data?.student || null);
      setTimeline(response.data?.data?.timeline || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load timeline");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTimeline();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId]);

  const handleNoteChange = (event) => {
    const { name, value } = event.target;
    setNote((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddNote = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);

      await studentTimelineApi.createNote({
        student: studentId,
        ...note,
      });

      setNote({
        title: "",
        description: "",
        date: new Date().toISOString().slice(0, 10),
      });

      await loadTimeline();
      alert("Timeline note added successfully");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to add timeline note");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="card">Loading timeline...</div>;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Student Timeline</h1>
          <p>{student?.name || "Student"} complete progress history.</p>
        </div>

        <Link className="btn btn-secondary" to={`/students/${studentId}`}>
          Back to Student
        </Link>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <form className="card form-grid" onSubmit={handleAddNote}>
        <h2 className="full-width">Add Manual Note</h2>

        <label>
          Title
          <input
            name="title"
            value={note.title}
            onChange={handleNoteChange}
            required
          />
        </label>

        <label>
          Date
          <input
            type="date"
            name="date"
            value={note.date}
            onChange={handleNoteChange}
            required
          />
        </label>

        <label className="full-width">
          Description
          <textarea
            name="description"
            value={note.description}
            onChange={handleNoteChange}
            rows="3"
          />
        </label>

        <div className="form-actions full-width">
          <button className="btn btn-primary" type="submit" disabled={saving}>
            {saving ? "Adding..." : "Add Note"}
          </button>
        </div>
      </form>

      <TimelineList timeline={timeline} />
    </div>
  );
};

export default StudentTimeline;