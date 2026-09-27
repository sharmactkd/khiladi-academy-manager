import "flag-icons/css/flag-icons.min.css";

const CountryFlag = ({ countryCode = "", className = "" }) => {
  const code = String(countryCode).trim().toLowerCase();
  if (!/^[a-z]{2}$/.test(code)) {
    return <span className={className} aria-hidden="true">🌐</span>;
  }

  return (
    <span
      className={`fi fi-${code} ${className}`.trim()}
      role="img"
      aria-label={`${code.toUpperCase()} country flag`}
    />
  );
};

export default CountryFlag;
