import React, { useState } from "react";
import { validateReminderSettings, defaultReminderSettings } from "./whatsappReminder.js";

export default function WhatsAppReminderSettings({ value, onSave }) {
  const [draft, setDraft] = useState(value);
  const [notice, setNotice] = useState("");
  return <details style={{padding:12,borderBottom:"1px solid #e2e8f0"}} className="whatsapp-reminder-settings">
    <style>{'@media print { .whatsapp-reminder-settings { display: none !important; } }'}</style>
    <summary style={{cursor:"pointer",fontWeight:600}}>WhatsApp reminder settings</summary>
    <p>Saved on this browser only. DUE opens WhatsApp; press Send there. QR is a link, not an image attachment.</p>
    <form onSubmit={e => {e.preventDefault(); try {validateReminderSettings(draft); onSave(draft); setNotice("Settings saved.");} catch(error) {setNotice(error.message);} }} style={{display:"grid",gap:10,maxWidth:650}}>
      {[['academyName','Academy name'],['countryCode','Default country code (India: 91)'],['qrUrl','Public HTTPS payment QR link (optional)'],['upiId','UPI ID (optional)']].map(([key,label]) => <label key={key}>{label}<input style={{display:"block",width:"100%"}} maxLength={key === 'qrUrl' ? 1200 : 150} value={draft[key]} onChange={e=>setDraft({...draft,[key]:e.target.value})}/></label>)}
      <label>Custom message<textarea style={{display:"block",width:"100%"}} rows={4} maxLength={1800} value={draft.template} onChange={e=>setDraft({...draft,template:e.target.value})}/></label>
      <small>Placeholders: {'{name}, {lastPaid}, {dueDate}, {period}, {status}, {months}, {academy}'}. QR link and UPI ID are appended automatically. Verify that the link opens without login and points to your payment QR.</small>
      <button type="button" onClick={()=>setDraft({...draft,template:defaultReminderSettings.template})}>Use friendly reminder format</button>
      <button type="submit">Save reminder settings</button><span role="status">{notice}</span>
    </form>
  </details>;
}
