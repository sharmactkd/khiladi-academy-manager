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
      {items.map((item, index) => <article className={styles.row} key={item.id}>
        <div className={styles.number}>{String(index + 1).padStart(2, "0")}</div>
        <div className={styles.fields}>
          <div className={styles.topFields}>
            <label><span>Name</span><input value={item.name} autoComplete="name" onChange={(event) => update(index, "name", event.target.value)} /></label>
            <label><span>Relation</span><select value={item.relation} onChange={(event) => update(index, "relation", event.target.value)}><option value="">Select Relation</option>{RELATION_OPTIONS.map((relation) => <option key={relation}>{relation}</option>)}</select></label>
          </div>
          {item.relation === "Other" ? <label className={styles.customRelation}><span>Specify Relation</span><input value={item.customRelation} onChange={(event) => update(index, "customRelation", event.target.value)} /></label> : null}
          <div className={styles.phoneRow}><PhoneLocationFields countryCode={item.countryCode} phone={item.phone} maxPhones={1} showAddPhone={false} phoneLabel="Mobile Number" showLocation={false} onChange={(field, value) => { if (field === "countryCode" || field === "phone") update(index, field, value); }} /></div>
        </div>
        <button type="button" className={styles.remove} disabled={items.length === 1} onClick={() => remove(index)} aria-label={`Remove contact ${index + 1}`}><Trash2 size={16} /></button>
        {index === items.length - 1 ? (
          <button type="button" className={styles.add} onClick={() => onChange([...items, createPersonContact()])}><Plus size={15} /> {addLabel}</button>
        ) : <span className={styles.addPlaceholder} aria-hidden="true" />}
      </article>)}
    </div>
  </div>;
};

export default PersonContactRepeater;