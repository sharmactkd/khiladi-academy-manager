import { useEffect, useState } from "react";
import { normalizeReminderSettings } from "../attendance/whatsappReminder.js";

export const whatsappSettingsKey = user => `fee-whatsapp:${user?.academy?._id || user?.academy || "academy"}:${user?._id || "user"}`;
const read = key => {
  try { return normalizeReminderSettings(JSON.parse(localStorage.getItem(key) || "{}")); }
  catch { return normalizeReminderSettings(); }
};
export default function useWhatsAppSettings(user) {
  const key = whatsappSettingsKey(user);
  const [stored, setStored] = useState(() => ({key, value:read(key)}));
  useEffect(() => {
    const refresh = () => setStored({key, value:read(key)});
    refresh();
    window.addEventListener("storage", refresh);
    window.addEventListener("whatsapp-settings-changed", refresh);
    window.addEventListener("focus", refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("whatsapp-settings-changed", refresh);
      window.removeEventListener("focus", refresh);
    };
  }, [key]);
  const save = value => {
    localStorage.setItem(key, JSON.stringify(value));
    setStored({key, value});
    window.dispatchEvent(new Event("whatsapp-settings-changed"));
  };
  return {key, value:stored.key === key ? stored.value : read(key), save};
}
