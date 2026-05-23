import React from "react";

const PerformanceScore = ({ score = 0, label = "Performance Score" }) => {
  const safeScore = Math.max(0, Math.min(100, Math.round(Number(score || 0))));

  const status =
    safeScore >= 80
      ? "Excellent"
      : safeScore >= 60
      ? "Good"
      : safeScore >= 40
      ? "Needs Attention"
      : "At Risk";

  return (
    <div className="performance-score">
      <div className="performance-score__circle">
        <span>{safeScore}</span>
        <small>/100</small>
      </div>

      <div>
        <h3>{label}</h3>
        <p>{status}</p>
      </div>
    </div>
  );
};

export default PerformanceScore;