import { Award, Plus, Trash2 } from "lucide-react";
import AcademyProfileCardHeader from "./AcademyProfileCardHeader.jsx";

const TYPE_OPTIONS = [
  ["affiliation", "Affiliation"], ["recognition", "Recognition"],
  ["registration", "Registration"], ["other", "Other"],
];

const AcademyCredentialsField = ({ items, onAdd, onChange, onRemove }) => (
  <section className="academy-profile-card academy-profile-affiliations" id="affiliations">
    <AcademyProfileCardHeader eyebrow="Credentials" icon={Award} title="Affiliation / Recognition / Registration" />
    <div className="academy-profile-affiliations__head" aria-hidden="true"><span>Type</span><span>Organization Name</span><span>Number</span><span>Action</span></div>
    <div className="academy-profile-affiliations__rows">{items.map((item, index) => (
      <div className="academy-profile-affiliation-row" key={item._id || `${item.type}-${index}`}>
        <label><span>Type</span><select value={item.type || "affiliation"} onChange={(event) => onChange(index, "type", event.target.value)}>{TYPE_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        <label><span>Organization Name</span><input value={item.organizationName || ""} onChange={(event) => onChange(index, "organizationName", event.target.value)} placeholder="Association / Federation / Trust" /></label>
        <label><span>Number</span><input value={item.registrationNumber || ""} onChange={(event) => onChange(index, "registrationNumber", event.target.value)} placeholder="Certificate / Registration No." /></label>
        <button type="button" className="academy-profile-affiliation-row__remove" onClick={() => onRemove(index)} aria-label={`Remove credential ${index + 1}`} title="Remove"><Trash2 size={17} aria-hidden="true" /></button>
      </div>
    ))}</div>
    <button type="button" className="academy-profile-add-row" onClick={onAdd}><Plus size={16} aria-hidden="true" />Add More</button>
  </section>
);

export default AcademyCredentialsField;
