import { Check, Plus } from "lucide-react";
import clsx from "clsx";
import styles from "./OptionChipsField.module.css";

const optionValue = (option) =>
  option && typeof option === "object" ? option.value : option;

const optionLabel = (option) =>
  option && typeof option === "object"
    ? option.label ?? option.value
    : option;

const optionKey = (option) => String(optionValue(option) ?? "");

const sameOption = (left, right) =>
  String(optionValue(left) ?? "") === String(optionValue(right) ?? "");

const uniqueOptions = (options) => {
  const seen = new Set();

  return options.filter((option) => {
    const key = optionKey(option);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const OptionChipsField = ({ allowCustom = false, className = "", customInput = "", customPlaceholder = "Add custom option", customValues = [], label, multiple = true, onAddCustom, onCustomInputChange, onChange, options = [], value = [] }) => {
  const selected = multiple ? (Array.isArray(value) ? value : []) : value;
  const allOptions = uniqueOptions([...options, ...customValues]);
  const toggle = (option) => {
    const nextValue = optionValue(option);
    if (!multiple) return onChange?.(nextValue);

    const active = selected.some((item) => sameOption(item, nextValue));
    onChange?.(
      active
        ? selected.filter((item) => !sameOption(item, nextValue))
        : [...selected, nextValue],
    );
  };

  return (
    <div className={clsx(styles.root, className)}>
      {label ? <span className={styles.label}>{label}</span> : null}
      <div
        className={clsx(styles.chips, allOptions.length === 1 && styles.single)}
      >
        {allOptions.map((option) => {
          const currentValue = optionValue(option);
          const currentLabel = optionLabel(option);
          const active = multiple
            ? selected.some((item) => sameOption(item, currentValue))
            : sameOption(selected, currentValue);

          return (
            <button
              type="button"
              key={optionKey(option)}
              className={clsx(styles.chip, active && styles.selected)}
              aria-pressed={active}
              onClick={() => toggle(option)}
            >
              {active ? <Check size={13} /> : <Plus size={13} />}
              {String(currentLabel ?? "")}
            </button>
          );
        })}
      </div>
      {allowCustom ? (
        <div className={styles.custom}>
          <input
            value={customInput}
            placeholder={customPlaceholder}
            onChange={(event) => onCustomInputChange?.(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                onAddCustom?.();
              }
            }}
          />
          <button
            type="button"
            disabled={!customInput.trim()}
            onClick={onAddCustom}
          >
            <Plus size={14} /> Add
          </button>
        </div>
      ) : null}
    </div>
  );
};

export default OptionChipsField;
