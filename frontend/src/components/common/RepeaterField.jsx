import { Plus, Trash2 } from "lucide-react";
import styles from "./RepeaterField.module.css";

const RepeaterField = ({ addLabel = "Add More", createItem, items = [], minItems = 1, onChange, renderItem }) => {
  const update = (index, nextItem) => onChange?.(items.map((item, itemIndex) => itemIndex === index ? nextItem : item));
  const remove = (index) => onChange?.(items.length > minItems ? items.filter((_, itemIndex) => itemIndex !== index) : items);
  return <div className={styles.root}><div className={styles.rows}>{items.map((item, index) => <div className={styles.row} key={item.id || index}>{renderItem({ index, item, update: (next) => update(index, next) })}<button type="button" className={styles.remove} disabled={items.length <= minItems} onClick={() => remove(index)} aria-label={`Remove row ${index + 1}`}><Trash2 size={17} /></button></div>)}</div><button type="button" className={styles.add} onClick={() => onChange?.([...items, createItem()])}><Plus size={16} />{addLabel}</button></div>;
};

export default RepeaterField;
