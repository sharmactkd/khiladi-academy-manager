import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { studentApi } from "../../api/studentApi.js";
import { tournamentSyncApi } from "../../api/tournamentSyncApi.js";

const initialForm = {
  student: "",
  externalTournamentId: "",
  tournamentName: "",
  eventType: "kyorugi",
  ageCategory: "",
  weightCategory: "",
  gender: "male",
};

const SubmitTournamentEntry = () => {
  const navigate = useNavigate();

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

    setForm((prev) => {
      const next = { ...prev, [name]: value };

      if (name === "student") {
        const selectedStudent = students.find((item) => item._id === value);
        if (selectedStudent?.gender) {
          next.gender = selectedStudent.gender;
        }
      }

      return next;
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setLoading(true);
      await tournamentSyncApi.submitEntry(form);
      toast.success("Tournament entry submitted");
      navigate("/tournament-sync/entries");
    } catch (error) {
      toast.error(error.response?.data?.message || "Entry submit failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Submit Tournament Entry</h1>
          <p>Academy student ko Tournament Manager me submit karein.</p>
        </div>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit} className="form">
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
            Gender
            <select name="gender" value={form.gender} onChange={handleChange}>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </label>

          <div className="actions">
            <button type="submit" className="btn btn-primary" disabled={loading}>
              Submit Entry
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SubmitTournamentEntry;