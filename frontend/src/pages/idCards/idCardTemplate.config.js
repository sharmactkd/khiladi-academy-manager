export const ID_CARD_FIELDS = [
  { key: "studentPhoto", label: "Student photo" }, { key: "fullName", label: "Full name" },
  { key: "admissionNumber", label: "Admission number" }, { key: "martialArt", label: "Martial art" },
  { key: "beltRank", label: "Belt / rank" }, { key: "branch", label: "Branch" },
  { key: "batch", label: "Batch" }, { key: "phone", label: "Phone" },
  { key: "validTill", label: "Valid till" }, { key: "cardNumber", label: "Card number" },
  { key: "qrCode", label: "Secure QR" }, { key: "academyAddress", label: "Academy address" },
  { key: "emergencyContact", label: "Emergency contact" }, { key: "terms", label: "Terms" },
];
export const FRONT_FIELDS = ["studentPhoto", "fullName", "admissionNumber", "martialArt", "beltRank", "branch", "validTill", "qrCode"];
export const BACK_FIELDS = ["cardNumber", "batch", "phone", "emergencyContact", "academyAddress", "terms", "qrCode"];
export const createTemplateForm = () => ({
  templateName: "Elite Student Identity", status: "draft", orientation: "horizontal", cardSize: "cr80", logo: "",
  backgroundColor: "#ffffff", textColor: "#10223e", primaryColor: "#10223e", secondaryColor: "#e50914",
  accentColor: "#d4af37", fontFamily: "Inter", photoShape: "circle", isDefault: false,
  frontDesign: { fields: FRONT_FIELDS, showSafeArea: true, showBleed: false, label: "STUDENT IDENTITY" },
  backDesign: { fields: BACK_FIELDS, showSafeArea: true, showBleed: false, label: "ACADEMY MEMBER" },
});
export const normalizeTemplate = (template = {}) => { const fallback = createTemplateForm(); const legacyMap = { name: "fullName", studentCode: "admissionNumber" }; const legacy = Array.isArray(template.fields) && template.fields.length ? template.fields.map((key) => legacyMap[key] || key) : fallback.frontDesign.fields; return { ...fallback, ...template, frontDesign: { ...fallback.frontDesign, ...(template.frontDesign || {}), fields: template.frontDesign?.fields?.length ? template.frontDesign.fields.map((key) => legacyMap[key] || key) : legacy }, backDesign: { ...fallback.backDesign, ...(template.backDesign || {}) } }; };
export const SAMPLE_ID_CARD = { cardNumber: "KAM-2026-00418", status: "active", validTill: "2027-08-31", qrCodeData: "https://khiladi.app/verify/demo", student: { firstName: "Aarav", lastName: "Sharma", admissionNumber: "KAM-STU-0418", beltRank: "Red Belt · 1st Kup", martialArt: "Taekwondo", phone: "+91 98765 43210", branch: { branchName: "Main Branch" }, batch: { batchName: "Elite Evening" } }, academy: { academyName: "KHILADI ACADEMY", address: "New Delhi, India" } };
