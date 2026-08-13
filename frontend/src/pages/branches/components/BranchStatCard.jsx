const BranchStatCard = ({ icon: Icon, label, value, tone = "red" }) => (
  <article className={`branches-stat branches-stat--${tone}`}>
    <span><Icon size={22} aria-hidden="true" /></span>
    <div><small>{label}</small><strong>{value}</strong></div>
  </article>
);

export default BranchStatCard;
