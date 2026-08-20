import { Check, Plus } from "lucide-react";
import clsx from "clsx";
import styles from "./OptionChipsField.module.css";

const OptionChipsField = ({ allowCustom = false, className = "", customInput = "", customPlaceholder = "Add custom option", customValues = [], label, multiple = true, onAddCustom, onCustomInputChange, onChange, options = [], showIcons = true, value = [] }) => {
  const selected = multiple ? (Array.isArray(value) ? value : []) : value;
  const allOptions = [...new Set([...options, ...customValues])];
  const toggle = (option) => {
    if (!multiple) return onChange?.(option);
    onChange?.(selected.includes(option) ? selected.filter((item) => item !== option) : [...selected, option]);
  };
  return <div className={clsx(styles.root, className)}>{label ? <span className={styles.label}>{label}</span> : null}<div className={styles.chips}>{allOptions.map((option) => { const active = multiple ? selected.includes(option) : selected === option; return <button type="button" key={option} className={clsx(styles.chip, active && styles.selected)} aria-pressed={active} onClick={() => toggle(option)}>{showIcons ? (active ? <Check size={13} /> : <Plus size={13} />) : null}{option}</button>; })}</div>{allowCustom ? <div className={styles.custom}><input value={customInput} placeholder={customPlaceholder} onChange={(event) => onCustomInputChange?.(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); onAddCustom?.(); } }} /><button type="button" disabled={!customInput.trim()} onClick={onAddCustom}><Plus size={14} /> Add</button></div> : null}</div>;
};

export default OptionChipsField;
