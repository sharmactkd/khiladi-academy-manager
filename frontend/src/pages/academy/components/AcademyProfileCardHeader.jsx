const AcademyProfileCardHeader = ({ eyebrow, icon: Icon, title }) => (
  <header className="academy-profile-card__header">
    <div>
      <Icon aria-hidden="true" />
      <span>{eyebrow}</span>
      <h2>{title}</h2>
    </div>
  </header>
);

export default AcademyProfileCardHeader;
