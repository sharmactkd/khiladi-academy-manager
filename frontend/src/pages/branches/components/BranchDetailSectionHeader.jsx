const BranchDetailSectionHeader = ({ icon: Icon, eyebrow, title, description }) => (
  <header className="branch-detail-card__header">
    <span className="branch-detail-card__icon"><Icon size={19} aria-hidden="true" /></span>
    <div><small>{eyebrow}</small><h2>{title}</h2>{description ? <p>{description}</p> : null}</div>
  </header>
);

export default BranchDetailSectionHeader;
