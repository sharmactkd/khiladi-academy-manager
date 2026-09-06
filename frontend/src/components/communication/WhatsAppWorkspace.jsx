import { useEffect, useMemo, useState } from "react";
import studentApi from "../../api/studentApi.js";
import WhatsAppReminderSettings from "../attendance/WhatsAppReminderSettings.jsx";
import { desktopReminderUrl } from "../attendance/whatsappReminder.js";
import useWhatsAppSettings from "./useWhatsAppSettings.js";
import { buildCampaign, studentName } from "./whatsappCampaign.js";
import { Users, Building2, Layers, MessageCircle } from "lucide-react";
import AnnouncementComposer from "./AnnouncementComposer.jsx";
import { initialAnnouncement, generateAnnouncement } from "./announcementBuilder.js";
import styles from "./WhatsAppWorkspace.module.css";
import WhatsAppGroupAnnouncement from "./WhatsAppGroupAnnouncement.jsx";

export default function WhatsAppWorkspace({user,branches=[],batches=[]}) {
  const settings = useWhatsAppSettings(user);
  return <Workspace key={settings.key} settings={settings} branches={branches} batches={batches}/>;
}
function Workspace({settings,branches,batches}) {
  const [mode,setMode]=useState("individual");
  const [students,setStudents] = useState([]), [loading,setLoading] = useState(true), [error,setError] = useState("");
  const [retry,setRetry] = useState(0), [selected,setSelected] = useState(new Set());
  const [search,setSearch] = useState(""), [filter,setFilter] = useState("all");
  const [message,setMessage] = useState(()=>generateAnnouncement(initialAnnouncement()));
  const [composerValid,setComposerValid] = useState(true);
  const [announcementForm,setAnnouncementForm] = useState(initialAnnouncement);
  const [review,setReview] = useState(null), [opened,setOpened] = useState(new Set()), [done,setDone] = useState(new Set());
  useEffect(() => {
    let cancelled=false;
    const load=async()=>{
      setLoading(true); setError(""); setStudents([]); setSelected(new Set()); setReview(null);
      try {
        const all=[]; let page=1, hasNext=true;
        while(hasNext && !cancelled) {
          const response=await studentApi.getAll({paginated:true,page,limit:100});
          const data=response.data;
          if (!Array.isArray(data?.students) || !data.pagination) throw new Error("Unexpected student response. Please retry.");
          all.push(...data.students); hasNext=Boolean(data.pagination.hasNextPage); page++;
        }
        if(!cancelled) setStudents([...new Map(all.map(s=>[String(s._id),s])).values()].sort((a,b)=>studentName(a).localeCompare(studentName(b))));
      } catch(e) {if(!cancelled) setError(e.response?.data?.message || e.message);}
      finally {if(!cancelled) setLoading(false);}
    };
    load(); return ()=>{cancelled=true;};
  },[retry]);
  const visible=useMemo(()=>students.filter(s=>(filter==="all" || s.status===filter) && `${studentName(s)} ${s.phone||""} ${s.admissionNumber||""}`.toLowerCase().includes(search.toLowerCase())),[students,search,filter]);
  const toggle=id=>setSelected(prev=>{const next=new Set(prev); next.has(id)?next.delete(id):next.add(id); return next;});
  const prepare=()=>{
    try {const next=buildCampaign(students,selected,message,settings.value); setReview(next); setOpened(new Set());setDone(new Set());setError("");}
    catch(e){setError(e.message);}
  };
  const open=recipient=>{
    setOpened(prev=>new Set([...prev,recipient.phone]));
    window.location.href=desktopReminderUrl(recipient.url);
  };
  return <section className={styles.workspace}>
    <header className={styles.hero}><span className={styles.heroIcon}><MessageCircle size={26}/></span><div><small>COMMUNICATION DESK</small><h2>One message. The right audience.</h2><p>Choose who receives it, prepare your announcement, then review before sending.</p></div></header>
    <div className={styles.notice}>Free assisted sending: select recipients → review messages → open each chat → press Send in WhatsApp. No automatic bulk sending or delivery tracking. Send only relevant messages to contacts who expect them.</div>
    <WhatsAppReminderSettings key={JSON.stringify(settings.value)} value={settings.value} onSave={settings.save}/>
    <section className={styles.audience}><div><small>SEND MESSAGE TO</small><h3>Choose your audience</h3></div><div className={styles.segmented}>{[['individual','Student',Users],['branch','Branch',Building2],['batch','Batch',Layers]].map(([id,label,Icon])=><button key={id} aria-pressed={mode===id} onClick={()=>setMode(id)}><Icon size={18}/>{label}</button>)}</div></section>
    {mode!=="individual" ? <WhatsAppGroupAnnouncement key={mode} mode={mode} branches={branches} batches={batches} settings={settings}/> : loading ? <p role="status">Loading all accessible students…</p> : error && !students.length ? <div role="alert">{error} <button onClick={()=>setRetry(v=>v+1)}>Retry students</button></div> : <>
    {!review ? <>
      <div className={styles.columns}>
        <section className={styles.card}><h3>1. Choose students</h3><p>{selected.size} selected · {students.length} available</p>
          <div className={styles.actions}>
            <button onClick={()=>setSelected(new Set(students.filter(s=>s.status==="active").map(s=>String(s._id))))}>All active students</button>
            <button onClick={()=>setSelected(prev=>new Set([...prev,...visible.map(s=>String(s._id))]))}>Add filtered students</button>
            <button onClick={()=>setSelected(new Set())}>Clear selection</button>
          </div>
          <small>For active + selected inactive: choose All active, filter Inactive, then tick the students to add. For individual messages: clear selection and tick one student.</small>
          <div className={styles.filters}><label>Find student<input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Name, phone or admission"/></label><label>Status<select value={filter} onChange={e=>setFilter(e.target.value)}><option value="all">All students</option><option value="active">Active</option><option value="inactive">Inactive</option></select></label></div>
          <div className={styles.students}>{visible.map(s=><label className={styles.student} key={s._id}><input type="checkbox" checked={selected.has(String(s._id))} onChange={()=>toggle(String(s._id))}/><span><strong>{studentName(s)}</strong><small>{s.phone||"No student phone"} · {s.status} · {s.batch?.batchName||"No batch"}</small></span></label>)}{!visible.length&&<p>No students found.</p>}</div>
        </section>
        <section className={styles.card}><h3>2. Write announcement</h3>
          <AnnouncementComposer value={message} onChange={setMessage} onValidityChange={setComposerValid} initialForm={announcementForm} onFormChange={setAnnouncementForm}/>
          <button className={styles.primary} disabled={!selected.size || !composerValid} onClick={prepare}>Review {selected.size} selected students</button>
        </section>
      </div>
      {error&&<p role="alert" className={styles.error}>{error}</p>}
    </> : <section className={styles.card}>
      <div className={styles.actions}><h3>3. Review & send · {review.recipients.length} chats</h3><button onClick={()=>setReview(null)}>Back to edit</button></div>
      <p>{done.size} manually marked done. Shared phone numbers are combined. Progress lasts only while this tab stays open; opened/done does not prove delivery.</p>
      {!!review.invalid.length&&<div className={styles.error}>Cannot send to {review.invalid.length} selected students (missing/invalid student phone): {review.invalid.map(s=>s.name).join(", ")}. Correct their phone in Students, then reload this page.</div>}
      {!review.recipients.length&&<p>No valid recipients. Nothing will be sent.</p>}
      {review.recipients.map(r=><article key={r.phone} className={styles.recipient}>
        <h4>{r.names.join(", ")}</h4><small>+{r.phone} · {done.has(r.phone)?"Manually marked done":opened.has(r.phone)?"Chat launch requested — delivery unknown":"Not opened"}</small>
        <details><summary>Preview exact message</summary><pre>{r.message}</pre></details>
        <div className={styles.actions}><button onClick={()=>open(r)}>{opened.has(r.phone)?"Reopen WhatsApp":"Open WhatsApp"}</button><a href={r.url} target="_blank" rel="noopener noreferrer" onClick={()=>setOpened(prev=>new Set([...prev,r.phone]))}>Browser fallback</a><label><input type="checkbox" disabled={!opened.has(r.phone)} checked={done.has(r.phone)} onChange={()=>setDone(prev=>{const next=new Set(prev);next.has(r.phone)?next.delete(r.phone):next.add(r.phone);return next;})}/> I finished this chat</label></div>
      </article>)}
    </section>}
    </>}
  </section>;
}
