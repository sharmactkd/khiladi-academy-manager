const empty = value => value === null || value === undefined || value === "" || (Array.isArray(value) && !value.length);
const supplied = value => !empty(value) && !/^[—–-]+$/.test(String(value).trim());
export const IMPORT_UPDATABLE_FIELDS = ["aadhaarNumber", "dateOfBirth", "phone", "email", "schoolName", "className", "section", "collegeName", "occupation", "parentName", "parentPhone", "address", "city", "state", "beltRank", "danRank", "heightCm", "weightKg", "bloodGroup", "medicalConditions", "joiningDate", "notes"];
export function fillImportedStudentFields(existing, normalized, raw) {
  const changed = [];
  for (const field of IMPORT_UPDATABLE_FIELDS) {
    if (empty(existing[field]) && supplied(raw[field]) && supplied(normalized[field])) {
      existing[field] = normalized[field]; changed.push(field);
      const code = field === "phone" ? "countryCode" : field === "parentPhone" ? "parentCountryCode" : null;
      if (code && supplied(raw[code])) existing[code] = normalized[code];
    }
  }
  return changed;
}

export function replaceReviewedStudentFields(existing, normalized, raw) {
  const changed = [];
  for (const field of new Set(Array.isArray(raw.replaceFields) ? raw.replaceFields : [])) {
    if (!IMPORT_UPDATABLE_FIELDS.includes(field) || !supplied(raw[field]) || !supplied(normalized[field])) continue;
    if (JSON.stringify(existing[field]) === JSON.stringify(normalized[field])) continue;
    existing[field] = normalized[field]; changed.push(field);
  }
  return changed;
}

export function overwriteImportedStudentFields(existing, normalized, raw) {
  return replaceReviewedStudentFields(existing, normalized, { ...raw, replaceFields: IMPORT_UPDATABLE_FIELDS });
}
