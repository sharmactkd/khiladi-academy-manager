import { Plus, X } from "lucide-react";
import clsx from "clsx";
import styles from "./OptionChipsField.module.css";

const OptionChipsField = ({ allowCustom = false, className = "", customInput = "", customPlaceholder = "Add custom option", customValues = [], label, multiple = true, onAddCustom, onCustomInputChange, onChange, onRemoveCustom, options = [], showIcons = false, value = [] }) => {
  const selected = multiple ? (Array.isArray(value) ? value : []) : value;
  const allOptions = [...new Set([...options, ...customValues])];
  const toggle = (option) => {
    if (!multiple) return onChange?.(option);
    onChange?.(selected.includes(option) ? selected.filter((item) => item !== option) : [...selected, option]);
  };
  return <div className={clsx(styles.root, className)}>{label ? <span className={styles.label}>{label}</span> : null}<div className={styles.chips}>{allOptions.map((option) => { const active = multiple ? selected.includes(option) : selected === option; const custom = customValues.includes(option); return <span className={clsx(styles.chipWrap, custom && styles.customChip)} key={option}><button type="button" className={clsx(styles.chip, active && styles.selected)} aria-pressed={active} onClick={() => toggle(option)}>{showIcons && !active ? <Plus size={13} /> : null}{option}</button>{custom && onRemoveCustom ? <button type="button" className={styles.remove} aria-label={`Delete custom tag ${option}`} title={`Delete ${option}`} onClick={() => onRemoveCustom(option)}><X size={11}/></button> : null}</span>; })}{allowCustom ? <div className={styles.custom}><input value={customInput} placeholder={customPlaceholder} onChange={(event) => onCustomInputChange?.(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); onAddCustom?.(); } }} /><button type="button" disabled={!customInput.trim()} onClick={onAddCustom}><Plus size={14} /> Add</button></div> : null}</div></div>;
};

export default OptionChipsField;
