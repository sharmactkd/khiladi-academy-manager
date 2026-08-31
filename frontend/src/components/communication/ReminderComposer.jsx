import { BellRing, CalendarDays, CircleDollarSign as IndianRupee, Send } from "lucide-react";
import DateInput from "../common/DateInput.jsx";
import { useState } from "react";

const channels = [{ id: "internal", label: "In-app" }, { id: "email", label: "Email" }, { id: "whatsapp", label: "WhatsApp" }];
const initial = { attendance: { date: new Date().toISOString().slice(0, 10), batch: "", channels: ["internal"], message: "" }, fee: { channels: ["internal"], message: "" } };

const ReminderComposer = ({ batches, canManageFees, initialType = "attendance", onAttendance, onFee, styles }) => {
  const [type, setType] = useState(initialType === "fee" && canManageFees ? "fee" : "attendance"); const [forms, setForms] = useState(initial); const [sending, setSending] = useState(false); const [result, setResult] = useState(null); const [error, setError] = useState("");
  const form = forms[type]; const set = (key, value) => setForms((current) => ({ ...current, [type]: { ...current[type], [key]: value } }));
  const toggleChannel = (id) => set("channels", form.channels.includes(id) ? form.channels.filter((item) => item !== id) : [...form.channels, id]);
  const submit = async (event) => { event.preventDefault(); setSending(true); setError(""); setResult(null); try { const response = type === "attendance" ? await onAttendance(form) : await onFee(form); setResult(response.data?.data || {}); } catch (err) { setError(err.response?.data?.message || "Reminder could not be sent."); } finally { setSending(false); } };
  return <section className={styles.panel}><header><div><small>Unified reminder desk</small><h2>Send Reminders</h2><p>Reach eligible guardians through verified communication channels.</p></div></header><div className={styles.typeTabs}><button type="button" className={type === "attendance" ? styles.selectedType : ""} onClick={() => { setType("attendance"); setResult(null); }}><CalendarDays size={17}/>Attendance</button>{canManageFees ? <button type="button" className={type === "fee" ? styles.selectedType : ""} onClick={() => { setType("fee"); setResult(null); }}><IndianRupee size={17}/>Fee</button> : null}</div><form className={styles.composer} onSubmit={submit}>
    <div className={styles.step}><b>01</b><div><h3>Audience rules</h3><p>{type === "attendance" ? "Guardians of students marked absent on the selected date." : "Guardians of students with pending, partial or overdue fees."}</p></div></div>
    {type === "attendance" ? <div className={styles.formGrid}><label><span>Attendance date *</span><DateInput value={form.date} onChange={(e) => set("date", e.target.value)} required/></label><label><span>Batch</span><select value={form.batch} onChange={(e) => set("batch", e.target.value)}><option value="">All batches</option>{batches.map((batch) => <option key={batch._id} value={batch._id}>{batch.batchName}</option>)}</select></label></div> : <div className={styles.audienceNotice}><BellRing size={18}/><span>All eligible unpaid fee records will be processed. Guardians without fee permission are safely excluded.</span></div>}
    <div className={styles.step}><b>02</b><div><h3>Delivery channels</h3><p>Select one or more channels. In-app is recommended.</p></div></div><div className={`${styles.channelTags} ui-choice-group`}>{channels.map((channel) => { const selected = form.channels.includes(channel.id); return <button type="button" key={channel.id} className={`ui-choice ui-choice--chip ${selected ? `${styles.selectedTag} is-selected` : ""}`} aria-pressed={selected} onClick={() => toggleChannel(channel.id)}>{channel.label}</button>; })}</div>
    <label className={styles.messageField}><span>Custom message <small>Optional</small></span><textarea value={form.message} maxLength={1000} onChange={(e) => set("message", e.target.value)} placeholder="Leave empty to use the secure system template..."/><i>{form.message.length}/1000</i></label>
    {error ? <div className={styles.error}>{error}</div> : null}{result ? <div className={styles.success}>Processed successfully · {result.logsCount || 0} messages logged.</div> : null}
    <footer><span>Only guardians with active links and matching permissions receive messages.</span><button type="submit" disabled={sending || !form.channels.length}><Send size={16}/>{sending ? "Processing..." : "Review & Send"}</button></footer>
  </form></section>;
};

export default ReminderComposer;
