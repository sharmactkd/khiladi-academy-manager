export function validateGroupLink(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  let url;
  try { url = new URL(raw); } catch { throw new Error("Enter a valid WhatsApp group invite link."); }
  if (url.protocol !== "https:" || url.hostname !== "chat.whatsapp.com" || url.port || url.username || url.password || !/^\/[A-Za-z0-9]+\/?$/.test(url.pathname)) {
    throw new Error("Only https://chat.whatsapp.com/... group invite links are allowed.");
  }
  return url.href;
}
export function groupAnnouncement(template, academy, group) {
  if (!template.trim() || /\[[^\]]+\]/.test(template)) throw new Error("Write the announcement and replace all [details] first.");
  if (/\{(?:lastPaid|dueDate|period|status|months)\}/i.test(template)) throw new Error("Fee reminder fields cannot be used in group announcements.");
  const message = template.replace(/\{(name|academy|group)\}/g, (_, key) => ({name:"everyone",academy:academy || "Academy",group})[key]);
  if(message.length>3500) throw new Error("Please shorten the announcement to 3500 characters.");
  return message;
}
