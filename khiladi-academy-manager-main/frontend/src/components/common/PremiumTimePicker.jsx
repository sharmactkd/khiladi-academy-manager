import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Clock, Keyboard, X } from "lucide-react";

const HOURS = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
const MINUTES = Array.from({ length: 12 }, (_, index) => index * 5);

const pad = (value) => String(value).padStart(2, "0");

const parseTime = (value) => {
  const match = String(value || "").match(/^(\d{1,2}):(\d{2})$/);

  if (!match) {
    return { hour: 7, minute: 0, period: "PM" };
  }

  const hour24 = Math.min(23, Math.max(0, Number(match[1])));
  const minute = Math.min(59, Math.max(0, Number(match[2])));

  return {
    hour: hour24 % 12 || 12,
    minute,
    period: hour24 >= 12 ? "PM" : "AM",
  };
};

const toTimeValue = ({ hour, minute, period }) => {
  let hour24 = Number(hour) % 12;
  if (period === "PM") hour24 += 12;
  return `${pad(hour24)}:${pad(minute)}`;
};

const formatDisplayTime = (value, placeholder) => {
  if (!value) return placeholder;

  const time = parseTime(value);
  return `${pad(time.hour)}:${pad(time.minute)} ${time.period}`;
};

const PremiumTimePicker = ({
  id,
  name,
  label,
  value = "",
  onChange,
  required = false,
  disabled = false,
  placeholder = "Select time",
  minuteStep = 5,
  error = "",
}) => {
  const generatedId = useId();
  const inputId = id || `premium-time-${generatedId.replace(/:/g, "")}`;
  const dialogTitleId = `${inputId}-dialog-title`;
  const triggerRef = useRef(null);
  const dialogRef = useRef(null);

  const [open, setOpen] = useState(false);
  const [view, setView] = useState("hour");
  const [inputMode, setInputMode] = useState("clock");
  const [draft, setDraft] = useState(() => parseTime(value));

  const minuteOptions = useMemo(() => {
    const safeStep = [1, 5, 10, 15, 30].includes(Number(minuteStep))
      ? Number(minuteStep)
      : 5;
    return Array.from(
      { length: Math.ceil(60 / safeStep) },
      (_, index) => index * safeStep
    ).filter((minute) => minute < 60);
  }, [minuteStep]);

  useEffect(() => {
    if (!open) setDraft(parseTime(value));
  }, [open, value]);

  useEffect(() => {
    if (!open) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setOpen(false);
        requestAnimationFrame(() => triggerRef.current?.focus());
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    requestAnimationFrame(() => dialogRef.current?.focus());

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const openPicker = () => {
    if (disabled) return;
    setDraft(parseTime(value));
    setView("hour");
    setInputMode("clock");
    setOpen(true);
  };

  const closePicker = () => {
    setOpen(false);
    requestAnimationFrame(() => triggerRef.current?.focus());
  };

  const applyTime = () => {
    onChange?.(toTimeValue(draft));
    closePicker();
  };

  const selectHour = (hour) => {
    setDraft((previous) => ({ ...previous, hour }));
    setView("minute");
  };

  const selectMinute = (minute) => {
    setDraft((previous) => ({ ...previous, minute }));
  };

  const updateManualNumber = (field, rawValue) => {
    const numericValue = Number(String(rawValue).replace(/\D/g, ""));
    const maximum = field === "hour" ? 12 : 59;
    const minimum = field === "hour" ? 1 : 0;

    setDraft((previous) => ({
      ...previous,
      [field]: Number.isFinite(numericValue)
        ? Math.min(maximum, Math.max(minimum, numericValue))
        : minimum,
    }));
  };

  const activeFaceValues = view === "hour" ? HOURS : MINUTES;

  return (
    <div className={`premium-time-field${error ? " has-error" : ""}`}>
      {label ? (
        <label className="premium-time-field__label" htmlFor={inputId}>
          {label}
          {required ? <span aria-hidden="true"> *</span> : null}
        </label>
      ) : null}

      <button
        ref={triggerRef}
        id={inputId}
        name={name}
        type="button"
        className="premium-time-field__trigger"
        onClick={openPicker}
        disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-invalid={Boolean(error)}
      >
        <span className={value ? "" : "is-placeholder"}>
          {formatDisplayTime(value, placeholder)}
        </span>
        <Clock size={18} aria-hidden="true" />
      </button>

      {error ? <small className="premium-time-field__error">{error}</small> : null}

      {open ? (
        <div
          className="premium-time-picker__backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closePicker();
          }}
        >
          <section
            ref={dialogRef}
            className="premium-time-picker"
            role="dialog"
            aria-modal="true"
            aria-labelledby={dialogTitleId}
            tabIndex={-1}
          >
            <header className="premium-time-picker__header">
              <div>
                <span>Schedule</span>
                <h2 id={dialogTitleId}>{label || "Select time"}</h2>
              </div>
              <button
                type="button"
                className="premium-time-picker__close"
                onClick={closePicker}
                aria-label="Close time picker"
              >
                <X size={19} aria-hidden="true" />
              </button>
            </header>

            <div className="premium-time-picker__display" aria-label="Selected time">
              {inputMode === "clock" ? (
                <>
                  <button
                    type="button"
                    className={view === "hour" ? "is-active" : ""}
                    onClick={() => setView("hour")}
                  >
                    {pad(draft.hour)}
                  </button>
                  <strong aria-hidden="true">:</strong>
                  <button
                    type="button"
                    className={view === "minute" ? "is-active" : ""}
                    onClick={() => setView("minute")}
                  >
                    {pad(draft.minute)}
                  </button>
                </>
              ) : (
                <>
                  <input
                    type="text"
                    inputMode="numeric"
                    aria-label="Hour"
                    value={pad(draft.hour)}
                    onChange={(event) => updateManualNumber("hour", event.target.value)}
                    onFocus={(event) => event.currentTarget.select()}
                  />
                  <strong aria-hidden="true">:</strong>
                  <input
                    type="text"
                    inputMode="numeric"
                    aria-label="Minute"
                    value={pad(draft.minute)}
                    onChange={(event) => updateManualNumber("minute", event.target.value)}
                    onFocus={(event) => event.currentTarget.select()}
                  />
                </>
              )}

              <div className="premium-time-picker__period" role="group" aria-label="AM or PM">
                {['AM', 'PM'].map((period) => (
                  <button
                    type="button"
                    key={period}
                    className={draft.period === period ? "is-active" : ""}
                    onClick={() =>
                      setDraft((previous) => ({ ...previous, period }))
                    }
                    aria-pressed={draft.period === period}
                  >
                    {period}
                  </button>
                ))}
              </div>
            </div>

            {inputMode === "clock" ? (
              <div
                className={`premium-time-picker__clock premium-time-picker__clock--${view}`}
                aria-label={view === "hour" ? "Select hour" : "Select minute"}
              >
                <span
                  className={`premium-time-picker__hand premium-time-picker__hand--${
                    view === "hour" ? draft.hour : Math.round(draft.minute / 5) % 12
                  }`}
                  aria-hidden="true"
                />

                {activeFaceValues.map((item, index) => {
                  const selected =
                    view === "hour" ? draft.hour === item : draft.minute === item;

                  return (
                    <button
                      type="button"
                      key={`${view}-${item}`}
                      className={`premium-time-picker__number premium-time-picker__number--${index}${
                        selected ? " is-selected" : ""
                      }`}
                      onClick={() =>
                        view === "hour" ? selectHour(item) : selectMinute(item)
                      }
                      aria-pressed={selected}
                    >
                      {view === "minute" ? pad(item) : item}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="premium-time-picker__manual-minutes">
                <span>Quick minutes</span>
                <div>
                  {minuteOptions.map((minute) => (
                    <button
                      type="button"
                      key={minute}
                      className={draft.minute === minute ? "is-active" : ""}
                      onClick={() => selectMinute(minute)}
                    >
                      {pad(minute)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <footer className="premium-time-picker__footer">
              <button
                type="button"
                className="premium-time-picker__mode"
                onClick={() =>
                  setInputMode((current) =>
                    current === "clock" ? "manual" : "clock"
                  )
                }
                aria-label={
                  inputMode === "clock"
                    ? "Switch to keyboard input"
                    : "Switch to clock input"
                }
              >
                {inputMode === "clock" ? (
                  <Keyboard size={20} aria-hidden="true" />
                ) : (
                  <Clock size={20} aria-hidden="true" />
                )}
              </button>

              <div>
                <button type="button" className="premium-time-picker__cancel" onClick={closePicker}>
                  Cancel
                </button>
                <button type="button" className="premium-time-picker__apply" onClick={applyTime}>
                  OK
                </button>
              </div>
            </footer>
          </section>
        </div>
      ) : null}
    </div>
  );
};

export default PremiumTimePicker;
