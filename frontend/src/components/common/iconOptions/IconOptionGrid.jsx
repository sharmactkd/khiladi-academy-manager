import clsx from "clsx";
import { X } from "lucide-react";
import { OptionIcon, optionKindLabel } from "./optionIconRegistry.jsx";
import styles from "./IconOptionGrid.module.css";

const asOption = (item) =>
  typeof item === "string"
    ? { value: item, label: item }
    : { value: item?.value, label: item?.label || item?.value, disabled: item?.disabled };

const IconOptionGrid = ({
  className = "",
  compact = false,
  customOptions = [],
  kind = "generic",
  onRemoveCustom,
  onToggle,
  options = [],
  selected = [],
}) => {
  const selectedValues = Array.isArray(selected) ? selected : [selected].filter(Boolean);
  const customSet = new Set(customOptions.map((item) => String(item).toLowerCase()));

  return (
    <div className={clsx(styles.grid, compact && styles.compact, className)}>
      {options.map(asOption).filter((item) => item.value).map((item) => {
        const active = selectedValues.includes(item.value);
        const custom = customSet.has(String(item.value).toLowerCase());
        return (
          <div className={clsx(styles.item, custom && styles.custom)} key={item.value}>
            <button
              type="button"
              className={clsx(styles.option, active && styles.selected)}
              aria-pressed={active}
              disabled={item.disabled}
              onClick={() => onToggle?.(item.value)}
              title={`${active ? "Clear" : "Select"} ${item.label}`}
            >
              <span className={styles.icon}><OptionIcon kind={kind} value={item.value} /></span>
              <span className={styles.label}>{item.label}</span>
            </button>
            {custom && onRemoveCustom ? (
              <button
                type="button"
                className={styles.remove}
                aria-label={`Delete custom ${optionKindLabel(kind)} ${item.label}`}
                title={`Delete ${item.label}`}
                onClick={() => onRemoveCustom(item.value)}
              >
                <X aria-hidden="true" />
              </button>
            ) : null}
          </div>
        );
      })}
    </div>
  );
};

export default IconOptionGrid;
