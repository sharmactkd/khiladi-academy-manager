export const defaultReminderSettings = {
  academyName: "Academy", countryCode: "91", qrUrl: "", upiId: "",
  template: "This is a friendly reminder for Martial Arts class fee\n\nLast Paid - {lastPaid}\nDue Date - {dueDate}\n\n{period}",
};

export function reminderDate(value) {
  const raw = String(value || "").trim();
  let y, m, d, match;
  if ((match = raw.match(/^(\d{4})-(\d{2})-(\d{2})(?:T.*)?$/))) [, y,m,d] = match;
  else if ((match = raw.match(/^(\d{1,2})-(\d{1,2})-(\d{2}|\d{4})$/))) [, d,m,y] = match;
  else if ((match = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2}|\d{4})$/))) [, m,d,y] = match;
  else return null;
  if (String(y).length === 2) y = `20${y}`;
  const date = new Date(Date.UTC(+y,+m-1,+d));
  return date.getUTCFullYear() === +y && date.getUTCMonth() === +m-1 && date.getUTCDate() === +d ? date : null;
}
const dateLabel = (date, year = true) => date ? new Intl.DateTimeFormat("en-GB", {day:"numeric",month:"long",...(year ? {year:"numeric"} : {}),timeZone:"UTC"}).format(date) : "Not set";
export function reminderPeriod(date) {
  if (!date) return "";
  const lastDay = new Date(Date.UTC(date.getUTCFullYear(),date.getUTCMonth()+2,0)).getUTCDate();
  const end = new Date(Date.UTC(date.getUTCFullYear(),date.getUTCMonth()+1,Math.min(date.getUTCDate(),lastDay)-1));
  const showYear = date.getUTCFullYear() !== end.getUTCFullYear();
  return `(From ${dateLabel(date,showYear)} to ${dateLabel(end,showYear)})`;
}
export function normalizeReminderSettings(saved = {}) {
  const value = {...defaultReminderSettings,...saved};
  const oldDefault = "Namaste, {name} ki academy fee pending hai. Due date: {dueDate}. Fee status: {status}. Kripya suvidha anusaar payment karein. Agar payment ho chuki hai toh details share karein.\n— {academy}";
  if (!saved.template || saved.template === oldDefault) value.template = defaultReminderSettings.template;
  return value;
}
export const desktopReminderUrl = webUrl => {
  const parsed = new URL(webUrl);
  return `whatsapp://send?phone=${parsed.pathname.slice(1)}&text=${encodeURIComponent(parsed.searchParams.get("text") || "")}`;
};

export function whatsappPhone(value, countryCode = "91") {
  const raw = String(value || "").trim();
  if (!raw || !/^[+\d\s()-]+$/.test(raw)) throw new Error("Student ka valid WhatsApp phone number add karein.");
  const code = String(countryCode || "").replace(/^\+/, "");
  if (!/^[1-9]\d{0,2}$/.test(code)) throw new Error("Valid country code set karein.");
  let digits = raw.replace(/\D/g, "");
  if (raw.startsWith("+")) { /* Explicit international number. */ }
  else if (raw.startsWith("00")) digits = digits.slice(2);
  else if (code === "91" && digits.length === 12 && digits.startsWith("91")) { /* Already prefixed. */ }
  else {
    if (code !== "91") throw new Error("International number ko +country-code ke saath save karein.");
    digits = digits.replace(/^0/, "");
    if (!/^[6-9]\d{9}$/.test(digits)) throw new Error("Valid 10-digit Indian mobile number required.");
    digits = code + digits;
  }
  if (!/^[1-9]\d{7,14}$/.test(digits)) throw new Error("Phone number invalid hai.");
  return digits;
}

export function validateReminderSettings(settings) {
  if (!String(settings.template || "").trim()) throw new Error("Message template required.");
  if (settings.qrUrl) {
    let url;
    try { url = new URL(settings.qrUrl); } catch { throw new Error("QR ke liye valid public HTTPS link dein."); }
    if (url.protocol !== "https:" || url.username || url.password || /^(localhost|127\.|\[::1\])/.test(url.hostname)) throw new Error("QR ke liye public HTTPS link dein, local file nahi.");
  }
}

export function buildWhatsAppReminder(row, status, settings, displayedDates = {}) {
  validateReminderSettings(settings);
  const phone = whatsappPhone(row.contact || row.importedPhone, row.contactCountryCode || settings.countryCode);
  // The caller supplies the exact calendar labels rendered by the table.
  // Do not re-slice a UTC timestamp: local midnight in India is the previous UTC day.
  const due = row.membership?.remainingTrainingDays > 0 ? null : reminderDate(displayedDates.dueDate ?? row.membership?.effectiveDueDate ?? row.importedDueDate ?? row.feeDueDate);
  const paidValue = displayedDates.paidDate ?? (row.rowType === "student" && row.studentId ? row.feePaidDate || row.paidDate || row.importedPaidDate : row.importedPaidDate || row.paidDate || row.feePaidDate);
  const values = {
    name: row.name || row.importedName || "Student", academy: settings.academyName || "Academy", status,
    dueDate: dateLabel(due), lastPaid: dateLabel(reminderDate(paidValue)), period: reminderPeriod(due),
    months: String(row.membership?.unpaidMonths || ""),
  };
  let message = settings.template.replace(/\{(name|academy|status|dueDate|months|lastPaid|period)\}/g, (_, key) => values[key]).trim();
  if (settings.qrUrl) message += `\nPayment QR: ${settings.qrUrl}`;
  if (settings.upiId) message += `\nUPI ID: ${settings.upiId}`;
  if (message.length > 3500) throw new Error("Message bahut lamba hai; template short karein.");
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}
