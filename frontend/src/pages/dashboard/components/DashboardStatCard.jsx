const DashboardStatCard = ({ icon: Icon, title, value, tone = "red", subtitle }) => (
  <article className={`owner-stat owner-stat--${tone}`}>
    <span className="owner-stat__icon" aria-hidden="true">
      <Icon size={23} strokeWidth={2.2} />
    </span>
    <span className="owner-stat__copy">
      <small>{title}</small>
      <strong>{value}</strong>
      {subtitle ? <span>{subtitle}</span> : null}
    </span>
  </article>
);

export default DashboardStatCard;
