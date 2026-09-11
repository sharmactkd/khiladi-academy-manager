import { useEffect, useMemo, useState } from "react";
import { AlertCircle, Building2, CalendarDays, CheckCircle2, Dumbbell, Mail, MessageCircle, Phone, Send, ShieldCheck, Sparkles, UserRound } from "lucide-react";
import publicAcademyApi from "../../api/publicAcademyApi.js";
import "./AcademyEnquiryForm.css";

const initial = { name: "", phone: "", email: "", studentAge: "", martialArt: "", branchName: "", preferredDate: "", requestType: "trial_class", message: "", consentToContact: false, website: "" };
const Field = ({ icon: Icon, label, required = false, children }) => <div className="pa-enquiry-field"><label>{Icon && <Icon size={15} />}{label}{required && <sup>*</sup>}</label>{children}</div>;

export default function AcademyEnquiryForm({ profile, selectedBranch = null, selectedBatch = null, mode = "question" }) {
  const [form, setForm] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const isTrial = mode === "trial";
  const minDate = useMemo(() => new Date().toISOString().slice(0, 10), []);

  useEffect(() => setForm((current) => ({ ...current, branchName: selectedBranch?.name || current.branchName, requestType: isTrial ? "trial_class" : "general" })), [isTrial, selectedBranch?.name]);
  const change = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.type === "checkbox" ? event.target.checked : event.target.value }));
  const submit = async (event) => {
    event.preventDefault(); setBusy(true); setError(""); setSuccess("");
    try {
      const response = await publicAcademyApi.enquire(profile.slug, form);
      setSuccess(response.data?.message || "Enquiry sent successfully");
      setForm({ ...initial, branchName: selectedBranch?.name || "", requestType: isTrial ? "trial_class" : "general" });
    } catch (requestError) { setError(requestError.response?.data?.message || "Enquiry could not be sent"); }
    finally { setBusy(false); }
  };

  return <form className={`pa-enquiry ${isTrial ? "is-trial" : "is-question"}`} onSubmit={submit}>
    <header className="pa-enquiry-header"><span className="pa-enquiry-header__icon">{isTrial ? <Sparkles size={25} /> : <MessageCircle size={25} />}</span><div><span className="pa-eyebrow">{isTrial ? "Trial Class Request" : "Academy Enquiry"}</span><h2>{isTrial ? "Book a Trial Class" : "Ask a Question"}</h2><p>{isTrial ? "Share your training preference. The academy team will contact you to confirm a suitable trial slot." : "Ask about admissions, batches, timings, facilities or anything else you would like to know."}</p></div></header>
    {(selectedBranch || selectedBatch) && <div className="pa-enquiry-context">{selectedBranch && <span><Building2 size={14} />Branch <strong>{selectedBranch.name}</strong></span>}{selectedBatch && <span><Dumbbell size={14} />Batch <strong>{selectedBatch.name}</strong></span>}</div>}
    {error && <div className="pa-enquiry-alert is-error" role="alert"><AlertCircle size={18} />{error}</div>}
    {success && <div className="pa-enquiry-alert is-success" role="status"><CheckCircle2 size={18} />{success}</div>}

    <section className="pa-enquiry-section"><div className="pa-enquiry-section__title"><span>01</span><div><strong>Your Details</strong><small>How the academy can reach you</small></div></div><div className="pa-enquiry-grid">
      <Field icon={UserRound} label="Full name" required><input className="pa-input" name="name" value={form.name} onChange={change} minLength="2" maxLength="100" required autoComplete="name" placeholder="Enter your full name" /></Field>
      <Field icon={Phone} label="Phone number" required><input className="pa-input" name="phone" value={form.phone} onChange={change} inputMode="tel" minLength="10" maxLength="20" required autoComplete="tel" placeholder="Enter contact number" /></Field>
      <Field icon={Mail} label="Email address"><input className="pa-input" type="email" name="email" value={form.email} onChange={change} autoComplete="email" placeholder="you@example.com" /></Field>
      <Field icon={UserRound} label="Student age"><input className="pa-input" type="number" name="studentAge" value={form.studentAge} onChange={change} min="3" max="100" placeholder="Age in years" /></Field>
    </div></section>

    <section className="pa-enquiry-section"><div className="pa-enquiry-section__title"><span>02</span><div><strong>Training Preference</strong><small>Help the academy guide you correctly</small></div></div><div className="pa-enquiry-grid">
      <Field icon={Dumbbell} label="Sport / Martial art"><select className="pa-select" name="martialArt" value={form.martialArt} onChange={change}><option value="">Select program</option>{profile.martialArts?.map((item) => <option key={item}>{item}</option>)}</select></Field>
      <Field icon={Building2} label="Preferred branch"><select className="pa-select" name="branchName" value={form.branchName} onChange={change}><option value="">Any branch</option>{profile.branches?.map((branch) => <option key={branch.name}>{branch.name}</option>)}</select></Field>
      <Field icon={MessageCircle} label="Request type"><select className="pa-select" name="requestType" value={form.requestType} onChange={change}><option value="general">Question / General enquiry</option><option value="trial_class">Trial class</option><option value="admission">Admission</option></select></Field>
      <Field icon={CalendarDays} label="Preferred date"><input className="pa-input" type="date" name="preferredDate" value={form.preferredDate} min={minDate} onChange={change} /></Field>
    </div></section>

    <section className="pa-enquiry-section"><div className="pa-enquiry-section__title"><span>03</span><div><strong>{isTrial ? "Trial Requirements" : "Your Question"}</strong><small>Provide any details the academy should know</small></div></div><div className="pa-enquiry-message"><Field icon={MessageCircle} label={isTrial ? "Message or special requirements" : "Question or message"} required><textarea className="pa-textarea" name="message" value={form.message} onChange={change} rows="4" maxLength="600" required placeholder={isTrial ? "Tell us about preferred timing, experience or any special requirement…" : "Type your question here…"} /><small className="pa-enquiry-count">{form.message.length}/600</small></Field></div></section>

    <input className="pa-honeypot" name="website" value={form.website} onChange={change} tabIndex="-1" autoComplete="off" aria-hidden="true" />
    <footer className="pa-enquiry-footer"><label className="pa-consent"><input type="checkbox" name="consentToContact" checked={form.consentToContact} onChange={change} required /><span><ShieldCheck size={17} />I agree that this academy may contact me regarding this request. <b>*</b></span></label><button className="pa-enquiry-submit" type="submit" disabled={busy}>{busy ? <><span className="pa-enquiry-spinner" />Sending…</> : <>{isTrial ? <Sparkles size={18} /> : <Send size={18} />}{isTrial ? "Request Trial Class" : "Send Question"}</>}</button></footer>
  </form>;
}
