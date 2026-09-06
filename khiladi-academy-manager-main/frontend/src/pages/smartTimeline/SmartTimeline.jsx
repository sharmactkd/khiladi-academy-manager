import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import {
  getSmartTimeline,
  generateSmartTimeline,
} from "../../api/smartTimelineApi";

const SmartTimeline = () => {
  const { studentId } = useParams();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

  const loadTimeline = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await getSmartTimeline(studentId);
      setData(res.data || null);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load smart timeline");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    try {
      setGenerating(true);
      setError("");

      const res = await generateSmartTimeline(studentId);
      setData(res.data || null);
    } catch (err) {
      setError(
        err?.response?.data?.message || "Failed to generate smart timeline"
      );
    } finally {
      setGenerating(false);
    }
  };

  useEffect(() => {
    loadTimeline();
  }, [studentId]);

  if (loading) {
    return <div className="page">Loading smart timeline...</div>;
  }

  const student = data?.student;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Smart Timeline</h1>
          <p>
            {student
              ? `${student.firstName || ""} ${student.lastName || ""}`.trim()
              : "Student insights and activity timeline"}
          </p>
        </div>

        <button
          type="button"
          className="btn btn-primary"
          onClick={handleGenerate}
          disabled={generating}
        >
          {generating ? "Generating..." : "Generate Insights"}
        </button>
      </div>

      {error ? <div className="alert alert-error">{error}</div> : null}

      <div className="card">
        <h3>Smart Insights</h3>

        {data?.insights?.length ? (
          <div className="insight-list">
            {data.insights.map((insight, index) => (
              <div
                key={`${insight.type}-${index}`}
                className={`insight-card insight-card--${
                  insight.severity || "info"
                }`}
              >
                <div>
                  <h4>{insight.title}</h4>
                  <p>{insight.message}</p>
                </div>

                <span>{insight.severity || "info"}</span>
              </div>
            ))}
          </div>
        ) : (
          <p>No insights found. Click Generate Insights.</p>
        )}
      </div>

      <div className="card">
        <h3>Timeline</h3>

        {data?.timeline?.length ? (
          <div className="timeline-list">
            {data.timeline.map((event) => (
              <div key={event._id} className="timeline-item">
                <div className="timeline-dot" />
                <div>
                  <h4>{event.title}</h4>
                  <p>{event.description}</p>
                  <small>
                    {event.eventDate
                      ? new Date(event.eventDate).toLocaleString()
                      : "-"}
                  </small>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p>No timeline events found.</p>
        )}
      </div>
    </div>
  );
};

export default SmartTimeline;