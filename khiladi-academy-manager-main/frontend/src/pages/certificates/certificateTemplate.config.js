export const CERTIFICATE_TYPES = [
  { value: "belt", label: "Belt Promotion" },
  { value: "participation", label: "Participation" },
  { value: "achievement", label: "Achievement" },
  { value: "championship", label: "Championship" },
  { value: "appreciation", label: "Appreciation" },
  { value: "course_completion", label: "Course Completion" },
  { value: "instructor_certification", label: "Instructor Certification" },
  { value: "custom", label: "Custom" },
];

export const CERTIFICATE_FIELDS = [
  { key: "academyLogo", label: "Academy logo" },
  { key: "academyName", label: "Academy name" },
  { key: "certificateTitle", label: "Certificate title" },
  { key: "studentName", label: "Student name" },
  { key: "dateOfBirth", label: "Date of birth" },
  { key: "achievement", label: "Achievement" },
  { key: "beltAndDan", label: "Belt and Dan" },
  { key: "eventName", label: "Event name" },
  { key: "issueDate", label: "Issue date" },
  { key: "certificateNumber", label: "Certificate number" },
  { key: "signatures", label: "Signatures" },
  { key: "qrVerification", label: "QR verification" },
];

const DEFAULT_FIELDS = [
  "academyLogo", "academyName", "certificateTitle", "studentName", "achievement",
  "beltAndDan", "dateOfBirth", "issueDate", "certificateNumber", "signatures", "qrVerification",
];

export const CERTIFICATE_PAGE_SIZES = [
  { value: "a4", label: "A4 · 21.0 × 29.7 cm", widthMm: 297, heightMm: 210 },
  { value: "letter", label: "Letter · 8.5 × 11 in", widthMm: 279.4, heightMm: 215.9 },
  { value: "legal", label: "Legal · 8.5 × 14 in", widthMm: 355.6, heightMm: 215.9 },
  { value: "custom", label: "Custom Size", widthMm: null, heightMm: null },
];

export const CERTIFICATE_TITLE_OPTIONS = [
  { value: "APPRECIATION", label: "Appreciation" },
  { value: "BEST PERFORMER OF ACADEMY", label: "Best Performer of Academy" },
  { value: "BEST PERFORMER OF BRANCH", label: "Best Performer of Branch" },
  { value: "BEST PERFORMER OF BATCH", label: "Best Performer of Batch" },
  { value: "100% ATTENDANCE", label: "100% Attendance" },
  { value: "custom", label: "Custom" },
];

export const getCertificateSize = (template = {}) => {
  const preset = CERTIFICATE_PAGE_SIZES.find((item) => item.value === template.pageSize) || CERTIFICATE_PAGE_SIZES[0];
  let widthMm = preset.widthMm; let heightMm = preset.heightMm;
  if (preset.value === "custom") { const multiplier = template.customPageSize?.unit === "in" ? 25.4 : 10; widthMm = Number(template.customPageSize?.width || 29.7) * multiplier; heightMm = Number(template.customPageSize?.height || 21) * multiplier; }
  if (template.orientation === "portrait" && widthMm > heightMm) [widthMm, heightMm] = [heightMm, widthMm];
  if (template.orientation === "landscape" && widthMm < heightMm) [widthMm, heightMm] = [heightMm, widthMm];
  return { ...preset, widthMm, heightMm };
};

const titleByType = {
  belt: "CERTIFICATE OF BELT PROMOTION",
  participation: "CERTIFICATE OF PARTICIPATION",
  achievement: "CERTIFICATE OF ACHIEVEMENT",
  championship: "CERTIFICATE OF CHAMPIONSHIP EXCELLENCE",
  appreciation: "CERTIFICATE OF APPRECIATION",
  course_completion: "CERTIFICATE OF COURSE COMPLETION",
  instructor_certification: "INSTRUCTOR CERTIFICATION",
  custom: "CERTIFICATE OF RECOGNITION",
};

export const certificateTitleFor = (type) => titleByType[type] || titleByType.custom;

export const createCertificateTemplate = () => ({
  templateName: "Elite Belt Promotion",
  certificateType: "belt",
  status: "draft",
  pageSize: "a4",
  customPageSize: { width: 29.7, height: 21, unit: "cm" },
  orientation: "landscape",
  backgroundImage: "",
  fields: DEFAULT_FIELDS,
  isDefault: false,
  layoutJson: {
    schemaVersion: 1,
    fields: DEFAULT_FIELDS,
    content: {
      eyebrow: "THIS IS TO CERTIFY THAT",
      title: "CERTIFICATE OF APPRECIATION",
      titleOption: "APPRECIATION",
      statement: "In recognition of dedication, discipline and outstanding achievement in martial arts, this certificate is proudly awarded.",
    },
    brand: {
      primaryColor: "#10223e",
      secondaryColor: "#e50914",
      accentColor: "#d4af37",
      backgroundColor: "#fffdf7",
      headingFont: "Georgia",
      bodyFont: "Inter",
      borderStyle: "heritage",
    },
    signatures: [{ name: "", role: "", imageUrl: "" }],
    security: { showQr: true, showWatermark: true },
    print: { showSafeArea: true, showBleed: false },
  },
});

export const normalizeCertificateTemplate = (template = {}) => {
  const fallback = createCertificateTemplate();
  const legacyMap = { studentName: "studentName", academyName: "academyName", issueDate: "issueDate" };
  const hasStructuredLayout = Boolean(template.layoutJson?.schemaVersion);
  const legacyFields = (template.fields || []).map((key) => legacyMap[key] || key);
  const savedFields = hasStructuredLayout
    ? template.layoutJson.fields || fallback.fields
    : [...new Set([...fallback.fields, ...legacyFields])];
  return {
    ...fallback,
    ...template,
    fields: savedFields.map((key) => legacyMap[key] || key),
    layoutJson: {
      ...fallback.layoutJson,
      ...(template.layoutJson || {}),
      fields: savedFields,
      content: { ...fallback.layoutJson.content, ...(template.layoutJson?.content || {}) },
      brand: { ...fallback.layoutJson.brand, ...(template.layoutJson?.brand || {}) },
      signatures: template.layoutJson?.signatures?.length ? template.layoutJson.signatures : fallback.layoutJson.signatures,
      security: { ...fallback.layoutJson.security, ...(template.layoutJson?.security || {}) },
      print: { ...fallback.layoutJson.print, ...(template.layoutJson?.print || {}) },
    },
  };
};

export const SAMPLE_CERTIFICATE = {
  certificateNumber: "KHA-2026-000123",
  certificateType: "belt",
  issueDate: "2026-08-20",
  status: "issued",
  qrCodeData: "https://khiladi.app/verify/certificate/demo",
  student: { name: "Aarav Sharma", admissionNumber: "KAM-STU-0418", beltRank: "Red", danRank: "1st Kup" },
  academy: { academyName: "KHILADI ACADEMY", ownerName: "Academy Director" },
  sourceSnapshot: { kind: "belt_test", promotedToBelt: "Red", promotedToDanRank: "1st Kup", examinerName: "Chief Instructor" },
};
