import {
  ArrowRight, Building2, CalendarDays, CheckCircle2, Clock3, Dumbbell,
  Globe2, GraduationCap, Hash, Languages, Layers3, Mail, MapPin, Phone, ShieldCheck,
  UserRound, UsersRound, Warehouse,
} from "lucide-react";
import AcademyHeroHeader from "../../components/academy/AcademyHeroHeader.jsx";
import IconOptionGrid from "../../components/common/iconOptions/IconOptionGrid.jsx";
import BranchDetailSectionHeader from "../branches/components/BranchDetailSectionHeader.jsx";
import BatchDetailSectionHeader from "../batches/components/BatchDetailSectionHeader.jsx";
import "../../components/academy/AcademyHeroHeader.css";
import "../branches/BranchDetail.css";
import "../batches/BatchDetail.css";

const shown = (value, fallback = "Not added") => String(value ?? "").trim() || fallback;
const label = (value) => String(value || "").replaceAll("-", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
const address = (location) => [location?.address, location?.city, location?.state, location?.country].filter(Boolean).join(", ");
const time = (value) => { if (!value) return "—"; const [hours, minutes] = value.split(":").map(Number); if (!Number.isFinite(hours)) return value; return new Date(2000, 0, 1, hours, minutes || 0).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" }); };

const DetailItem = ({ prefix, icon: Icon, title, children, wide = false }) => <div className={`${prefix}-detail-item${wide ? ` ${prefix}-detail-item--wide` : ""}`}><span className={`${prefix}-detail-item__icon`}><Icon size={17} aria-hidden="true" /></span><div><small>{title}</small><strong>{children}</strong></div></div>;
const CoachCard = ({ prefix, coach }) => <article className={`${prefix}-detail-coach`}><div className={`${prefix}-detail-coach__title`}><span><UserRound size={18} /></span><div><small>Coach</small><h3>{coach.role}</h3></div></div><dl><div><dt>Name</dt><dd>{shown(coach.name)}</dd></div><div className={`${prefix}-detail-coach__achievement`}><dt>Achievements / Qualifications</dt><dd>{shown(coach.achievements)}</dd></div></dl></article>;

export function PublicAcademyHero({ profile }) {
  const academyAddress = address(profile.location);
  const academyPhone = profile.contact?.phone ? `${profile.contact.countryCode || ""} ${profile.contact.phone}`.trim() : "";
  return <AcademyHeroHeader className="public-academy-hero" academyName={profile.academyName} ownerName={profile.ownerName || "Academy Owner"} logoUrl={profile.logo || ""} eyebrow="Academy profile" addressLabel="Academy Address" address={academyAddress} contactPhone={academyPhone} contactEmail={profile.contact?.email || ""} summaryItems={[profile.since && { key: "since", type: "since", value: profile.since, label: "Established" }, profile.branches?.length > 0 && { key: "branches", type: "branches", value: profile.branches.length, label: "Branches" }, profile.batches?.length > 0 && { key: "batches", type: "batches", value: profile.batches.length, label: "Batches" }].filter(Boolean)} />;
}

export function PublicAcademyOverview({ profile }) {
  return <>
    <PublicAcademyHero profile={profile} />
    <div className="public-profile-two-column">
      {!!profile.martialArts?.length && <section className="public-profile-card"><div className="public-profile-card__head"><span><Dumbbell size={18} /></span><div><small>Training</small><h2>Sports / Martial Arts</h2></div></div><div className="public-option-grid"><IconOptionGrid kind="sport" options={profile.martialArts} interactive={false} /></div></section>}
      {profile.about && <section className="public-profile-card"><div className="public-profile-card__head"><span><Globe2 size={18} /></span><div><small>Academy</small><h2>About the Academy</h2></div></div><p className="public-profile-copy">{profile.about}</p></section>}
    </div>
    {!!profile.affiliations?.length && <section className="public-profile-card"><div className="public-profile-card__head"><span><ShieldCheck size={18} /></span><div><small>Credentials</small><h2>Affiliations & Recognition</h2></div></div><div className="public-credential-list">{profile.affiliations.map((item, index) => <article key={`${item.organizationName}-${index}`}><small>{label(item.type)}</small><strong>{item.organizationName}</strong>{item.registrationNumber && <span>Registration No. {item.registrationNumber}</span>}</article>)}</div></section>}
  </>;
}

export function PublicBranchCard({ branch, batchCount = 0, selected = false, onClick }) {
  const branchAddress = address(branch.location);
  const publicContact = branch.contact?.phone
    ? `${branch.contact.countryCode || ""} ${branch.contact.phone}`.trim()
    : branch.contact?.email || "Contact not published";
  return <button type="button" className={`public-branch-card${selected ? " is-selected" : ""}`} onClick={onClick} aria-pressed={selected}>
    <span className="public-branch-card__top">
      <span className="public-selector-icon"><Building2 size={22} /></span>
      <span className="public-selector-copy"><span>{branch.isMainBranch ? "Main Branch" : "Academy Branch"}</span><strong>{branch.name}</strong><small><MapPin size={14} />{branchAddress || "Location not added"}</small></span>
      <ArrowRight className="public-selector-arrow" size={20} />
    </span>
    <span className="public-branch-card__facts">
      <span><UserRound size={16} /><small>Director / In-charge</small><strong>{shown(branch.directorName)}</strong></span>
      <span><CalendarDays size={16} /><small>Established</small><strong>{shown(branch.since)}</strong></span>
      <span>{branch.contact?.phone ? <Phone size={16} /> : <Mail size={16} />}<small>Public Contact</small><strong>{publicContact}</strong></span>
      <span><UsersRound size={16} /><small>Available Batches</small><strong>{batchCount} batch{batchCount === 1 ? "" : "es"}</strong></span>
    </span>
    {(branch.martialArts?.length > 0 || branch.facilities?.length > 0) && <span className="public-branch-card__tags">
      {branch.martialArts?.slice(0, 4).map((item) => <span className="is-sport" key={`sport-${item}`}><Dumbbell size={13} />{item}</span>)}
      {branch.facilities?.slice(0, 3).map((item) => <span key={`facility-${item}`}><Warehouse size={13} />{item}</span>)}
    </span>}
    <span className="public-branch-card__footer">View complete branch profile <ArrowRight size={15} /></span>
  </button>;
}

export function PublicBatchCard({ batch, selected = false, onClick }) {
  const firstSchedule = batch.schedule?.[0];
  const ageRange = batch.ageRange?.min != null || batch.ageRange?.max != null ? `${batch.ageRange?.min ?? "Any"}–${batch.ageRange?.max ?? "Any"} years` : "All ages";
  const coachName = batch.coaches?.[0]?.name || "Coach not published";
  return <button type="button" className={`public-batch-selector${selected ? " is-selected" : ""}`} onClick={onClick} aria-pressed={selected}>
    <span className="public-branch-card__top">
      <span className="public-selector-icon"><Dumbbell size={22} /></span>
      <span className="public-selector-copy"><span>Training Batch</span><strong>{batch.name}</strong><small><MapPin size={14} />{batch.branchName || "Academy level"}{batch.venue ? ` · ${batch.venue}` : ""}</small></span>
      <ArrowRight className="public-selector-arrow" size={20} />
    </span>
    <span className="public-branch-card__facts">
      <span><GraduationCap size={16} /><small>Skill Level</small><strong>{batch.skillLevels?.map(label).join(", ") || "Mixed levels"}</strong></span>
      <span><UsersRound size={16} /><small>Age Eligibility</small><strong>{ageRange}</strong></span>
      <span><Clock3 size={16} /><small>First Schedule</small><strong>{firstSchedule ? `${label(firstSchedule.day)} · ${time(firstSchedule.startTime || firstSchedule.summerStartTime)}` : "Flexible timing"}</strong></span>
      <span><UserRound size={16} /><small>Coach</small><strong>{coachName}</strong></span>
    </span>
    <span className="public-branch-card__tags">
      {batch.martialArts?.slice(0, 4).map((item) => <span className="is-sport" key={`sport-${item}`}><Dumbbell size={13} />{item}</span>)}
      {batch.modes?.slice(0, 3).map((item) => <span key={`mode-${item}`}><Globe2 size={13} />{label(item)}</span>)}
      {batch.genderGroup && <span><UsersRound size={13} />{label(batch.genderGroup)}</span>}
    </span>
    <span className="public-branch-card__footer">View complete batch profile <ArrowRight size={15} /></span>
  </button>;
}

export function PublicBranchProfile({ branch, batchCount = 0, onShowBatches }) {
  const branchAddress = address(branch.location);
  return <section className="branch-detail-page public-record-profile">
    <header className="public-record-heading"><div><span className="public-record-kicker">Branch profile</span><h2>{branch.name}</h2><p className="public-record-address"><MapPin size={16} aria-hidden="true" /><span>{branchAddress || "Location not added"}</span></p></div><div className="public-record-heading__actions">{branch.isMainBranch && <b>Main Branch</b>}<button type="button" className="public-batches-toggle" onClick={onShowBatches} aria-label={`View ${batchCount} active batches at ${branch.name}`}><Layers3 size={17} /><span>Active Batches</span><strong>{batchCount}</strong><ArrowRight size={15} /></button></div></header>
    <section className="branch-detail-card"><BranchDetailSectionHeader icon={Hash} eyebrow="01 · Identity" title="Branch Identity" description="Official public branch information." /><div className="branch-detail-items branch-detail-items--three"><DetailItem prefix="branch" icon={Warehouse} title="Branch Name">{branch.name}</DetailItem><DetailItem prefix="branch" icon={CheckCircle2} title="Status">Active Branch</DetailItem><DetailItem prefix="branch" icon={CalendarDays} title="Established">{shown(branch.since)}</DetailItem>{branch.directorName && <DetailItem prefix="branch" icon={UserRound} title="Director / In-charge">{branch.directorName}</DetailItem>}<DetailItem prefix="branch" icon={MapPin} title="District / City">{shown(branch.location?.city)}</DetailItem><DetailItem prefix="branch" icon={MapPin} title="State & Country">{[branch.location?.state, branch.location?.country].filter(Boolean).join(", ") || "Not added"}</DetailItem><DetailItem prefix="branch" icon={MapPin} title="Complete Address" wide>{branchAddress || "Not added"}</DetailItem>{branch.contact?.phone && <DetailItem prefix="branch" icon={Phone} title="Public Phone">{`${branch.contact.countryCode || ""} ${branch.contact.phone}`}</DetailItem>}{branch.contact?.email && <DetailItem prefix="branch" icon={Mail} title="Public Email">{branch.contact.email}</DetailItem>}</div></section>
    {!!branch.coaches?.length && <section className="branch-detail-card"><BranchDetailSectionHeader icon={UsersRound} eyebrow="02 · Team" title="Coaches & Branch In-charge" description="Public coaching team and qualifications." /><div className="branch-detail-coach-grid">{branch.coaches.map((coach, index) => <CoachCard prefix="branch" coach={coach} key={`${coach.name}-${index}`} />)}</div></section>}
    <div className="branch-detail-secondary-grid">{!!branch.martialArts?.length && <section className="branch-detail-card branch-detail-tags-card"><BranchDetailSectionHeader icon={Dumbbell} eyebrow="03 · Training" title="Sports / Martial Arts" description="Training disciplines at this branch." /><div className="public-detail-option-grid"><IconOptionGrid kind="sport" options={branch.martialArts} interactive={false} /></div></section>}{!!branch.facilities?.length && <section className="branch-detail-card branch-detail-tags-card"><BranchDetailSectionHeader icon={Warehouse} eyebrow="04 · Infrastructure" title="Facilities" description="Infrastructure available at this branch." /><div className="public-detail-option-grid"><IconOptionGrid kind="facility" options={branch.facilities} interactive={false} /></div></section>}{!!branch.languages?.length && <section className="branch-detail-card branch-detail-tags-card"><BranchDetailSectionHeader icon={Languages} eyebrow="05 · Communication" title="Languages Spoken" description="Languages supported by the branch team." /><div className="public-detail-option-grid"><IconOptionGrid kind="language" options={branch.languages} interactive={false} /></div></section>}</div>
  </section>;
}

export function PublicBatchProfile({ batch }) {
  const ages = batch.ageRange?.min != null || batch.ageRange?.max != null ? `${batch.ageRange?.min ?? "No minimum"} – ${batch.ageRange?.max ?? "No maximum"}` : "No limit";
  const belts = batch.beltRange?.min || batch.beltRange?.max ? `${batch.beltRange?.min || "No minimum"} – ${batch.beltRange?.max || "No maximum"}` : "No limit";
  return <section className="batch-detail-page public-record-profile">
    <header className="batch-detail-heading public-batch-heading"><div className="batch-detail-heading__title"><span><Dumbbell size={25} /></span><div><div className="batch-detail-heading__name-row"><h2>{batch.name}</h2><div className="batch-detail-heading__badges"><i className="is-active">Active</i></div></div><p>{batch.martialArts?.join(", ") || "Martial arts"} training batch at {batch.branchName || "the academy"}.</p></div></div></header>
    <section className="batch-detail-card"><BatchDetailSectionHeader icon={Hash} eyebrow="01 · Identity" title="Batch Identity" description="Public batch information." /><div className="batch-detail-items batch-detail-items--three"><DetailItem prefix="batch" icon={Dumbbell} title="Batch Name">{batch.name}</DetailItem><DetailItem prefix="batch" icon={MapPin} title="Branch">{shown(batch.branchName, "Academy level")}</DetailItem><DetailItem prefix="batch" icon={MapPin} title="Venue / Hall">{shown(batch.venue)}</DetailItem><DetailItem prefix="batch" icon={UsersRound} title="Gender Group">{label(batch.genderGroup || "both")}</DetailItem><DetailItem prefix="batch" icon={GraduationCap} title="Skill Levels">{batch.skillLevels?.map(label).join(", ") || "Mixed"}</DetailItem><DetailItem prefix="batch" icon={Dumbbell} title="Batch Types">{batch.types?.map(label).join(", ") || "Regular"}</DetailItem></div></section>
    <section className="batch-detail-card"><BatchDetailSectionHeader icon={CalendarDays} eyebrow="02 · Timing" title="Training Schedule" description="Weekly training days with Summer and Winter timings." /><div className="batch-detail-schedule-summary"><DetailItem prefix="batch" icon={Clock3} title="Session Slot">{batch.sessionSlots?.map(label).join(", ") || "Flexible"}</DetailItem><DetailItem prefix="batch" icon={ShieldCheck} title="Mode">{batch.modes?.map(label).join(", ") || "Offline"}</DetailItem></div>{batch.schedule?.length ? <div className="batch-detail-schedule">{batch.schedule.map((item, index) => <div key={`${item.day}-${index}`}><span><CalendarDays size={16} /></span><strong>{label(item.day)}</strong><div className="batch-detail-season-times"><time><b>Summer</b><Clock3 size={14} />{time(item.summerStartTime || item.startTime)} – {time(item.summerEndTime || item.endTime)}</time><time><b>Winter</b><Clock3 size={14} />{time(item.winterStartTime || item.startTime)} – {time(item.winterEndTime || item.endTime)}</time></div></div>)}</div> : <p>No training schedule added.</p>}</section>
    <div className="batch-detail-secondary-grid"><section className="batch-detail-card"><BatchDetailSectionHeader icon={UsersRound} eyebrow="03 · Eligibility" title="Capacity & Eligibility" description="Public age and belt eligibility." /><div className="batch-detail-items"><DetailItem prefix="batch" icon={UsersRound} title="Age Range">{ages}</DetailItem><DetailItem prefix="batch" icon={ShieldCheck} title="Belt Range">{belts}</DetailItem><DetailItem prefix="batch" icon={UsersRound} title="Maximum Trainees">{batch.capacity || "No limit"}</DetailItem></div></section>{!!batch.coaches?.length && <section className="batch-detail-card"><BatchDetailSectionHeader icon={UsersRound} eyebrow="04 · Team" title="Coaches & Batch In-charge" description="Public coaching team and qualifications." /><div className="batch-detail-coach-grid">{batch.coaches.map((coach, index) => <CoachCard prefix="batch" coach={coach} key={`${coach.name}-${index}`} />)}</div></section>}</div>
    <div className="batch-detail-secondary-grid">{!!batch.martialArts?.length && <section className="batch-detail-card"><BatchDetailSectionHeader icon={Dumbbell} eyebrow="05 · Training" title="Sports / Martial Arts" description="Training disciplines for this batch." /><div className="public-detail-option-grid"><IconOptionGrid kind="sport" options={batch.martialArts} interactive={false} /></div></section>}{!!batch.languages?.length && <section className="batch-detail-card"><BatchDetailSectionHeader icon={Languages} eyebrow="06 · Communication" title="Languages Spoken" description="Languages supported by the coaching team." /><div className="public-detail-option-grid"><IconOptionGrid kind="language" options={batch.languages} interactive={false} /></div></section>}</div>
  </section>;
}
