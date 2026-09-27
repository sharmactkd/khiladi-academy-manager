export const countryFlagEmoji = (countryCode = "") => {
  const code = String(countryCode).trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(code)) return "🌐";
  return String.fromCodePoint(...[...code].map((letter) => 127397 + letter.charCodeAt(0)));
};
