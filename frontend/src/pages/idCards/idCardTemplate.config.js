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
export const ID_CARD_SIZE_PRESETS = [
  { key: "cr80", label: "3.37 × 2.13 inches", note: "Standard ID / bank card · 85.60 × 53.98 mm", widthMm: 85.6, heightMm: 53.98 },
  { key: "cr79", label: "3.30 × 2.01 inches", note: "Adhesive card insert · 83.90 × 51.00 mm", widthMm: 83.9, heightMm: 51 },
  { key: "cr100", label: "3.88 × 2.64 inches", note: "Oversized event ID · 98.50 × 67.00 mm", widthMm: 98.5, heightMm: 67 },
  { key: "business", label: "3.50 × 2.00 inches", note: "Business-card format · 88.90 × 50.80 mm", widthMm: 88.9, heightMm: 50.8 },
  { key: "custom", label: "Custom Size", note: "Enter width and height", widthMm: null, heightMm: null },
];

export const getTemplateSize = (template = {}) => {
  const preset = ID_CARD_SIZE_PRESETS.find((item) => item.key === template.cardSize) || ID_CARD_SIZE_PRESETS[0];
  let widthMm = preset.widthMm;
  let heightMm = preset.heightMm;
  if (preset.key === "custom") {
    const multiplier = template.customSize?.unit === "in" ? 25.4 : 10;
    widthMm = Math.max(Number(template.customSize?.width || 8.56) * multiplier, 10);
    heightMm = Math.max(Number(template.customSize?.height || 5.398) * multiplier, 10);
  }
  if (template.orientation === "vertical") [widthMm, heightMm] = [heightMm, widthMm];
  return { ...preset, widthMm, heightMm, label: preset.key === "custom" ? `Custom · ${template.customSize?.width || "—"} × ${template.customSize?.height || "—"} ${template.customSize?.unit || "cm"}` : preset.label };
};
export const createTemplateForm = () => ({
  templateName: "Elite Student Identity", status: "draft", orientation: "horizontal", cardSize: "cr80", customSize: { width: 8.56, height: 5.398, unit: "cm" }, logo: "",
  backgroundColor: "#ffffff", textColor: "#10223e", primaryColor: "#10223e", secondaryColor: "#e50914",
  accentColor: "#d4af37", fontFamily: "Inter", photoShape: "circle", isDefault: false,
  frontDesign: { fields: FRONT_FIELDS, showSafeArea: true, showBleed: false, label: "STUDENT IDENTITY", backgroundImage: "" },
  backDesign: { fields: BACK_FIELDS, showSafeArea: true, showBleed: false, label: "ACADEMY MEMBER", backgroundImage: "" },
});
export const normalizeTemplate = (template = {}) => { const fallback = createTemplateForm(); const legacyMap = { name: "fullName", studentCode: "admissionNumber" }; const legacy = Array.isArray(template.fields) && template.fields.length ? template.fields.map((key) => legacyMap[key] || key) : fallback.frontDesign.fields; return { ...fallback, ...template, frontDesign: { ...fallback.frontDesign, ...(template.frontDesign || {}), fields: template.frontDesign?.fields?.length ? template.frontDesign.fields.map((key) => legacyMap[key] || key) : legacy }, backDesign: { ...fallback.backDesign, ...(template.backDesign || {}) } }; };
export const SAMPLE_ID_CARD = { cardNumber: "KAM-2026-00418", status: "active", validTill: "2027-08-31", qrCodeData: "https://khiladi.app/verify/demo", student: { firstName: "Aarav", lastName: "Sharma", admissionNumber: "KAM-STU-0418", beltRank: "Red Belt · 1st Kup", martialArt: "Taekwondo", phone: "+91 98765 43210", branch: { branchName: "Main Branch" }, batch: { batchName: "Elite Evening" } }, academy: { academyName: "KHILADI ACADEMY", address: "New Delhi, India" } };
