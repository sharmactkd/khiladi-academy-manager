import { forwardRef, useImperativeHandle, useRef } from "react";

const DateInput = forwardRef(function DateInput(
  { type = "date", onClick, onKeyDown, ...props },
  forwardedRef,
) {
  const inputRef = useRef(null);

  useImperativeHandle(forwardedRef, () => inputRef.current);

  const openPicker = () => {
    const input = inputRef.current;
    if (!input || input.disabled || input.readOnly) return;
    try {
      input.showPicker?.();
    } catch {
      input.focus();
    }
  };

  return (
    <input
      {...props}
      ref={inputRef}
      type={type}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) openPicker();
      }}
      onKeyDown={(event) => {
        onKeyDown?.(event);
        if (
          !event.defaultPrevented &&
          (event.key === "Enter" || event.key === " " || event.key === "ArrowDown")
        ) {
          event.preventDefault();
          openPicker();
        }
      }}
    />
  );
});

export default DateInput;
