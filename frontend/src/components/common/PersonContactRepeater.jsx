import { Plus, Trash2 } from "lucide-react";
import clsx from "clsx";
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
        <label className={styles.phone}><span>Mobile Number</span><div><select aria-label="Country code" value={item.countryCode} onChange={(event) => update(index, "countryCode", event.target.value)}><option>+91</option><option>+1</option><option>+44</option><option>+61</option><option>+971</option></select><input value={item.phone} inputMode="tel" placeholder="0000-00-0000" onChange={(event) => update(index, "phone", event.target.value.replace(/[^0-9-]/g, "").slice(0, 12))} /></div></label>
        <button type="button" className={styles.remove} disabled={items.length === 1} onClick={() => remove(index)} aria-label={`Remove contact ${index + 1}`}><Trash2 size={16} /></button>
      </div>)}
    </div>
    <button type="button" className={styles.add} onClick={() => onChange([...items, createPersonContact()])}><Plus size={15} /> {addLabel}</button>
  </div>;
};

export default PersonContactRepeater;
