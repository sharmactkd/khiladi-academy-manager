import { Dumbbell, Plus, X } from "lucide-react";
import AcademyProfileCardHeader from "./AcademyProfileCardHeader.jsx";

const AcademyMartialArtsField = ({ customSport, customSports, options, selectedSports, onAdd, onCustomSportChange, onCustomSportKeyDown, onRemoveCustom, onToggle }) => (
  <section className="academy-profile-card academy-profile-martial" id="martial-arts">
    <AcademyProfileCardHeader eyebrow="Training" icon={Dumbbell} title="Sports / Martial Arts" />
    <div className="academy-profile-martial__chips">
      {options.map((item) => { const active = selectedSports.includes(item); return <button type="button" key={item} className={active ? "is-selected" : ""} aria-pressed={active} onClick={() => onToggle(item)}>{item}</button>; })}
      {customSports.map((item) => { const active = selectedSports.some((selected) => selected.toLowerCase() === item.toLowerCase()); return (
        <span className={`academy-profile-custom-chip${active ? " is-selected" : ""}`} key={`custom-${item}`}>
          <button type="button" className="academy-profile-custom-chip__select" aria-pressed={active} onClick={() => onToggle(item)}>{item}</button>
          <button type="button" className="academy-profile-custom-chip__remove" aria-label={`Delete custom sport ${item}`} title={`Delete ${item}`} onClick={() => onRemoveCustom(item)}><X size={11} aria-hidden="true" /></button>
        </span>
      ); })}
      <div className="academy-profile-custom-art"><Plus size={15} aria-hidden="true" /><input aria-label="Add custom sport or martial art" placeholder="Add custom sport / martial art" value={customSport} onChange={(event) => onCustomSportChange(event.target.value)} onKeyDown={onCustomSportKeyDown} />{customSport.trim() ? <button type="button" className="academy-profile-custom-art__add" onClick={onAdd}><Plus size={13} aria-hidden="true" />Add Sport</button> : null}</div>
    </div>
  </section>
);

export default AcademyMartialArtsField;
