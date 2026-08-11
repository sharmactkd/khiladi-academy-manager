import {
  BadgeCheck,
  Building2,
  CalendarDays,
  GraduationCap,
  Layers3,
  MapPin,
  UserRound,
} from "lucide-react";

const SUMMARY_ICONS = {
  branches: Building2,
  batches: Layers3,
  profile: BadgeCheck,
  since: CalendarDays,
};

const AcademyHeroHeader = ({
  academyName = "KHILADI Academy",
  ownerName = "Academy Owner",
  logoUrl = "",
  eyebrow = "Academy command center",
  addressLabel = "Main Branch",
  address = "",
  summaryItems = [],
  onLogoClick,
  action = null,
  headingId = "academy-hero-title",
  className = "",
}) => {
  const rootClassName = ["owner-hero", "academy-hero-header", className]
    .filter(Boolean)
    .join(" ");

  return (
    <section className={rootClassName} aria-labelledby={headingId}>
      <div className="owner-hero__brand">
        {logoUrl ? (
          onLogoClick ? (
            <button
              type="button"
              onClick={onLogoClick}
              aria-label={`View ${academyName} logo`}
            >
              <img src={logoUrl} alt={`${academyName} logo`} />
            </button>
          ) : (
            <span className="owner-hero__logo-static">
              <img src={logoUrl} alt={`${academyName} logo`} />
            </span>
          )
        ) : (
          <GraduationCap size={58} strokeWidth={1.7} aria-hidden="true" />
        )}
      </div>

      <div className="owner-hero__content">
        {eyebrow ? <span className="owner-hero__eyebrow">{eyebrow}</span> : null}
        <h1 id={headingId}>{academyName}</h1>

        <div className="owner-hero__details">
          <div className="owner-hero__owner">
            <UserRound size={14} aria-hidden="true" />
            <span>Owner</span>
            <strong>{ownerName}</strong>
          </div>

          <address className="owner-hero__address">
            <MapPin size={14} aria-hidden="true" />
            <span>
              <b>{addressLabel}</b>
              <strong>{address || "Complete address not available"}</strong>
            </span>
          </address>

          {summaryItems.length ? (
            <div
              className="owner-hero__summary"
              aria-label="Academy summary"
            >
              {summaryItems.map((item, index) => {
                const Icon = item.icon || SUMMARY_ICONS[item.type] || Building2;
                return (
                  <span key={item.key || `${item.type || "summary"}-${index}`}>
                    <Icon size={14} aria-hidden="true" />
                    <strong>{item.value}</strong>
                    {item.label}
                  </span>
                );
              })}
            </div>
          ) : null}
        </div>
      </div>

      <div className="owner-hero__decoration" aria-hidden="true">
        <div className="owner-hero__dots">
          <span className="owner-hero__dot-layer owner-hero__dot-layer--small" />
          <span className="owner-hero__dot-layer owner-hero__dot-layer--medium" />
          <span className="owner-hero__dot-layer owner-hero__dot-layer--large" />
        </div>

        <span className="owner-hero__stripe owner-hero__stripe--thin" />
        <span className="owner-hero__stripe owner-hero__stripe--soft" />
        <span className="owner-hero__stripe owner-hero__stripe--bold" />
      </div>

      {action ? <div className="academy-hero-header__action">{action}</div> : null}
    </section>
  );
};

export default AcademyHeroHeader;