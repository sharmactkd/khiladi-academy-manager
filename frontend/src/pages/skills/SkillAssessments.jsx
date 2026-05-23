import React, { useEffect, useState } from "react";

import { getStudents } from "../../api/studentApi";
import {
  createSkillAssessment,
  getSkillAssessments,
  getSkills,
} from "../../api/skillApi";

const SkillAssessments = () => {
  const [students, setStudents] = useState([]);
  const [skills, setSkills] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [form, setForm] = useState({
    student: "",
    skill: "",
    score: "",
    maxScore: 10,
    assessmentDate: "",
    remarks: "",
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const [studentsRes, skillsRes, assessmentsRes] = await Promise.all([
        getStudents({ status: "active" }),
        getSkills({ status: "active" }),
        getSkillAssessments(),
      ]);

      setStudents(studentsRes.data || []);
      setSkills(skillsRes.data || []);
      setAssessments(assessmentsRes.data || []);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load assessments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const updateField = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);
      setError("");

      await createSkillAssessment({
        ...form,
        score: Number(form.score),
        maxScore: Number(form.maxScore || 10),
      });

      setForm({
        student: "",
        skill: "",
        score: "",
        maxScore: 10,
        assessmentDate: "",
        remarks: "",
      });

      loadData();
    } catch (err) {
      setError(
        err?.response?.data?.message || "Failed to create assessment"
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Skill Assessments</h1>
          <p>Assess student skills and track improvement over time.</p>
        </div>
      </div>

      {error ? <div className="alert alert-error">{error}</div> : null}

      <form className="form-card" onSubmit={handleSubmit}>
        <h3>New Assessment</h3>

        <div className="form-grid">
          <div className="form-group">
            <label>Student *</label>
            <select
              value={form.student}
              onChange={(e) => updateField("student", e.target.value)}
              required
            >
              <option value="">Select Student</option>
              {students.map((student) => (
                <option key={student._id} value={student._id}>
                  {student.firstName} {student.lastName} -{" "}
                  {student.admissionNumber}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Skill *</label>
            <select
              value={form.skill}
              onChange={(e) => updateField("skill", e.target.value)}
              required
            >
              <option value="">Select Skill</option>
              {skills.map((skill) => (
                <option key={skill._id} value={skill._id}>
                  {skill.skillName} ({skill.category})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Score *</label>
            <input
              type="number"
              min="0"
              value={form.score}
              onChange={(e) => updateField("score", e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Max Score *</label>
            <input
              type="number"
              min="1"
              value={form.maxScore}
              onChange={(e) => updateField("maxScore", e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Assessment Date</label>
            <input
              type="date"
              value={form.assessmentDate}
              onChange={(e) =>
                updateField("assessmentDate", e.target.value)
              }
            />
          </div>

          <div className="form-group form-group-full">
            <label>Remarks</label>
            <textarea
              value={form.remarks}
              onChange={(e) => updateField("remarks", e.target.value)}
            />
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? "Saving..." : "Save Assessment"}
          </button>
        </div>
      </form>

      <div className="table-card">
        <h3>Recent Assessments</h3>

        {loading ? (
          <p>Loading assessments...</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Student</th>
                <th>Skill</th>
                <th>Score</th>
                <th>Assessed By</th>
              </tr>
            </thead>

            <tbody>
              {assessments.length ? (
                assessments.map((item) => (
                  <tr key={item._id}>
                    <td>
                      {item.assessmentDate
                        ? new Date(item.assessmentDate).toLocaleDateString()
                        : "-"}
                    </td>
                    <td>
                      {item.student?.firstName} {item.student?.lastName}
                    </td>
                    <td>{item.skill?.skillName}</td>
                    <td>
                      {item.score}/{item.maxScore}
                    </td>
                    <td>{item.assessedBy?.name || "-"}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5">No assessments found.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default SkillAssessments;