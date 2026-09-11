import { useEffect, useMemo, useState } from "react";
import { Building2, CheckCircle2, Eye, EyeOff, Globe2, Layers3, MapPin, Save, ShieldCheck, Sparkles } from "lucide-react";
import publicAcademyApi from "../../api/publicAcademyApi.js";
import "./PublicAcademies.css";
import "./PublicProfileVisibility.css";

const csv = (value) => (value || []).join(", ");
const sectionOptions = [
  ["academyOverview", "Academy overview", "Name, about, martial arts and highlights"],
  ["academyContact", "Academy location & contact", "Address and enabled contact methods"],
  ["socialLinks", "Social links", "Website, Instagram, Facebook and YouTube"],
  ["affiliations", "Affiliations", "Recognitions and registrations"],
  ["branches", "Branch profiles", "Active public branches"],
  ["branchContact", "Branch contact", "Public branch phone and email"],
  ["branchFacilities", "Branch facilities", "Facilities and languages"],
  ["branchCoaches", "Branch coaches", "Names, roles and achievements only"],
  ["batches", "Batch profiles", "Active batches and training details"],
  ["batchCoaches", "Batch coaches", "Names, roles and achievements only"],
  ["batchSchedule", "Batch schedules", "Days and class timings"],
];

export default function ManagePublicAcademyProfile() {
  const [profile, setProfile] = useState(null); const [busy, setBusy] = useState(false); const [message, setMessage] = useState(""); const [error, setError] = useState("");
  useEffect(() => { publicAcademyApi.mine().then((response) => setProfile(response.data?.data?.profile)).catch((requestError) => setError(requestError.response?.data?.message || "Profile could not be loaded")); }, []);
  const hiddenBranches = useMemo(() => new Set((profile?.hiddenBranchIds || []).map(String)), [profile?.hiddenBranchIds]);
  const hiddenBatches = useMemo(() => new Set((profile?.hiddenBatchIds || []).map(String)), [profile?.hiddenBatchIds]);
  const set = (key, value) => setProfile((current) => ({ ...current, [key]: value }));
  const nested = (key, name, value) => setProfile((current) => ({ ...current, [key]: { ...current[key], [name]: value } }));
  const toggleId = (key, id) => setProfile((current) => { const values = new Set((current[key] || []).map(String)); values.has(String(id)) ? values.delete(String(id)) : values.add(String(id)); return { ...current, [key]: [...values] }; });
  const payload = () => ({ ...profile, martialArts: profile.martialArtsText?.split(",").map((item) => item.trim()).filter(Boolean) || profile.martialArts, highlights: profile.highlightsText?.split(",").map((item) => item.trim()).filter(Boolean) || profile.highlights, facilities: profile.facilitiesText?.split(",").map((item) => item.trim()).filter(Boolean) || profile.facilities, languages: profile.languagesText?.split(",").map((item) => item.trim()).filter(Boolean) || profile.languages });
  const run = async (action) => { setBusy(true); setError(""); setMessage(""); try { let response; if (action === "save") response = await publicAcademyApi.save(payload()); else { await publicAcademyApi.save(payload()); response = action === "publish" ? await publicAcademyApi.publish() : await publicAcademyApi.unpublish(); } setProfile(response.data?.data?.profile); setMessage(response.data?.message || "Done"); } catch (requestError) { setError(requestError.response?.data?.message || "Request failed"); } finally { setBusy(false); } };
  if (!profile) return <div className="pa-wrap pa-form">{error ? <div className="pa-error">{error}</div> : "Loading public profile…"}</div>;

  const visibleSections = sectionOptions.filter(([key]) => profile.visibility?.[key] !== false).length;
  const visibleBranches = (profile.availableBranches || []).filter((branch) => branch.isActive && !hiddenBranches.has(String(branch._id))).length;
  const visibleBatches = (profile.availableBatches || []).filter((batch) => batch.isActive && !hiddenBatches.has(String(batch._id))).length;

  return <div className="pa-wrap pa-form pa-manager">
    <header className="pa-manager-hero">
      <div className="pa-manager-hero__icon"><Globe2 size={28}/></div>
      <div className="pa-manager-hero__copy"><span>ACADEMY DISCOVERY</span><h1>Public Profile</h1><p>Control how your academy appears to prospective students and parents.</p></div>
      <div className={`pa-manager-status ${profile.status === "published" ? "is-published" : "is-draft"}`}>{profile.status === "published" ? <CheckCircle2 size={16}/> : <EyeOff size={16}/>} {profile.status === "published" ? "Published" : "Draft"}</div>
      {profile.status === "published" && <a className="pa-manager-live" target="_blank" rel="noreferrer" href={`/academies/${profile.slug}`}><Eye size={16}/> View live profile</a>}
    </header>
    <section className="pa-manager-metrics">
      <div><span><Sparkles size={18}/></span><strong>{visibleSections}/{sectionOptions.length}</strong><small>Visible sections</small></div>
      <div><span><Building2 size={18}/></span><strong>{visibleBranches}</strong><small>Public branches</small></div>
      <div><span><Layers3 size={18}/></span><strong>{visibleBatches}</strong><small>Public batches</small></div>
      <div><span><ShieldCheck size={18}/></span><strong>Protected</strong><small>Private records</small></div>
    </section>
    {error && <div className="pa-error">{error}</div>}{message && <div className="pa-success">{message}</div>}
    <div className="pa-sync-note"><strong>Always up to date</strong><span>Academy, branch and batch information is securely loaded from your existing records. Update those profiles once and the public profile updates automatically.</span></div>
    <section className="pa-panel"><div className="pa-section-head"><div><span className="pa-eyebrow">Visibility</span><h2>Choose what your audience can see</h2><p>All safe sections are visible by default. Internal operations and financial/student records are never exposed.</p></div></div><div className="pa-visibility-grid">{sectionOptions.map(([key, title, description]) => <label className="pa-visibility-card" key={key}><span><strong>{title}</strong><small>{description}</small></span><input type="checkbox" checked={profile.visibility?.[key] !== false} onChange={(event) => nested("visibility", key, event.target.checked)} /></label>)}</div></section>
    <section className="pa-panel"><div className="pa-section-head"><div><span className="pa-eyebrow">Branches</span><h2>Public branch profiles</h2><p>Inactive branches stay private. Turn off any active branch you do not want listed.</p></div></div><div className="pa-record-list">{profile.availableBranches?.map((branch) => <label key={branch._id} className="pa-record-row"><span className="pa-record-icon"><Building2 size={19}/></span><span className="pa-record-copy"><strong>{branch.branchName}</strong><small><MapPin size={13}/>{[branch.city, branch.state].filter(Boolean).join(", ") || "Location not added"}{branch.isMainBranch ? " · Main branch" : ""}</small></span><em className={branch.isActive ? "is-active" : ""}>{branch.isActive ? "Active" : "Inactive"}</em><input type="checkbox" disabled={!branch.isActive} checked={branch.isActive && !hiddenBranches.has(String(branch._id))} onChange={() => toggleId("hiddenBranchIds", branch._id)} /></label>)}{!profile.availableBranches?.length && <p>No branches created yet.</p>}</div></section>
    <section className="pa-panel"><div className="pa-section-head"><div><span className="pa-eyebrow">Batches</span><h2>Public batch profiles</h2><p>Student lists, fees, attendance and internal batch notes are always excluded.</p></div></div><div className="pa-record-list">{profile.availableBatches?.map((batch) => <label key={batch._id} className="pa-record-row"><span className="pa-record-icon"><Layers3 size={19}/></span><span className="pa-record-copy"><strong>{batch.batchName}</strong><small>{batch.branch?.branchName || "Academy level"} · {(batch.martialArts?.length ? batch.martialArts : [batch.martialArt]).filter(Boolean).join(", ") || "Program not added"}</small></span><em className={batch.isActive ? "is-active" : ""}>{batch.isActive ? "Active" : "Inactive"}</em><input type="checkbox" disabled={!batch.isActive} checked={batch.isActive && !hiddenBatches.has(String(batch._id))} onChange={() => toggleId("hiddenBatchIds", batch._id)} /></label>)}{!profile.availableBatches?.length && <p>No batches created yet.</p>}</div></section>
    <section className="pa-panel pa-formgrid"><div className="pa-field"><label>Public URL slug</label><input className="pa-input" value={profile.slug || ""} onChange={(event) => set("slug", event.target.value)} /></div><div className="pa-field"><label>Tagline</label><input className="pa-input" value={profile.tagline || ""} onChange={(event) => set("tagline", event.target.value)} /></div>{[["highlightsText", "Highlights", profile.highlights], ["facilitiesText", "Additional academy facilities", profile.facilities], ["languagesText", "Additional academy languages", profile.languages]].map(([key, label, value]) => <div className="pa-field" key={key}><label>{label} (comma separated)</label><input className="pa-input" value={profile[key] ?? csv(value)} onChange={(event) => set(key, event.target.value)} /></div>)}<div className="pa-checks pa-span"><label><input type="checkbox" checked={!!profile.contact?.showPhone} onChange={(event) => nested("contact", "showPhone", event.target.checked)} /> Show academy phone</label><label><input type="checkbox" checked={!!profile.contact?.showEmail} onChange={(event) => nested("contact", "showEmail", event.target.checked)} /> Show academy email</label><label><input type="checkbox" checked={!!profile.trialAvailable} onChange={(event) => set("trialAvailable", event.target.checked)} /> Trial available</label><label><input type="checkbox" checked={!!profile.onlineTraining} onChange={(event) => set("onlineTraining", event.target.checked)} /> Online training</label></div></section>
    <div className="pa-actions pa-sticky-actions"><span>{busy ? "Saving changes…" : "Your audience sees only the information enabled above."}</span><button disabled={busy} className="pa-button pa-secondary" onClick={() => run("save")}><Save size={16}/> Save preferences</button>{profile.status === "published" ? <button disabled={busy} className="pa-button" onClick={() => run("unpublish")}><EyeOff size={16}/> Unpublish</button> : <button disabled={busy} className="pa-button" onClick={() => run("publish")}><Globe2 size={16}/> Publish academy</button>}</div>
  </div>;
}
