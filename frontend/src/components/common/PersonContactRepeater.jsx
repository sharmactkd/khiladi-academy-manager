import { Plus, Trash2 } from "lucide-react";
import clsx from "clsx";
import PhoneLocationFields from "./PhoneLocationFields.jsx";
import styles from "./PersonContactRepeater.module.css";

export const RELATION_OPTIONS = ["Mother", "Father", "Grand Mother", "Grand Father", "Brother", "Sister", "Friend", "Other"];
export const createPersonContact = () => ({ id: crypto.randomUUID(), name: "", relation: "", customRelation: "", countryCode: "+91", phone: "" });

const PersonContactRepeater = ({ addLabel = "Add More Contact", className, items, onChange }) => {
  const update = (index, field, value) => onChange(items.map((item, itemIndex) => itemIndex === index ? { ...item, [field]: value } : item));
  const remove = (index) => onChange(items.filter((_, itemIndex) => itemIndex !== index));
  return <div className={clsx(styles.root, className)}>
    <div className={styles.rows}>
      {items.map((item, index) => <div className={styles.row} key={item.id}>
        <div className={styles.number}>{String(index + 1).padStart(2, "0")}</div>
        <label><span>Name</span><input value={item.name} autoComplete="name" onChange={(event) => update(index, "name", event.target.value)} /></label>
        <label><span>Relation</span><select value={item.relation} onChange={(event) => update(index, "relation", event.target.value)}><option value="">Select Relation</option>{RELATION_OPTIONS.map((relation) => <option key={relation}>{relation}</option>)}</select></label>
        {item.relation === "Other" ? <label><span>Specify Relation</span><input value={item.customRelation} onChange={(event) => update(index, "customRelation", event.target.value)} /></label> : null}
        <div className={styles.phone}><PhoneLocationFields countryCode={item.countryCode} phone={item.phone} maxPhones={1} phoneLabel="Mobile Number" showLocation={false} onChange={(field, value) => { if (field === "countryCode" || field === "phone") update(index, field, value); }} /></div>
        <button type="button" className={styles.remove} disabled={items.length === 1} onClick={() => remove(index)} aria-label={`Remove contact ${index + 1}`}><Trash2 size={16} /></button>
      </div>)}
    </div>
    <button type="button" className={styles.add} onClick={() => onChange([...items, createPersonContact()])}><Plus size={15} /> {addLabel}</button>
  </div>;
};

export default PersonContactRepeater;