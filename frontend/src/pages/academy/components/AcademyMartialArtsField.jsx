import { Dumbbell, Plus } from "lucide-react";
import IconOptionGrid from "../../../components/common/iconOptions/IconOptionGrid.jsx";
import AcademyProfileCardHeader from "./AcademyProfileCardHeader.jsx";

const AcademyMartialArtsField = ({ customSport, customSports, options, selectedSports, onAdd, onCustomSportChange, onCustomSportKeyDown, onRemoveCustom, onToggle }) => (
  <section className="academy-profile-card academy-profile-martial" id="martial-arts">
    <AcademyProfileCardHeader eyebrow="Training" icon={Dumbbell} title="Sports / Martial Arts" />
    <div className="academy-profile-martial__chips">
      <IconOptionGrid
        kind="sport"
        options={[...new Set([...options, ...customSports])]}
        selected={selectedSports}
        customOptions={customSports}
        onToggle={onToggle}
        onRemoveCustom={onRemoveCustom}
        trailingContent={<div className="academy-profile-custom-art"><Plus size={15} aria-hidden="true" /><input aria-label="Add custom sport or martial art" placeholder="Add custom sport / martial art" value={customSport} onChange={(event) => onCustomSportChange(event.target.value)} onKeyDown={onCustomSportKeyDown} />{customSport.trim() ? <button type="button" className="academy-profile-custom-art__add" onClick={onAdd}><Plus size={13} aria-hidden="true" />Add Sport</button> : null}</div>}
      />
    </div>
  </section>
);

export default AcademyMartialArtsField;
