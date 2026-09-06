import { whatsappPhone } from "../attendance/whatsappReminder.js";

export const studentName = (student) =>
  [student?.firstName, student?.lastName].filter(Boolean).join(" ").trim() ||
  student?.name ||
  "Student";

export const formatMessageDate = (value) => {
  if (!value) return "";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
};

export const addDays = (value, days) => {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  date.setDate(date.getDate() + Number(days || 1) - 1);
  return date.toISOString().slice(0, 10);
};

export const todayISO = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const announcementTemplates = {
  holiday: "Hello {name},\n\nOur martial arts classes will remain closed from {from} to {to} for {reason}. This is a {days}-day holiday. Classes will resume on {resume}.\n\n— {academy}",
  belt: "Hello {name},\n\nBelt Test update:\nDate: {date}\nVenue: {venue}\nReporting Time: {time}\nRequirements: {requirements}\n\nPlease be on time and come prepared.\n\n— {academy}",
  championship: "Hello {name},\n\nChampionship update:\nEvent: {event}\nDate: {date}\nVenue: {venue}\nReporting Time: {time}\nConfirmation Deadline: {deadline}\n\nPlease confirm participation with the academy.\n\n— {academy}",
  sickness: "Hello {name},\n\nHealth / class update:\nClasses are {status} from {from} to {to}.\nReason / Note: {details}\n\nWe request everyone to follow the academy's health guidance.\n\n— {academy}",
  custom: "Hello {name},\n\n{body}\n\n— {academy}",
};

export const buildStudentMessage = (template, values, academyName) =>
  template.replace(/\{(\w+)\}/g, (_, key) =>
    key === "academy" ? academyName || "Academy" : values[key] ?? ""
  );

export function buildCampaign(students, selected, template, settings) {
  if (!template.trim()) throw new Error("Enter a message first.");
  const groups = new Map();
  const invalid = [];

  for (const student of students.filter((item) => selected.has(String(item._id)))) {
    let phone;
    try {
      phone = whatsappPhone(
        student.phone,
        student.countryCode || settings.countryCode,
      );
    } catch {
      invalid.push({ id: student._id, name: studentName(student) });
      continue;
    }
    if (!groups.has(phone)) groups.set(phone, []);
    groups.get(phone).push(studentName(student));
  }

  const recipients = [...groups].map(([phone, names]) => {
    const message = template.replace(/\{name\}/g, names.join(", "));
    if (message.length > 3500) {
      throw new Error("Message too long; keep each personalised message under 3500 characters.");
    }
    return {
      phone,
      names,
      message,
      url: `https://wa.me/${phone}?text=${encodeURIComponent(message)}`,
    };
  });

  return { recipients, invalid };
}
