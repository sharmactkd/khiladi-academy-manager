import { ChevronDown, ChevronUp, Eye, EyeOff, GripVertical } from "lucide-react";
import styles from "./DocumentStudio.module.css";

const FieldPalette = ({ registry, selected, onChange }) => {
  const toggle = (key) => onChange(selected.includes(key) ? selected.filter((item) => item !== key) : [...selected, key]);
  const move = (key, direction) => {
    const next = [...selected];
    const from = next.indexOf(key);
    const to = from + direction;
    if (from < 0 || to < 0 || to >= next.length) return;
    [next[from], next[to]] = [next[to], next[from]];
    onChange(next);
  };

  return <div className={styles.fieldPalette}>
    {registry.map((field) => {
      const visible = selected.includes(field.key);
      return <div key={field.key} className={visible ? styles.fieldActive : ""}>
        <GripVertical size={15} aria-hidden="true"/>
        <button type="button" onClick={() => toggle(field.key)} aria-label={`${visible ? "Hide" : "Show"} ${field.label}`}>
          {visible ? <Eye size={15}/> : <EyeOff size={15}/>}<span>{field.label}</span>
        </button>
        {visible ? <span className={styles.reorder}>
          <button type="button" onClick={() => move(field.key, -1)} aria-label={`Move ${field.label} up`}><ChevronUp size={14}/></button>
          <button type="button" onClick={() => move(field.key, 1)} aria-label={`Move ${field.label} down`}><ChevronDown size={14}/></button>
        </span> : null}
      </div>;
    })}
  </div>;
};

export default FieldPalette;
