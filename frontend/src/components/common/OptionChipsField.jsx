import { Plus, X } from "lucide-react";
import clsx from "clsx";
import styles from "./OptionChipsField.module.css";

const normalizeOption = (option) => typeof option === "string"
  ? { value: option, label: option, disabled: false }
  : { value: option?.value, label: option?.label || option?.value, disabled: Boolean(option?.disabled) };

const OptionChipsField = ({ allowCustom = false, className = "", customInput = "", customPlaceholder = "Add custom option", customValues = [], label, multiple = true, onAddCustom, onCustomInputChange, onChange, onRemoveCustom, options = [], showIcons = false, trailingContent = null, value = [] }) => {
  const selected = multiple ? (Array.isArray(value) ? value : []) : value;
  const customSet = new Set(customValues.map((item) => String(item).toLowerCase()));
  const allOptions = [...new Map([...options, ...customValues].map(normalizeOption).filter((option) => option.value).map((option) => [String(option.value).toLowerCase(), option])).values()];

  const toggle = (option) => {
    if (!multiple) return onChange?.(option);
    onChange?.(selected.includes(option) ? selected.filter((item) => item !== option) : [...selected, option]);
  };

  return <div className={clsx(styles.root, "ui-choice-field", className)}>
    {label ? <span className={clsx(styles.label, "ui-choice-label")}>{label}</span> : null}
    <div className={clsx(styles.chips, "ui-choice-group")}>
      {allOptions.map((option) => {
        const active = multiple ? selected.includes(option.value) : selected === option.value;
        const custom = customSet.has(String(option.value).toLowerCase());
        return <span className={clsx(styles.chipWrap, "ui-choice-wrap", custom && styles.customChip, custom && "is-custom")} key={option.value}>
          <button type="button" className={clsx(styles.chip, "ui-choice ui-choice--chip", active && styles.selected, active && "is-selected")} aria-pressed={active} disabled={option.disabled} onClick={() => toggle(option.value)}>
            {showIcons && !active ? <Plus size={13} aria-hidden="true" /> : null}{option.label}
          </button>
          {custom && onRemoveCustom ? <button type="button" className={clsx(styles.remove, "ui-choice-remove")} aria-label={`Delete custom tag ${option.label}`} title={`Delete ${option.label}`} onClick={() => onRemoveCustom(option.value)}><X size={11} aria-hidden="true" /></button> : null}
        </span>;
      })}
      {allowCustom ? <div className={clsx(styles.custom, "ui-choice-custom")}>
        <input value={customInput} placeholder={customPlaceholder} onChange={(event) => onCustomInputChange?.(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); onAddCustom?.(); } }} />
        <button type="button" disabled={!customInput.trim()} onClick={onAddCustom}><Plus size={14} aria-hidden="true" /> Add</button>
      </div> : null}
      {trailingContent ? <div className="ui-choice-trailing">{trailingContent}</div> : null}
    </div>
  </div>;
};

export default OptionChipsField;
