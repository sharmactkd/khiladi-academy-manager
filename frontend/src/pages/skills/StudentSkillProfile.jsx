import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getStudentSkillProfile } from "../../api/skillApi";
import SkillScoreCard from "../../components/skills/SkillScoreCard";
import LineChartCard from "../../components/analytics/LineChartCard";

const StudentSkillProfile = () => {
  const { studentId } = useParams();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await getStudentSkillProfile(studentId);
      setProfile(res.data || null);
    } catch (err) {
      setError(
        err?.response?.data?.message || "Failed to load skill profile"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, [studentId]);

  if (loading) {
    return <div className="page">Loading skill profile...</div>;
  }

  if (error) {
    return <div className="page alert alert-error">{error}</div>;
  }

  if (!profile) {
    return <div className="page">Skill profile not found.</div>;
  }

  const student = profile.student;

  const progressData = (profile.skillProgress || []).map((item) => ({
    label: item.skillName,
    value: item.percentage,
  }));

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>
            {student?.firstName} {student?.lastName} — Skill Profile
          </h1>
          <p>Overall skill score: {profile.overallAverage || 0}%</p>
        </div>
      </div>

      <div className="analytics-grid">
        <SkillScoreCard
          title="Overall Average"
          score={profile.overallAverage}
          subtitle="Combined score across all assessed skills"
        />

        {(profile.categoryAverage || []).map((item) => (
          <SkillScoreCard
            key={item.category}
            title={item.category}
            score={item.averageScore}
            subtitle={`${item.totalAssessments} assessment(s)`}
          />
        ))}
      </div>

      <div className="charts-grid">
        <LineChartCard
          title="Skill Progress"
          data={progressData}
          xKey="label"
          yKey="value"
        />
      </div>

      <div className="table-card">
        <h3>Assessment History</h3>

        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Skill</th>
              <th>Category</th>
              <th>Score</th>
              <th>Remarks</th>
            </tr>
          </thead>

          <tbody>
            {profile.assessments?.length ? (
              profile.assessments.map((item) => (
                <tr key={item._id}>
                  <td>
                    {item.assessmentDate
                      ? new Date(item.assessmentDate).toLocaleDateString()
                      : "-"}
                  </td>
                  <td>{item.skill?.skillName}</td>
                  <td>{item.skill?.category}</td>
                  <td>
                    {item.score}/{item.maxScore}
                  </td>
                  <td>{item.remarks || "-"}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5">No assessment history found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StudentSkillProfile;