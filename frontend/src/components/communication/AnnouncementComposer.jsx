import { useState } from "react";
import { CalendarDays, Trophy, Award, HeartPulse, Pencil } from "lucide-react";
import DateInput from "../common/DateInput.jsx";
import {initialAnnouncement,generateAnnouncement,addCalendarDays,inclusiveDays} from "./announcementBuilder.js";
import styles from "./WhatsAppWorkspace.module.css";
const types=[['holiday','Holiday',CalendarDays],['sickness','Sickness',HeartPulse],['belt','Belt test',Award],['championship','Championship',Trophy],['custom','Custom',Pencil]];
export default function AnnouncementComposer({value,onChange,onValidityChange=()=>{},initialForm,onFormChange=()=>{}}) {
  const [form,setForm]=useState(()=>initialForm || initialAnnouncement()),[error,setError]=useState("");
  const update=patch=>{
    const next={...form,...patch};
    try {
      if('days' in patch || 'start' in patch) {
        if(!Number.isInteger(Number(next.days)) || Number(next.days)<1 || Number(next.days)>365) throw new Error("Number of days must be 1–365.");
        next.end=addCalendarDays(next.start,Number(next.days)-1);
      } else if('end' in patch) next.days=inclusiveDays(next.start,next.end);
      const text=generateAnnouncement(next); setForm(next);onFormChange(next);onChange(text);setError("");onValidityChange(true);
    } catch(e){setForm(next);onFormChange(next);setError(e.message);onValidityChange(false);}
  };
  const holiday=['holiday','sickness'].includes(form.type);
  return <div className={styles.composer}>
    <div className={styles.typeTabs} aria-label="Announcement type">{types.map(([id,name,Icon])=><button type="button" key={id} aria-pressed={form.type===id} onClick={()=>update({type:id})}><Icon size={16}/>{name}</button>)}</div>
    {form.type!=="custom"&&<div className={styles.fieldGrid}>
      <label>{holiday?'Holiday starts':'Event date'}<DateInput value={form.start} onChange={e=>update({start:e.target.value})}/></label>
      {holiday&&<><label>Number of days<input type="number" min="1" max="365" value={form.days} onChange={e=>update({days:e.target.value})}/></label><label>Holiday ends (inclusive)<DateInput min={form.start} value={form.end} onChange={e=>update({end:e.target.value})}/></label></>}
      {!holiday&&<><label>Event name<input value={form.event} maxLength={150} onChange={e=>update({event:e.target.value})}/></label><label>Venue<input value={form.venue} maxLength={200} onChange={e=>update({venue:e.target.value})}/></label></>}
      <label>{holiday?'Resume time (optional)':'Reporting time (optional)'}<input type="time" value={form.time} onChange={e=>update({time:e.target.value})}/></label>
      {holiday&&<label>Reason (optional)<input value={form.reason} maxLength={200} placeholder={form.type==='sickness'?'Optional additional information':'Festival, weather, personal work…'} onChange={e=>update({reason:e.target.value})}/></label>}
    </div>}
    <label>{form.type==='custom'?'Custom announcement':'Additional instructions (optional)'}<input value={form.note} maxLength={800} onChange={e=>update({note:e.target.value})}/></label>
    {error&&<p role="alert" className={styles.error}>{error}</p>}
    <label className={styles.messageLabel}>Message draft <span>Editable · personalised before sending</span><textarea rows={11} maxLength={2500} value={value} onChange={e=>onChange(e.target.value)}/></label>
    <small>Changing fields regenerates this draft. Holiday dates include both start and end; resume date defaults to the following calendar day. Edit the draft if your class schedule differs.</small>
  </div>;
}
