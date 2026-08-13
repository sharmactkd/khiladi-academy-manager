const BatchSummaryCard = ({ className = "", icon: Icon, label, value }) => (
  <article className={className}>
    <span><Icon size={21} aria-hidden="true" /></span>
    <div><small>{label}</small><strong>{value}</strong></div>
  </article>
);

export default BatchSummaryCard;
