import { Check, Droplet, HeartPulse } from "lucide-react";
import {
  AllergiesIcon,
  AsthmaIcon,
  DiabetesIcon,
  EpilepsyIcon,
  HeartIssueIcon,
  HighBpIcon,
  JointPainIcon,
  LowBpIcon,
  OtherConditionIcon,
  PreviousInjuryIcon,
} from "./MedicalConditionIcons.jsx";

export const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
export const OTHER_CONDITION = "Other Condition";

export const MEDICAL_CONDITIONS = [
  { label: "Asthma", icon: AsthmaIcon },
  { label: "Diabetes", icon: DiabetesIcon },
  { label: "Heart Issue", icon: HeartIssueIcon },
  { label: "Allergies", icon: AllergiesIcon },
  { label: "Epilepsy", icon: EpilepsyIcon },
  { label: "High BP", icon: HighBpIcon },
  { label: "Low BP", icon: LowBpIcon },
  { label: "Joint Pain", icon: JointPainIcon },
  { label: "Previous Injury", icon: PreviousInjuryIcon },
  { label: OTHER_CONDITION, icon: OtherConditionIcon },
];

export const normalizeMedicalSelection = (values = []) => {
  const supported = new Set(MEDICAL_CONDITIONS.map(({ label }) => label));
  const normalized = Array.isArray(values)
    ? values.filter((value) => value && value !== "No Known Condition")
    : [];
  const known = normalized.filter((value) => supported.has(value));
  const custom = normalized.filter((value) => !supported.has(value));
  return {
    conditions: custom.length ? [...known, OTHER_CONDITION] : known,
    otherCondition: custom.join(", "),
  };
};

export const buildMedicalConditionsPayload = (conditions, otherCondition) =>
  conditions
    .flatMap((condition) => condition === OTHER_CONDITION ? String(otherCondition || "").trim() : condition)
    .filter(Boolean);

const MedicalSelectors = ({
  bloodGroup = "",
  onBloodGroupChange,
  conditions = [],
  onConditionsChange,
  otherCondition = "",
  onOtherConditionChange,
}) => {
  const toggleCondition = (condition) => {
    const next = conditions.includes(condition)
      ? conditions.filter((item) => item !== condition)
      : [...conditions, condition];
    onConditionsChange?.(next);
    if (condition === OTHER_CONDITION && conditions.includes(condition)) {
      onOtherConditionChange?.("");
    }
  };

  return <div className="student-medical-selectors">
    <section className="student-medical-panel" aria-labelledby="student-blood-group-label">
      <div className="student-medical-panel__title">
        <span className="student-medical-panel__icon"><Droplet size={20} /></span>
        <div>
          <small>Blood Profile</small>
          <div><strong id="student-blood-group-label">Blood Group</strong><em>Optional</em></div>
          <p>Select a blood group. Select it again to clear.</p>
        </div>
      </div>
      <div className="student-blood-group-grid" role="radiogroup" aria-labelledby="student-blood-group-label">
        {BLOOD_GROUPS.map((group) => {
          const selected = bloodGroup === group;
          return <button
            key={group}
            type="button"
            role="radio"
            aria-checked={selected}
            className={selected ? "is-selected" : ""}
            onClick={() => onBloodGroupChange?.(selected ? "" : group)}
          >
            <Droplet size={21} aria-hidden="true" />
            <strong>{group}</strong>
          </button>;
        })}
      </div>
    </section>

    <section className="student-medical-panel student-medical-panel--conditions" aria-labelledby="student-medical-conditions-label">
      <div className="student-medical-panel__title">
        <span className="student-medical-panel__icon"><HeartPulse size={20} /></span>
        <div>
          <small>Health Screening</small>
          <div><strong id="student-medical-conditions-label">Medical Conditions</strong><em>Optional</em></div>
          <p>Select every condition that applies.</p>
        </div>
      </div>
      <div className="student-medical-conditions-grid">
        {MEDICAL_CONDITIONS.map(({ label, icon: Icon }) => {
          const selected = conditions.includes(label);
          return <button
            key={label}
            type="button"
            aria-pressed={selected}
            className={selected ? "is-selected" : ""}
            onClick={() => toggleCondition(label)}
          >
            <span className="student-condition-icon"><Icon size={21} aria-hidden="true" /></span>
            <strong>{label}</strong>
            {selected ? <span className="student-condition-check"><Check size={12} strokeWidth={3} /></span> : null}
          </button>;
        })}
      </div>
      {conditions.includes(OTHER_CONDITION) ? <label className="student-other-condition">
        <span>Specify Other Condition</span>
        <input
          value={otherCondition}
          maxLength={150}
          placeholder="Enter medical condition"
          onChange={(event) => onOtherConditionChange?.(event.target.value)}
        />
      </label> : null}
    </section>
  </div>;
};

export default MedicalSelectors;
