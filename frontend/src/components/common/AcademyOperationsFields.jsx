import { useState } from "react";
import {
  Check,
  Dumbbell,
  Languages,
  
  Trash2,
  UserRound,
  UsersRound,
} from "lucide-react";

import PhoneLocationFields from "./PhoneLocationFields.jsx";
import IconOptionGrid from "./iconOptions/IconOptionGrid.jsx";
import { TAEKWONDO_BELTS } from "../taekwondoBelts/taekwondoBelts.js";

export const MARTIAL_ART_OPTIONS = [
  "Taekwondo",
  "Karate",
  "Judo",
  "Boxing",
  "Kickboxing",
  "Wrestling",
  "MMA",
  "Kung Fu",
  "Wushu",
  "Muay Thai",
  "Brazilian Jiu-Jitsu",
  "Self Defence",
  "Fitness",
  "Yoga",
];

export const LANGUAGE_OPTIONS = [
  "Hindi",
  "English",
  "Urdu",
  "Punjabi",
  "Bengali",
  "Marathi",
  "Tamil",
  "Telugu",
  "Kannada",
  "Malayalam",
];

export const createEmptyCoach = () => ({
  name: "",
  countryCode: "+91",
  phone: "",
  achievements: "",
});

const uniqueValues = (items = []) => [
  ...new Set(items.map((item) => String(item || "").trim()).filter(Boolean)),
];

const SectionHeader = ({ icon: Icon, eyebrow, title, description }) => (
  <header className="operations-section-header">
    <span className="operations-section-header__icon">
      <Icon size={19} aria-hidden="true" />
    </span>
    <div>
      <small>{eyebrow}</small>
      <h2>{title}</h2>
      {description ? <p>{description}</p> : null}
    </div>
  </header>
);

const CustomTagInput = ({
  value,
  onChange,
  onAdd,
  placeholder,
  buttonLabel,
}) => {
  const submit = () => {
    const clean = String(value || "")
      .trim()
      .replace(/\s+/g, " ");
    if (clean) onAdd(clean);
  };

  return (
    <div className="operations-custom-tag">
    
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key !== "Enter") return;
          event.preventDefault();
          submit();
        }}
        placeholder={placeholder}
      />
      {String(value || "").trim() ? (
        <button type="button" onClick={submit}>
       {buttonLabel}
        </button>
      ) : null}
    </div>
  );
};

const TagSelector = ({
  customOptions = [],
  iconTiles = false,
  kind = "generic",
  onRemoveCustom,
  options,
  selected,
  onToggle,
  trailingContent = null,
}) => {
  const normalizedOptions = uniqueValues(options);

  if (iconTiles) {
    return (
      <div
        className={`operations-tag-grid operations-tag-grid--tiles${
          normalizedOptions.length === 1 && !trailingContent
            ? " operations-tag-grid--single"
            : ""
        }`}
      >
        <IconOptionGrid
          kind={kind}
          options={normalizedOptions}
          selected={selected}
          customOptions={customOptions}
          onToggle={onToggle}
          onRemoveCustom={onRemoveCustom}
          trailingContent={trailingContent}
        />
      </div>
    );
  }

  return (
    <div
      className={`operations-tag-grid${
        normalizedOptions.length === 1 && !trailingContent
          ? " operations-tag-grid--single"
          : ""
      }`}
    >
      {normalizedOptions.map((item) => {
        const active = selected.includes(item);
        return (
          <button
            type="button"
            key={item}
            className={active ? "is-selected" : ""}
            aria-pressed={active}
            onClick={() => onToggle(item)}
          >
            {active ? <Check size={13} aria-hidden="true" /> : null}
            {item}
          </button>
        );
      })}
      {trailingContent}
    </div>
  );
};

export const SportsMartialArtsField = ({
  selected = [],
  customOptions = [],
  options = MARTIAL_ART_OPTIONS,
  onChange,
  onCustomOptionsChange,
  required = false,
  showHeader = true,
  className = "",
  allowCustom = true,
}) => {
  const [customValue, setCustomValue] = useState("");
  const allOptions = uniqueValues([...options, ...customOptions, ...selected]);
  const toggle = (item) =>
    onChange?.(
      selected.includes(item)
        ? selected.filter((value) => value !== item)
        : [...selected, item],
    );
  const addCustom = (item) => {
    const existing =
      allOptions.find((value) => value.toLowerCase() === item.toLowerCase()) ||
      item;
    if (!allOptions.some((value) => value.toLowerCase() === item.toLowerCase()))
      onCustomOptionsChange?.([...customOptions, item]);
    if (!selected.includes(existing)) onChange?.([...selected, existing]);
    setCustomValue("");
  };
  const removeCustom = (item) => {
    onCustomOptionsChange?.(customOptions.filter((value) => value !== item));
    onChange?.(selected.filter((value) => value !== item));
  };

  return (
    <section className={`operations-selection-section ${className}`.trim()}>
      {showHeader ? (
        <SectionHeader
          icon={Dumbbell}
          eyebrow="Training"
          title={<>Sports / Martial Arts{required ? " *" : ""}</>}
        />
      ) : null}
      <div className="operations-selection-section__body">
        {!showHeader ? (
          <span className="operations-field-label">
            Martial Art / Sport{required ? " *" : ""}
          </span>
        ) : null}
        <TagSelector
          iconTiles
          kind="sport"
          options={allOptions}
          selected={selected}
          customOptions={customOptions}
          onRemoveCustom={onCustomOptionsChange ? removeCustom : undefined}
          onToggle={toggle}
          trailingContent={allowCustom ? (
            <CustomTagInput
              value={customValue}
              onChange={setCustomValue}
              onAdd={addCustom}
              placeholder="Add custom sport / martial art"
              buttonLabel="Add Sport"
            />
          ) : null}
        />
      </div>
    </section>
  );
};

export const LanguagesSpokenField = ({
  selected = [],
  customOptions = [],
  options = LANGUAGE_OPTIONS,
  onChange,
  onCustomOptionsChange,
  showHeader = true,
  className = "",
}) => {
  const [customValue, setCustomValue] = useState("");
  const allOptions = uniqueValues([...options, ...customOptions, ...selected]);
  const toggle = (item) =>
    onChange?.(
      selected.includes(item)
        ? selected.filter((value) => value !== item)
        : [...selected, item],
    );
  const addCustom = (item) => {
    const existing =
      allOptions.find((value) => value.toLowerCase() === item.toLowerCase()) ||
      item;
    if (!allOptions.some((value) => value.toLowerCase() === item.toLowerCase()))
      onCustomOptionsChange?.([...customOptions, item]);
    if (!selected.includes(existing)) onChange?.([...selected, existing]);
    setCustomValue("");
  };

  return (
    <section className={`operations-selection-section ${className}`.trim()}>
      {showHeader ? (
        <SectionHeader
          icon={Languages}
          eyebrow="Communication"
          title="Languages Spoken"
          description="Languages supported by the academy team."
        />
      ) : null}
      <div className="operations-selection-section__body">
        {!showHeader ? (
          <span className="operations-field-label">Languages Spoken</span>
        ) : null}
        <TagSelector
          options={allOptions}
          selected={selected}
          onToggle={toggle}
          trailingContent={
            <CustomTagInput
              value={customValue}
              onChange={setCustomValue}
              onAdd={addCustom}
              placeholder="Add custom language"
              buttonLabel="Add"
            />
          }
        />
      </div>
    </section>
  );
};

const CoachEditor = ({ title, value, onChange }) => (
  <article className="operations-coach-card">
    <h3>
      <UserRound size={16} aria-hidden="true" /> {title}
    </h3>
    <label>
      <span>Name</span>
      <input
        value={value.name || ""}
        onChange={(event) => onChange({ ...value, name: event.target.value })}
        placeholder={`Enter ${title.toLowerCase()} name`}
      />
    </label>
    <PhoneLocationFields
      countryCode={value.countryCode || "+91"}
      phone={value.phone || ""}
      maxPhones={1}
      phoneLabel="Mobile Number"
      showLocation={false}
      onChange={(field, fieldValue) => {
        if (field === "countryCode" || field === "phone")
          onChange({ ...value, [field]: fieldValue });
      }}
    />
    <label>
      <span>Achievements / Qualifications</span>
      <textarea
        value={value.achievements || ""}
        onChange={(event) =>
          onChange({ ...value, achievements: event.target.value })
        }
        placeholder="Dan rank, certifications, medals, coaching experience…"
        rows={3}
        maxLength={1000}
      />
    </label>
  </article>
);

export const CoachesInChargeSection = ({
  headCoach = createEmptyCoach(),
  assistantCoach = createEmptyCoach(),
  additionalCoaches = [],
  onHeadCoachChange,
  onAssistantCoachChange,
  onAdditionalCoachesChange,
  title = "Coaches & Branch In-charge",
  headCoachTitle = "Head Coach / Branch In-charge",
  showHeader = true,
  className = "",
}) => {
  const updateAdditional = (index, value) =>
    onAdditionalCoachesChange?.(
      additionalCoaches.map((coach, itemIndex) =>
        itemIndex === index ? value : coach,
      ),
    );
  return (
    <section className={`operations-coaches-section ${className}`.trim()}>
      {showHeader ? (
        <SectionHeader
          icon={UsersRound}
          eyebrow="Team"
          title={title}
          description="Assign the primary coaching team. Additional coaches are optional."
        />
      ) : null}
      <div className="operations-coaches-grid">
        <CoachEditor
          title={headCoachTitle}
          value={headCoach}
          onChange={onHeadCoachChange}
        />
        <CoachEditor
          title="Assistant Coach"
          value={assistantCoach}
          onChange={onAssistantCoachChange}
        />
      </div>
      <div className="operations-additional-head">
        <div>
          <strong>Additional Coaches</strong>
          <small>Add more coaching staff when required.</small>
        </div>
        <button
          type="button"
          onClick={() =>
            onAdditionalCoachesChange?.([
              ...additionalCoaches,
              createEmptyCoach(),
            ])
          }
        >
         Add Coach
        </button>
      </div>
      {additionalCoaches.length ? (
        <div className="operations-additional-list">
          {additionalCoaches.map((coach, index) => (
            <article key={index}>
              <span>{index + 1}</span>
              <label>
                Coach Name
                <input
                  value={coach.name || ""}
                  onChange={(event) =>
                    updateAdditional(index, {
                      ...coach,
                      name: event.target.value,
                    })
                  }
                />
              </label>
              <PhoneLocationFields
                countryCode={coach.countryCode || "+91"}
                phone={coach.phone || ""}
                maxPhones={1}
                phoneLabel="Coach Mobile"
                showLocation={false}
                onChange={(field, fieldValue) => {
                  if (field === "countryCode" || field === "phone")
                    updateAdditional(index, { ...coach, [field]: fieldValue });
                }}
              />
              <label>
                Achievements
                <input
                  value={coach.achievements || ""}
                  onChange={(event) =>
                    updateAdditional(index, {
                      ...coach,
                      achievements: event.target.value,
                    })
                  }
                />
              </label>
              <button
                type="button"
                aria-label={`Remove coach ${index + 1}`}
                onClick={() =>
                  onAdditionalCoachesChange?.(
                    additionalCoaches.filter(
                      (_, itemIndex) => itemIndex !== index,
                    ),
                  )
                }
              >
                <Trash2 size={16} />
              </button>
            </article>
          ))}
        </div>
      ) : (
        <div className="operations-empty">No additional coaches added.</div>
      )}
    </section>
  );
};

const beltTone = (belt) => {
  const value = String(belt || "").toLowerCase();
  return (
    ["white", "yellow", "green", "blue", "red", "black"].find((color) =>
      value.includes(color),
    ) || "mixed"
  );
};

export const BeltTagsField = ({
  label,
  description = "",
  value = "",
  noLimit = false,
  onChange,
  onNoLimitChange,
  includeNoLimit = true,
}) => (
  <div className="operations-belt-field">
    <span className="operations-field-label">{label}</span>
    {description ? (
      <small className="operations-belt-description">{description}</small>
    ) : null}
    <div className="operations-belt-tags">
      {TAEKWONDO_BELTS.map((belt) => (
        <button
          key={belt}
          type="button"
          data-belt-tone={beltTone(belt)}
          className={!noLimit && value === belt ? "is-selected" : ""}
          onClick={() => {
            onNoLimitChange?.(false);
            onChange?.(belt);
          }}
        >
          {belt}
        </button>
      ))}
      {includeNoLimit ? (
        <button
          type="button"
          className={`operations-belt-no-limit${noLimit ? " is-selected" : ""}`}
          onClick={() => onNoLimitChange?.(!noLimit)}
        >
          {noLimit ? <Check size={13} aria-hidden="true" /> : null}No Limit
        </button>
      ) : null}
    </div>
  </div>
);
