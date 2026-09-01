export const calculateStudentAge = (dateOfBirth, today = new Date()) => {
  if (!dateOfBirth) return "";
  const birth = new Date(dateOfBirth);
  if (Number.isNaN(birth.getTime())) return "";

  let age = today.getFullYear() - birth.getFullYear();
  if (
    today.getMonth() < birth.getMonth() ||
    (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())
  ) {
    age -= 1;
  }

  return age >= 0 ? age : "";
};

export const getStudentAgeCategory = (age) => {
  if (age === "" || age === null || age === undefined) return "";
  if (age <= 11) return "Sub-Junior";
  if (age <= 14) return "Cadet";
  if (age <= 17) return "Junior";
  return "Senior";
};

export const getStudentUnderCategory = (age) => {
  if (age === "" || age === null || age === undefined) return "";
  if (age <= 13) return "Under - 14";
  if (age <= 16) return "Under - 17";
  if (age <= 18) return "Under - 19";
  return "";
};

export const getStudentAgeCategoryLabel = (age) =>
  [getStudentAgeCategory(age), getStudentUnderCategory(age)]
    .filter(Boolean)
    .join(" / ");
