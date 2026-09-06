export const getPhoneDigits = (value) =>
  String(value || "").replace(/\D/g, "");

export const formatStudentPhone = (value, countryCode = "+91") => {
  const digits = getPhoneDigits(value).slice(0, countryCode === "+91" ? 10 : 15);

  if (countryCode !== "+91" || digits.length <= 4) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 4)}-${digits.slice(4)}`;
  return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 10)}`;
};

export const formatStudentPhoneWithCode = (
  value,
  countryCode = "+91",
) => {
  const formattedPhone = formatStudentPhone(value, countryCode);
  return formattedPhone ? `${countryCode || "+91"} ${formattedPhone}` : "";
};
