import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import { getStudentPerformance } from "../../api/performanceApi";
import AnalyticsCard from "../../components/analytics/AnalyticsCard";
import PerformanceScore from "../../components/performance/PerformanceScore";

const StudentPerformance = () => {
  const { studentId } = useParams();

  const [performance, setPerformance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadPerformance = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await getStudentPerformance(studentId);
      setPerformance(res.data || null);
    } catch (err) {
      setError(
        err?.response?.data?.message || "Failed to load student performance"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPerformance();
  }, [studentId]);

  if (loading) {
    return <div className="page">Loading performance...</div>;
  }

  if (error) {
    return <div className="page alert alert-error">{error}</div>;
  }

  if (!performance) {
    return <div className="page">Performance data not found.</div>;
  }

  const student = performance.student;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>
            {student?.firstName} {student?.lastName} — Performance
          </h1>
          <p>{student?.admissionNumber || ""}</p>
        </div>
      </div>

      <PerformanceScore score={performance.overallPerformanceScore} />

      <div className="analytics-grid">
        <AnalyticsCard
          title="Attendance"
          value={`${performance.attendancePercentage || 0}%`}
        />

        <AnalyticsCard
          title="Fee Regularity"
          value={`${performance.feeRegularity || 0}%`}
        />

        <AnalyticsCard
          title="Belt Promotions"
          value={performance.beltProgress?.promotions || 0}
        />

        <AnalyticsCard
          title="Tournament Medals"
          value={performance.tournamentMedals || 0}
        />

        <AnalyticsCard
          title="Certificates"
          value={performance.certificatesCount || 0}
        />

        <AnalyticsCard
          title="Skill Average"
          value={`${performance.skillAverage || 0}%`}
        />
      </div>

      <div className="detail-card">
        <h3>Score Breakdown</h3>

        <div className="detail-grid">
          {Object.entries(performance.breakdown || {}).map(([key, value]) => (
            <div key={key}>
              <strong>{key}</strong>
              <p>{value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StudentPerformance;