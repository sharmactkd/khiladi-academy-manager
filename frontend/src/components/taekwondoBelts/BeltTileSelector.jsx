import clsx from "clsx";
import { Infinity as InfinityIcon } from "lucide-react";

import {
  TAEKWONDO_BELT_IMAGES,
  TAEKWONDO_BELTS,
} from "./taekwondoBelts.js";
import styles from "./BeltTileSelector.module.css";

const normalizeValues = (value, multiple) =>
  multiple ? (Array.isArray(value) ? value : []) : value ? [value] : [];

const BeltTileSelector = ({
  className = "",
  compact = false,
  disabled = false,
  getOptionDisabled,
  includeNoLimit = false,
  multiple = false,
  noLimit = false,
  onChange,
  onNoLimitChange,
  options = TAEKWONDO_BELTS,
  readOnly = false,
  value = multiple ? [] : "",
}) => {
  const selected = normalizeValues(value, multiple);

  const toggle = (belt) => {
    if (readOnly || disabled || getOptionDisabled?.(belt)) return;
    onNoLimitChange?.(false);
    if (multiple) {
      onChange?.(
        selected.includes(belt)
          ? selected.filter((item) => item !== belt)
          : [...selected, belt],
      );
      return;
    }
    onChange?.(selected.includes(belt) ? "" : belt);
  };

  return (
    <div className={clsx(styles.grid, compact && styles.compact, className)}>
      {options.map((belt) => {
        const active = !noLimit && selected.includes(belt);
        const optionDisabled = disabled || Boolean(getOptionDisabled?.(belt));
        const Root = readOnly ? "div" : "button";
        return (
          <Root
            key={belt}
            {...(!readOnly
              ? {
                  type: "button",
                  disabled: optionDisabled,
                  "aria-pressed": active,
                  onClick: () => toggle(belt),
                }
              : {})}
            className={clsx(
              styles.tile,
              active && styles.selected,
              readOnly && styles.readOnly,
            )}
          >
            <span className={styles.icon}>
              <img src={TAEKWONDO_BELT_IMAGES[belt]} alt="" aria-hidden="true" />
            </span>
            <span className={styles.label}>{belt}</span>
          </Root>
        );
      })}
      {includeNoLimit ? (
        <button
          type="button"
          className={clsx(styles.tile, styles.noLimit, noLimit && styles.selected)}
          aria-pressed={noLimit}
          disabled={disabled || readOnly}
          onClick={() => onNoLimitChange?.(!noLimit)}
        >
          <span className={styles.icon}><InfinityIcon aria-hidden="true" /></span>
          <span className={styles.label}>No Limit</span>
        </button>
      ) : null}
    </div>
  );
};

export default BeltTileSelector;
