const BranchFormSectionHeader = ({ icon: Icon, eyebrow, title, description }) => (
  <header className="add-branch-card__header">
    <span className="add-branch-card__icon"><Icon size={19} aria-hidden="true" /></span>
    <div><small>{eyebrow}</small><h2>{title}</h2>{description ? <p>{description}</p> : null}</div>
  </header>
);

export default BranchFormSectionHeader;
