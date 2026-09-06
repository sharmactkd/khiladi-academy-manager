import { Award, Building2, CalendarCheck2, CreditCard, FileBadge, GraduationCap, IdCard, Trophy } from "lucide-react";

export const REPORT_TYPES = [
  { id: "students", label: "Student Directory", shortLabel: "Students", description: "Identity, contact, training, belt and membership records.", icon: GraduationCap, tone: "red", statuses: [{ value: "active", label: "Active" }, { value: "inactive", label: "Inactive" }, { value: "left", label: "Left" }] },
  { id: "attendance", label: "Attendance Register", shortLabel: "Attendance", description: "Student-wise attendance markings across batches and dates.", icon: CalendarCheck2, tone: "blue", statuses: [{ value: "present", label: "Present" }, { value: "absent", label: "Absent" }, { value: "leave", label: "Leave" }, { value: "late", label: "Late" }] },
  { id: "fees", label: "Fee Statement", shortLabel: "Fees", description: "Collections, pending amounts, modes and receipt records.", icon: CreditCard, tone: "green", ownerOnly: true, statuses: [{ value: "paid", label: "Paid" }, { value: "partial", label: "Partial" }, { value: "pending", label: "Pending" }, { value: "overdue", label: "Overdue" }, { value: "cancelled", label: "Cancelled" }] },
  { id: "belt-tests", label: "Belt Promotion", shortLabel: "Belt Tests", description: "Assessment results and awarded belt progression.", icon: Award, tone: "purple", statuses: [{ value: "passed", label: "Passed" }, { value: "failed", label: "Failed" }, { value: "pending", label: "Pending" }] },
  { id: "championships", label: "Championship Results", shortLabel: "Championships", description: "Competition participation, categories and achievements.", icon: Trophy, tone: "amber" },
  { id: "certificates", label: "Certificate Register", shortLabel: "Certificates", description: "Issued certificates with student and verification details.", icon: FileBadge, tone: "blue" },
  { id: "id-cards", label: "ID Card Register", shortLabel: "ID Cards", description: "Generated identity cards and their current status.", icon: IdCard, tone: "purple" },
  { id: "branches", label: "Branch Directory", shortLabel: "Branches", description: "Branch contacts, managers, coaches and operational status.", icon: Building2, tone: "green", noDates: true, noBatch: true, statuses: [{ value: "active", label: "Active" }, { value: "inactive", label: "Inactive" }] },
];

export const DATE_PRESETS = [
  { id: "30d", label: "Last 30 Days" },
  { id: "90d", label: "Last 90 Days" },
  { id: "year", label: "This Year" },
  { id: "all", label: "All Time" },
];

export const getDateRange = (preset) => {
  if (preset === "all") return { fromDate: "", toDate: "" };
  const end = new Date();
  const start = new Date(end);
  if (preset === "30d") start.setDate(start.getDate() - 29);
  if (preset === "90d") start.setDate(start.getDate() - 89);
  if (preset === "year") start.setMonth(0, 1);
  const iso = (date) => date.toISOString().slice(0, 10);
  return { fromDate: iso(start), toDate: iso(end) };
};

export const humanizeKey = (value) => String(value || "").replace(/([a-z])([A-Z])/g, "$1 $2").replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
