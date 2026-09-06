const AcademyProfileNav = ({ sections }) => (
  <nav className="academy-profile-nav" aria-label="Profile sections">
    {sections.map(({ id, label, icon: Icon }, index) => (
      <a key={id} href={`#${id}`} className={index === 0 ? "is-active" : ""}>
        <Icon size={17} aria-hidden="true" />
        <span>{label}</span>
      </a>
    ))}
  </nav>
);

export default AcademyProfileNav;
