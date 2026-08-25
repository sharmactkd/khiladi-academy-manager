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
  trailingContent = null,
}) => {
  const selectedValues = Array.isArray(selected) ? selected : [selected].filter(Boolean);
  const customSet = new Set(customOptions.map((item) => String(item).toLowerCase()));

  return (
    <div className={clsx(styles.grid, "ui-choice-grid", compact && styles.compact, compact && "is-compact", className)}>
      {options.map(asOption).filter((item) => item.value).map((item) => {
        const active = selectedValues.includes(item.value);
        const custom = customSet.has(String(item.value).toLowerCase());
        return (
          <div className={clsx(styles.item, "ui-choice-wrap", custom && styles.custom, custom && "is-custom")} key={item.value}>
            <button
              type="button"
              className={clsx(styles.option, "ui-choice ui-choice--tile", active && styles.selected, active && "is-selected")}
              aria-pressed={active}
              disabled={item.disabled}
              onClick={() => onToggle?.(item.value)}
              title={`${active ? "Clear" : "Select"} ${item.label}`}
            >
              <span className={clsx(styles.icon, "ui-choice-icon")}><OptionIcon kind={kind} value={item.value} /></span>
              <span className={clsx(styles.label, "ui-choice-text")}>{item.label}</span>
            </button>
            {custom && onRemoveCustom ? (
              <button
                type="button"
                className={clsx(styles.remove, "ui-choice-remove")}
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
      {trailingContent ? <div className={clsx(styles.trailing, "ui-choice-trailing")}>{trailingContent}</div> : null}
    </div>
  );
};

export default IconOptionGrid;
