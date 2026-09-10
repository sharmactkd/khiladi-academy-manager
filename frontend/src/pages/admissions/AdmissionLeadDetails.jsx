import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import admissionEnquiryApi from "../../api/admissionEnquiryApi.js";
import "./AdmissionLeadDetails.css";

const templates = {
  welcome: (name) => `Hello ${name}, thank you for contacting our academy. Please let us know a convenient time to discuss your training requirements.`,
  trial: (name) => `Hello ${name}, your trial class request is received. We look forward to welcoming you. Please reply to confirm your availability.`,
  reminder: (name) => `Hello ${name}, this is a friendly reminder about your upcoming trial class. Please contact us if you need any assistance.`,
  followup: (name) => `Hello ${name}, we hope you enjoyed your trial class. We would be happy to help you complete the admission process.`,
};
const labels = { created: "Enquiry received", status_changed: "Status changed", follow_up_set: "Follow-up scheduled", trial_scheduled: "Trial scheduled", converted: "Converted to student", note_updated: "Private note updated", communication_sent: "Communication logged" };
const whatsappNumber = (value) => { const digits = String(value || "").replace(/\D/g, ""); return digits.length === 10 ? `91${digits}` : digits; };

export default function AdmissionLeadDetails() {
  const { id } = useParams(); const [item, setItem] = useState(null), [error, setError] = useState(""), [template, setTemplate] = useState("welcome"), [message, setMessage] = useState("");
  useEffect(() => { admissionEnquiryApi.get(id).then((response) => { const lead = response.data?.data?.item; setItem(lead); setMessage(templates.welcome(lead.name)); }).catch((requestError) => setError(requestError.response?.data?.message || "Lead not found")); }, [id]);
  const activity = useMemo(() => [...(item?.activity || [])].reverse(), [item?.activity]);
  const choose = (value) => { setTemplate(value); setMessage(templates[value](item.name)); };
  const sendWhatsApp = async () => { const url = `https://wa.me/${whatsappNumber(item.phone)}?text=${encodeURIComponent(message)}`; window.open(url, "_blank", "noopener,noreferrer"); try { const response = await admissionEnquiryApi.logCommunication(item._id, { channel: "whatsapp", template, message }); setItem(response.data?.data?.item); toast.success("WhatsApp follow-up logged"); } catch (requestError) { toast.error(requestError.response?.data?.message || "Communication log failed"); } };
  const logCall = async () => { window.location.href = `tel:${item.phone}`; try { const response = await admissionEnquiryApi.logCommunication(item._id, { channel: "phone", template: "manual_call", message: "Call initiated from Admissions CRM" }); setItem(response.data?.data?.item); } catch { toast.error("Call opened, but activity log failed"); } };
  if (error) return <div className="lead-state">{error}</div>; if (!item) return <div className="lead-state">Loading lead details…</div>;
  return <div className="lead-page"><header className="lead-head"><div><span>Admissions lead</span><h1>{item.name}</h1><p>{item.phone}{item.email ? ` · ${item.email}` : ""}</p></div><Link to="/admissions/enquiries">Back to enquiries</Link></header><div className="lead-layout"><section className="lead-panel"><h2>Communication workspace</h2><label>Message template<select value={template} onChange={(event) => choose(event.target.value)}><option value="welcome">Welcome</option><option value="trial">Trial confirmation</option><option value="reminder">Trial reminder</option><option value="followup">Post-trial follow-up</option></select></label><label>Message<textarea rows="7" maxLength="1200" value={message} onChange={(event) => setMessage(event.target.value)}/></label><div className="lead-actions"><button onClick={sendWhatsApp}>Open WhatsApp & log</button><button className="secondary" onClick={logCall}>Call & log</button></div><small>Messages are opened in WhatsApp for your confirmation. KHILADI does not send anything without your action.</small></section><aside className="lead-panel"><h2>Lead information</h2><dl><dt>Status</dt><dd>{item.status.replaceAll("_", " ")}</dd><dt>Priority</dt><dd>{item.priority}</dd><dt>Program</dt><dd>{item.martialArt || "Any"}</dd><dt>Branch</dt><dd>{item.branchName || "Any"}</dd><dt>Student age</dt><dd>{item.studentAge || "—"}</dd><dt>Request</dt><dd>{item.requestType.replaceAll("_", " ")}</dd></dl></aside></div><section className="lead-panel"><h2>Activity timeline</h2><div className="lead-timeline">{activity.length ? activity.map((entry, index) => <div key={`${entry.at}-${index}`}><i/><div><strong>{labels[entry.type] || entry.type}</strong>{entry.from || entry.to ? <p>{[entry.from, entry.to].filter(Boolean).join(" → ")}</p> : null}<time>{new Date(entry.at).toLocaleString("en-IN")}</time></div></div>) : <p>No activity recorded yet.</p>}</div></section></div>;
}
