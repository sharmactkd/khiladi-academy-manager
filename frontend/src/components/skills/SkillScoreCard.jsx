import React from "react";

const SkillScoreCard = ({ title, score = 0, subtitle }) => {
  const safeScore = Math.max(0, Math.min(100, Math.round(Number(score || 0))));

  return (
    <div className="skill-score-card">
      <div className="skill-score-card__top">
        <h4>{title}</h4>
        <strong>{safeScore}%</strong>
      </div>

      <div className="skill-score-card__bar">
        <span style={{ width: `${safeScore}%` }} />
      </div>

      {subtitle ? <p>{subtitle}</p> : null}
    </div>
  );
};

export default SkillScoreCard;