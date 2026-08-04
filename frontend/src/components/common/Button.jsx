const Button = ({
  children,
  type = "button",
  variant = "primary",
  disabled = false,
  loading = false,
  className = "",
  onClick,
  ...props
}) => {
  const buttonClassName = [
    "btn",
    `btn-${variant}`,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      type={type}
      className={buttonClassName}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      onClick={onClick}
      {...props}
    >
      {loading && (
        <span
          className="btn-spinner"
          aria-hidden="true"
        />
      )}

      {children}
    </button>
  );
};

export default Button;