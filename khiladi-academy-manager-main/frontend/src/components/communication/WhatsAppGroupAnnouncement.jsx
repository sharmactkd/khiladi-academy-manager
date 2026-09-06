import { useState } from "react";
import { announcementTemplates } from "./whatsappCampaign.js";
import { groupAnnouncement, validateGroupLink } from "./whatsappGroup.js";
import styles from "./WhatsAppWorkspace.module.css";

export default function WhatsAppGroupAnnouncement({branches=[], batches=[], settings}) {
  const targets=[...branches.map(b=>({id:`branch:${b._id}`,label:`Branch · ${b.branchName}`})),...batches.map(b=>({id:`batch:${b._id}`,label:`Batch · ${b.batchName}`}))];
  const [targetId,setTargetId]=useState("");
  const target=targets.find(t=>t.id===targetId) || (targets.length===1 ? targets[0] : null);
  return <section className={styles.card}>
    <h3>Branch / batch group announcement</h3>
    <p>Fee reminders remain individual. Group messages go to every member of the WhatsApp group, including any inactive students already in that group. App student filters do not control group membership.</p>
    <label>Choose destination<select value={target?.id || ""} onChange={e=>setTargetId(e.target.value)}><option value="">Select branch or batch</option>{targets.map(t=><option key={t.id} value={t.id}>{t.label}</option>)}</select></label>
    {!targets.length&&<p>No branches/batches loaded. Refresh the Communication Hub and check access.</p>}
    {target&&<GroupEditor key={target.id} target={target} settings={settings}/>}
  </section>;
}
function GroupEditor({target,settings}) {
  const saved=settings.value.groupDestinations?.[target.id] || {};
  const [name,setName]=useState(saved.name || ""),[link,setLink]=useState(saved.link || "");
  const [type,setType]=useState("holiday"),[message,setMessage]=useState(announcementTemplates.holiday);
  const [preview,setPreview]=useState(null),[notice,setNotice]=useState("");
  const save=()=>{try{const valid=validateGroupLink(link);settings.save({...settings.value,groupDestinations:{...settings.value.groupDestinations,[target.id]:{name:name.trim(),link:valid}}});setNotice("Group details saved on this browser.");}catch(e){setNotice(e.message);}};
  const review=()=>{try{setPreview({message:groupAnnouncement(message,settings.value.academyName,name.trim()||target.label),link:validateGroupLink(link),name:name.trim()||target.label});setNotice("");}catch(e){setNotice(e.message);}};
  const copy=async()=>{try{await navigator.clipboard.writeText(preview.message);setNotice("Message copied. Open WhatsApp, verify the group, paste and press Send.");}catch{setNotice("Clipboard permission unavailable. Select and copy the preview text manually.");}};
  return <>
    <div className={styles.filters}><label>WhatsApp group name<input value={name} maxLength={120} onChange={e=>{setName(e.target.value);setPreview(null);}} placeholder="Name to find inside WhatsApp"/></label><label>Group invite link (optional)<input value={link} onChange={e=>{setLink(e.target.value);setPreview(null);}} maxLength={500} placeholder="https://chat.whatsapp.com/..."/></label></div>
    <button onClick={save}>Save group details</button>
    <p>Invite links may open a join/approval page, not the chat. No automatic joining or group selection. Without a link, open WhatsApp and find the saved group name.</p>
    <label>Announcement type<select value={type} onChange={e=>{setType(e.target.value);setMessage(announcementTemplates[e.target.value]);setPreview(null);}}><option value="holiday">Holiday</option><option value="championship">Championship</option><option value="belt">Belt test</option><option value="custom">Custom announcement</option></select></label>
    <label>Announcement<textarea rows={9} maxLength={2500} value={message} onChange={e=>{setMessage(e.target.value);setPreview(null);}}/></label>
    <small>{'{name}'} becomes “everyone”; {'{group}'} uses the group name. No student names, phones, fee dates or QR are inserted automatically.</small>
    <div className={styles.actions}><button className={styles.primary} onClick={review}>Review group message</button></div>
    {preview&&<article className={styles.recipient}><h4>Destination: {preview.name}</h4><pre>{preview.message}</pre><div className={styles.actions}><button onClick={copy}>1. Copy message</button><button onClick={()=>{window.location.href="whatsapp://";}}>2. Open WhatsApp app</button><a href="https://web.whatsapp.com/" target="_blank" rel="noopener noreferrer">WhatsApp Web</a>{preview.link&&<a href={preview.link} target="_blank" rel="noopener noreferrer">Open group invite link</a>}</div><p>Verify the group name → paste → Send. Opening the app/link does not send the message; delivery is not tracked.</p></article>}
    <p role="status">{notice}</p>
  </>;
}
