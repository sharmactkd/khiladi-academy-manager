const Input = ({
  label,
  name,
  type = "text",
  value,
  onChange,
  placeholder,
  required = false,
  autoComplete,
  error = "",
  helperText = "",
  disabled = false,
  readOnly = false,
  className = "",
  ...props
}) => {
  const inputId = props.id || name;

  const fieldClassName = [
    "form-field",
    error ? "has-error" : "",
    disabled ? "is-disabled" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const errorId = error ? `${inputId}-error` : undefined;
  const helperId =
    helperText && !error
      ? `${inputId}-helper`
      : undefined;

  return (
    <label
      className={fieldClassName}
      htmlFor={inputId}
    >
      {label && (
        <span className="form-field__label">
          {label}

          {required && (
            <span
              className="form-field__required"
              aria-hidden="true"
            >
              *
            </span>
          )}
        </span>
      )}

      <input
        id={inputId}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        autoComplete={autoComplete}
        disabled={disabled}
        readOnly={readOnly}
        aria-invalid={Boolean(error)}
        aria-describedby={errorId || helperId}
        {...props}
      />

      {error && (
        <small
          id={errorId}
          className="field-error"
          role="alert"
        >
          {error}
        </small>
      )}

      {helperText && !error && (
        <small
          id={helperId}
          className="field-helper"
        >
          {helperText}
        </small>
      )}
    </label>
  );
};

export default Input;