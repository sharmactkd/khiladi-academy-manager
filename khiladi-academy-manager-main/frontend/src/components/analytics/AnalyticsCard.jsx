const AnalyticsCard = ({
  title,
  value,
  subtitle,
  icon,
  loading = false,
  tone = "primary",
}) => {
  return (
    <article
      className={[
        "analytics-card",
        `analytics-card--${tone}`,
      ].join(" ")}
    >
      <div className="analytics-card__content">
        <p className="analytics-card__title">
          {title}
        </p>

        {loading ? (
          <div
            className="analytics-card__skeleton"
            aria-label="Loading analytics"
          />
        ) : (
          <h3 className="analytics-card__value">
            {value ?? 0}
          </h3>
        )}

        {subtitle ? (
          <p className="analytics-card__subtitle">
            {subtitle}
          </p>
        ) : null}
      </div>

      {icon ? (
        <div
          className="analytics-card__icon"
          aria-hidden="true"
        >
          {icon}
        </div>
      ) : null}
    </article>
  );
};

export default AnalyticsCard;