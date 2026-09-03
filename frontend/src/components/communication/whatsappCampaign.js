import { whatsappPhone } from "../attendance/whatsappReminder.js";

export const studentName = student => [student.firstName, student.lastName].filter(Boolean).join(" ").trim() || student.name || "Student";
export const announcementTemplates = {
  holiday: "Hello {name},\n\nMartial Arts classes will be closed on [holiday dates] for [reason]. Classes resume on [date / time].\n\n— {academy}",
  championship: "Hello {name},\n\nChampionship: [event name]\nDate: [date]\nVenue: [venue]\nReporting time: [time]\nPlease confirm your participation by [deadline].\n\n— {academy}",
  belt: "Hello {name},\n\nBelt Test: [date]\nVenue: [venue]\nReporting time: [time]\nPlease bring [requirements].\n\n— {academy}",
  custom: "Hello {name},\n\n[Your message]\n\n— {academy}",
};

// One chat per phone. Siblings are named together, never silently discarded.
export function buildCampaign(students, selected, template, settings) {
  if (!template.trim()) throw new Error("Enter a message first.");
  if (/\[[^\]]+\]/.test(template)) throw new Error("Replace all [placeholder details] before reviewing.");
  const groups = new Map(), invalid = [];
  for (const student of students.filter(item => selected.has(String(item._id)))) {
    let phone;
    try { phone = whatsappPhone(student.phone, student.countryCode || settings.countryCode); }
    catch { invalid.push({id:student._id, name:studentName(student)}); continue; }
    if (!groups.has(phone)) groups.set(phone, []);
    groups.get(phone).push(studentName(student));
  }
  const recipients = [...groups].map(([phone, names]) => {
    const message = template.replace(/\{(name|academy)\}/g, (_, key) => key === "name" ? names.join(", ") : settings.academyName || "Academy");
    if (message.length > 3500) throw new Error("Message too long; keep each personalised message under 3500 characters.");
    return {phone, names, message, url:`https://wa.me/${phone}?text=${encodeURIComponent(message)}`};
  });
  return {recipients, invalid};
}
