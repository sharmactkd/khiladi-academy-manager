import { useState } from "react";
import { Link2, ShieldCheck } from "lucide-react";
import { groupAnnouncement, validateGroupLink, groupChoices } from "./whatsappGroup.js";
import AnnouncementComposer from "./AnnouncementComposer.jsx";
import { initialAnnouncement, generateAnnouncement } from "./announcementBuilder.js";
import styles from "./WhatsAppWorkspace.module.css";

export default function WhatsAppGroupAnnouncement({mode="batch",branches=[],batches=[],settings}) {
  const all=[...branches.map(b=>({...b,id:`branch:${b._id}`,name:b.branchName,label:`Branch · ${b.branchName}`,kind:'branch'})),...batches.map(b=>({...b,id:`batch:${b._id}`,name:b.batchName,label:`Batch · ${b.batchName}`,kind:'batch'}))];
  const targets=all.filter(t=>t.kind===mode);
  const [targetId,setTargetId]=useState("");
  const target=targets.find(t=>t.id===targetId) || (targets.length===1?targets[0]:null);
  return <section>
    <div className={styles.card}><h3>1. Select {mode}</h3><label>{mode==='batch'?'Batch':'Branch'}<select value={target?.id||""} onChange={e=>setTargetId(e.target.value)}><option value="">Choose {mode}</option>{targets.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}</select></label>
    {!targets.length&&<p>No {mode} loaded. Refresh the Communication Hub and check access.</p>}</div>
    {target&&<GroupEditor key={target.id} target={target} all={all} settings={settings}/>}
  </section>;
}
function GroupEditor({target,all,settings}) {
  const choices=groupChoices(target,all,settings.value.groupDestinations);
  const [choiceId,setChoiceId]=useState(null);
  const initial=choices.find(c=>c.id==='profile') || choices.find(c=>c.id==='saved');
  const selectedId=choiceId ?? initial?.id ?? 'other';
  const selected=choices.find(c=>c.id===selectedId);
  const [name,setName]=useState(''),[link,setLink]=useState('');
  const [message,setMessage]=useState(()=>generateAnnouncement(initialAnnouncement()));
  const [valid,setValid]=useState(true),[preview,setPreview]=useState(null),[notice,setNotice]=useState('');
  const destination=selected || {name:name.trim()||target.name,link,source:'Other group'};
  const review=()=>{try{setPreview({message:groupAnnouncement(message,settings.value.academyName,destination.name),link:validateGroupLink(destination.link),name:destination.name});setNotice('');}catch(e){setNotice(e.message);}};
  const save=()=>{try{const clean=validateGroupLink(link); if(!name.trim()) throw new Error('Enter a group name to save.');settings.save({...settings.value,groupDestinations:{...settings.value.groupDestinations,[target.id]:{name:name.trim(),link:clean}}});setNotice('Alternative group saved on this browser. Profile link unchanged.');}catch(e){setNotice(e.message);}};
  const copy=async()=>{try{await navigator.clipboard.writeText(preview.message);setNotice('Copied. Verify the group in WhatsApp, paste and press Send.');}catch{setNotice('Clipboard unavailable. Select and copy the preview text manually.');}};
  return <div className={styles.columns} style={{marginTop:18}}>
    <section className={styles.card}><h3>2. Choose WhatsApp group</h3><p>Use the profile group or choose a different destination for this announcement.</p>
      <label>Send to group<select value={selectedId} onChange={e=>{setChoiceId(e.target.value);setPreview(null);}}>{choices.map(c=><option key={c.id} value={c.id}>{c.name} — {c.source}</option>)}<option value="other">Other group / enter link</option></select></label>
      {selected?<div className={styles.groupIdentity}><Link2 size={21}/><div><strong>{selected.name}</strong><small>{selected.source} · verify the actual group title in WhatsApp</small><span>{selected.link}</span></div></div>:<><label>WhatsApp group name<input maxLength={120} value={name} onChange={e=>{setName(e.target.value);setPreview(null);}} placeholder="Group name in WhatsApp"/></label><label>Group invite link (optional)<input maxLength={500} value={link} onChange={e=>{setLink(e.target.value);setPreview(null);}} placeholder="https://chat.whatsapp.com/..."/></label><button onClick={save}>Save alternative group</button></>}
      <div className={styles.notice}><ShieldCheck size={18}/> Fee reminders remain individual. Group announcements are visible to all group members, including inactive students. App filters do not change group membership.</div>
      <p>Group details saved here stay on this browser. An invite link may show a join/approval screen. Without a link, find the group by name inside WhatsApp.</p>
    </section>
    <section className={styles.card}><h3>3. Prepare announcement</h3><AnnouncementComposer value={message} onChange={text=>{setMessage(text);setPreview(null);}} onValidityChange={setValid}/><button className={styles.primary} disabled={!valid || (!selected && !name.trim())} onClick={review}>Review group message</button><p role="status">{notice}</p>
    {preview&&<article className={styles.recipient}><h4>Destination: {preview.name}</h4><pre>{preview.message}</pre><div className={styles.actions}><button onClick={copy}>Copy message</button><button onClick={()=>{window.location.href='whatsapp://';}}>Open WhatsApp</button><a href="https://web.whatsapp.com/" target="_blank" rel="noopener noreferrer">WhatsApp Web</a>{preview.link&&<a href={preview.link} target="_blank" rel="noopener noreferrer">Open group invite</a>}</div><small>Verify group → paste → Send. Opening the app does not send or confirm delivery.</small></article>}
    </section>
  </div>;
}
