import clsx from "clsx";
import styles from "./SwitchField.module.css";

const SwitchField = ({ checked, className = "", description, disabled = false, label, onChange }) => (
  <label className={clsx(styles.root, className)}>
    <input type="checkbox" checked={checked} disabled={disabled} onChange={(event) => onChange?.(event.target.checked)} />
    <span className={styles.control} aria-hidden="true" />
    <div><strong>{label}</strong>{description ? <small>{description}</small> : null}</div>
  </label>
);

export default SwitchField;
