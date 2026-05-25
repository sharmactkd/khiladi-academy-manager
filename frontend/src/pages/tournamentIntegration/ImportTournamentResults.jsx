import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { studentApi } from "../../api/studentApi.js";
import { tournamentSyncApi } from "../../api/tournamentSyncApi.js";

const initialForm = {
  studentId: "",
  externalTournamentId: "",
  externalPlayerId: "",
  tournamentName: "",
  eventType: "kyorugi",
  ageCategory: "",
  weightCategory: "",
  level: "open",
  result: "participated",
  date: "",
  venue: "",
  organizer: "",
  remarks: "",
};

const ImportTournamentResults = () => {
  const [students, setStudents] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadStudents = async () => {
      try {
        const response = await studentApi.getAll({ limit: 500 });
        setStudents(response.data?.data?.students || []);
      } catch (error) {
        toast.error(error.response?.data?.message || "Students load nahi hue");
      }
    };

    loadStudents();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setLoading(true);
      await tournamentSyncApi.importResult(form);
      toast.success("Tournament result imported");
      setForm(initialForm);
    } catch (error) {
      toast.error(error.response?.data?.message || "Result import failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Import Tournament Result</h1>
          <p>Manual result import se ChampionshipRecord auto update hoga.</p>
        </div>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit} className="form">
          <label>
            Student
            <select
              name="studentId"
              value={form.studentId}
              onChange={handleChange}
            >
              <option value="">Select Student</option>
              {students.map((student) => (
                <option key={student._id} value={student._id}>
                  {`${student.firstName || ""} ${student.lastName || ""}`.trim()}{" "}
                  - {student.admissionNumber}
                </option>
              ))}
            </select>
          </label>

          <label>
            External Tournament ID
            <input
              name="externalTournamentId"
              value={form.externalTournamentId}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            External Player ID
            <input
              name="externalPlayerId"
              value={form.externalPlayerId}
              onChange={handleChange}
            />
          </label>

          <label>
            Tournament Name
            <input
              name="tournamentName"
              value={form.tournamentName}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            Event Type
            <select
              name="eventType"
              value={form.eventType}
              onChange={handleChange}
            >
              <option value="kyorugi">Kyorugi</option>
              <option value="poomsae">Poomsae</option>
              <option value="demo">Demo</option>
              <option value="other">Other</option>
            </select>
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

          <label>
            Remarks
            <textarea
              name="remarks"
              value={form.remarks}
              onChange={handleChange}
            />
          </label>

          <div className="actions">
            <button type="submit" className="btn btn-primary" disabled={loading}>
              Import Result
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ImportTournamentResults;