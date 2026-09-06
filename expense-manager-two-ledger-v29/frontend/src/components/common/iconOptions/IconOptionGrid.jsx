import clsx from "clsx";
import { useState } from "react";
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
  interactive = true,
  kind = "generic",
  onRemoveCustom,
  onToggle,
  options = [],
  selected = [],
  trailingContent = null,
}) => {
  const [hoveredValue, setHoveredValue] = useState("");
  const selectedValues = new Set(
    (Array.isArray(selected) ? selected : [selected].filter(Boolean)).map(
      (value) => String(value).trim().toLowerCase(),
    ),
  );
  const customSet = new Set(
    customOptions.map((item) => String(item).trim().toLowerCase()),
  );

  return (
    <div className={clsx(styles.grid, "ui-choice-grid", compact && styles.compact, compact && "is-compact", className)}>
      {options.map(asOption).filter((item) => item.value).map((item) => {
        const active = selectedValues.has(
          String(item.value).trim().toLowerCase(),
        );
        const custom = customSet.has(String(item.value).toLowerCase());
        const Root = interactive ? "button" : "div";
        return (
          <div className={clsx(styles.item, "ui-choice-wrap", custom && styles.custom, custom && "is-custom")} key={item.value}>
            <Root
              {...(interactive
                ? {
                    type: "button",
                    "aria-pressed": active,
                    disabled: item.disabled,
                    onClick: () => onToggle?.(item.value),
                    title: `${active ? "Clear" : "Select"} ${item.label}`,
                  }
                : {})}
              className={clsx(
                styles.option,
                "ui-choice ui-choice--tile",
                !interactive && styles.readOnly,
                !interactive && "is-read-only",
                active && styles.selected,
                active && "is-selected",
                hoveredValue === String(item.value) && "is-pointer-hovered",
              )}
              onPointerEnter={() => setHoveredValue(String(item.value))}
              onPointerLeave={() => setHoveredValue("")}
            >
              <span className={clsx(styles.icon, "ui-choice-icon")}><OptionIcon kind={kind} value={item.value} /></span>
              <span className={clsx(styles.label, "ui-choice-text")}>{item.label}</span>
            </Root>
            {interactive && custom && onRemoveCustom ? (
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
