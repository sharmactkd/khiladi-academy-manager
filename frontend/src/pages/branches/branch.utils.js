import { FACILITY_OPTIONS, LANGUAGE_OPTIONS } from "./branch.config.js";

export const createInitialBranchForm = () => ({
  directorName: "", branchName: "", branchCode: "", countryCode: "+91",
  phone: "", phoneNumbers: [], email: "", address: "", city: "", state: "",
  country: "India", headCoachName: "", headCoachCountryCode: "+91",
  headCoachPhone: "", headCoachAchievements: "", assistantCoachName: "",
  assistantCoachCountryCode: "+91", assistantCoachPhone: "",
  assistantCoachAchievements: "", additionalCoaches: [], customFacility: "",
  customLanguage: "", customFacilities: [], customLanguages: [], branchSince: "",
  facilities: [], languagesSpoken: [], isMainBranch: false, isActive: true,
});

export const unwrapList = (response) => {
  const candidates = [response?.data?.data, response?.data, response];
  return candidates.find(Array.isArray) || [];
};

export const joinAddressParts = (parts = []) => {
  const values = [];
  parts.forEach((part) => {
    const value = String(part ?? "").trim();
    if (value && !values.some((item) => item.toLowerCase() === value.toLowerCase())) values.push(value);
  });
  return values.join(", ");
};

export const normalizeList = (value) => {
  if (Array.isArray(value)) return value.map((item) => String(item || "").trim()).filter(Boolean);
  if (typeof value !== "string" || !value.trim()) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? normalizeList(parsed) : [];
  } catch {
    return value.split(",").map((item) => item.trim()).filter(Boolean);
  }
};

const normalizeFacility = (value) => value === "Mat Area" ? "Mat Arena" : value;

export const normalizePhones = (branch) => {
  const stored = Array.isArray(branch?.phoneNumbers) ? branch.phoneNumbers : [];
  const phones = stored.slice(0, 4).map((item, index) => ({
    countryCode: item?.countryCode || "+91", phone: item?.phone || "", isPrimary: index === 0,
  }));
  if (!phones.length) phones.push({ countryCode: branch?.countryCode || "+91", phone: branch?.phone || "", isPrimary: true });
  return phones;
};

export const normalizeBranchForm = (branch) => ({
  ...createInitialBranchForm(), ...branch,
  directorName: branch?.directorName || "",
  phoneNumbers: normalizePhones(branch),
  additionalCoaches: Array.isArray(branch?.additionalCoaches)
    ? branch.additionalCoaches.map((coach) => ({ name: coach?.name || "", countryCode: coach?.countryCode || "+91", phone: coach?.phone || "", achievements: coach?.achievements || "" }))
    : [],
  facilities: normalizeList(branch?.facilities).map(normalizeFacility),
  customFacilities: [...new Set([...normalizeList(branch?.customFacilities).map(normalizeFacility), ...normalizeList(branch?.facilities).map(normalizeFacility).filter((item) => !FACILITY_OPTIONS.includes(item))])],
  languagesSpoken: normalizeList(branch?.languagesSpoken),
  customLanguages: [...new Set([...normalizeList(branch?.customLanguages), ...normalizeList(branch?.languagesSpoken).filter((item) => !LANGUAGE_OPTIONS.includes(item))])],
  branchSince: branch?.branchSince || "",
  isMainBranch: Boolean(branch?.isMainBranch),
  isActive: branch?.isActive !== false,
});

export const createBranchPayload = (form) => {
  const payload = {
    ...form,
    directorName: form.directorName.trim(),
    branchName: form.branchName.trim(),
    branchCode: form.branchCode.trim().toUpperCase(),
    email: form.email.trim(),
    address: form.address.trim(),
    additionalCoaches: form.additionalCoaches.filter((coach) => coach.name?.trim() || coach.phone?.trim()),
  };
  delete payload.customFacility;
  delete payload.customLanguage;
  return payload;
};
