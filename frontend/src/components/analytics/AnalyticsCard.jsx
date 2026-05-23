import React from "react";

const AnalyticsCard = ({ title, value, subtitle, icon, loading = false }) => {
  return (
    <div className="analytics-card">
      <div className="analytics-card__content">
        <p className="analytics-card__title">{title}</p>

        {loading ? (
          <div className="analytics-card__skeleton" />
        ) : (
          <h3 className="analytics-card__value">{value ?? 0}</h3>
        )}

        {subtitle ? <p className="analytics-card__subtitle">{subtitle}</p> : null}
      </div>

      {icon ? <div className="analytics-card__icon">{icon}</div> : null}
    </div>
  );
};

export default AnalyticsCard;