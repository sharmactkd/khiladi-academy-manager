import {createContext,useContext,useCallback,useEffect,useRef,useState} from "react";
import {createPortal} from "react-dom";
import {Link} from "react-router-dom";
import {Bell,Cake,CalendarDays,Check,ChevronRight,CircleDollarSign,RefreshCw,Settings,X} from "lucide-react";
import toast from "react-hot-toast";
import useAuth from "../../hooks/useAuth.js";
import {reminderApi} from "../../api/reminderApi.js";
import styles from "./ReminderCenter.module.css";
const Context=createContext(null);
const unwrap=response=>response?.data?.data||{};
const management=["academy_owner","super_admin","assistant_coach"];
const formatDate=value=>value?value.split("-").reverse().join("-"):"";
const label=event=>event.offset===0?"Today":event.offset===-1?"Yesterday":event.offset===1?"Tomorrow":event.offset>0?`In ${event.offset} days`:`${-event.offset} days ${event.kind==="birthday"?"ago":"overdue"}`;
const clientDay=zone=>new Intl.DateTimeFormat("en-CA",{timeZone:zone||"Asia/Kolkata",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date());

export function ReminderProvider({children}){
  const {user,isAuthenticated}=useAuth();
  const enabled=isAuthenticated&&management.includes(user?.role);
  const [data,setData]=useState(null),[error,setError]=useState(""),[loading,setLoading]=useState(false);
  const [open,setOpen]=useState(false),[tab,setTab]=useState("today"),[queue,setQueue]=useState([]);
  const latest=useRef(null),generation=useRef(0),flight=useRef(false),pending=useRef(false),lastFetch=useRef(0),lastDay=useRef("");
  const refresh=useCallback(async()=>{
    if(!enabled||document.hidden)return;
    if(flight.current){pending.current=true;return;}
    flight.current=true;
    const version=generation.current;
    setLoading(true);
    try{
      const next=unwrap(await reminderApi.get());
      if(version!==generation.current)return;
      latest.current=next;setData(next);setError("");lastFetch.current=Date.now();lastDay.current=clientDay(next.timeZone);
      if(next.settings?.flash){
        const flashes=[];
        for(const kind of ["birthday","due"]){
          const events=next.events.filter(event=>event.kind===kind&&event.offset===0);
          if(!events.length)continue;
          try{
            const claim=unwrap(await reminderApi.flash(kind));
            if(claim.today&&claim.today!==next.today){pending.current=true;continue;}
            if(claim.claimed&&version===generation.current)flashes.push({kind,events,id:`${next.today}:${kind}`});
          }catch{/* A later refresh can retry an unclaimed flash. */}
        }
        if(version===generation.current&&flashes.length)setQueue(current=>[...current,...flashes.filter(flash=>!current.some(item=>item.id===flash.id))]);
      }
    }catch(failure){if(version===generation.current)setError(failure.response?.data?.message||"Reminders could not load. Try again.");}
    finally{if(version===generation.current){flight.current=false;setLoading(false);if(pending.current){pending.current=false;setTimeout(()=>{if(version===generation.current)refresh();},0);}}}
  },[enabled,user?._id]);
  useEffect(()=>{
    const reset=()=>{generation.current++;flight.current=false;pending.current=false;latest.current=null;setData(null);setQueue([]);setOpen(false);lastFetch.current=0;refresh();};
    reset();
    const tick=()=>{if(!document.hidden&&(Date.now()-lastFetch.current>=300000||clientDay(latest.current?.timeZone)!==lastDay.current))refresh();};
    const focus=()=>{if(Date.now()-lastFetch.current>30000)refresh();};
    const timer=window.setInterval(tick,60000);
    window.addEventListener("focus",focus);window.addEventListener("khiladi:fees-changed",refresh);
    window.addEventListener("khiladi:academy-changed",reset);document.addEventListener("visibilitychange",tick);
    return()=>{generation.current++;flight.current=false;clearInterval(timer);window.removeEventListener("focus",focus);window.removeEventListener("khiladi:fees-changed",refresh);window.removeEventListener("khiladi:academy-changed",reset);document.removeEventListener("visibilitychange",tick);};
  },[refresh]);
  const markRead=async ids=>{
    const version=generation.current;
    try{
      await reminderApi.read(ids);
      if(version!==generation.current)return;
      setData(current=>{
        if(!current)return current;
        const events=current.events.map(event=>ids.includes(event.id)?{...event,isRead:true}:event);
        const next={...current,events,unreadCount:events.filter(event=>event.offset<=0&&!event.isRead).length};latest.current=next;return next;
      });
    }catch{toast.error("Could not mark reminders as read");}
  };
  const saveSettings=async settings=>{
    const version=generation.current;
    try{await reminderApi.settings(settings);if(version!==generation.current)return;setQueue([]);await refresh();toast.success("Reminder settings saved");}
    catch(failure){toast.error(failure.response?.data?.message||"Settings could not save");throw failure;}
  };
  const value={enabled,user,data,error,loading,open,setOpen,tab,setTab,refresh,markRead,saveSettings};
  return <Context.Provider value={value}>{children}{enabled&&queue[0]&&<ReminderFlash key={queue[0].id} flash={queue[0]} onClose={()=>setQueue(current=>current.slice(1))} onView={()=>{setTab("today");setOpen(true);setQueue([]);}}/>}</Context.Provider>;
}

function ReminderFlash({flash,onClose,onView}){
  const [paused,setPaused]=useState(false);
  const close=useRef(onClose);close.current=onClose;
  const remaining=useRef(8000);
  useEffect(()=>{
    if(paused)return;
    const start=Date.now(),timer=setTimeout(()=>close.current(),remaining.current);
    return()=>{clearTimeout(timer);remaining.current=Math.max(0,remaining.current-(Date.now()-start));};
  },[paused]);
  const birthday=flash.kind==="birthday",Icon=birthday?Cake:CircleDollarSign;
  return createPortal(<aside className={styles.flash} role="status" aria-live="polite" onMouseEnter={()=>setPaused(true)} onMouseLeave={()=>setPaused(false)} onFocus={()=>setPaused(true)} onBlur={event=>{if(!event.currentTarget.contains(event.relatedTarget))setPaused(false);}}>
    <div className={styles.flashIcon}><Icon size={22}/></div><div><small>{birthday?"LET’S CELEBRATE":"FEE REMINDER"}</small><h3>{birthday?`${flash.events.length} birthday${flash.events.length>1?"s":""} today`:`${flash.events.length} student${flash.events.length>1?"s":""} with fees due today`}</h3><p>{flash.events.slice(0,5).map(event=>event.name).join(" · ")}{flash.events.length>5?` +${flash.events.length-5} more`:""}</p><button onClick={onView}>{birthday?"View birthdays":"View due list"}<ChevronRight size={14}/></button></div><button className={styles.close} onClick={onClose} aria-label="Dismiss reminder"><X size={17}/></button>
  </aside>,document.body);
}

export function ReminderBell({fallback=null}){
  const context=useContext(Context);
  if(!context?.enabled)return fallback;
  const {data,setOpen,open}=context;
  const count=(data?.unreadCount||0)+(data?.inboxUnread||0);
  return <><button type="button" className={`notification-bell ${styles.bell}`} onClick={()=>setOpen(!open)} aria-label={`Notifications${count?`, ${count} unread`:""}`} aria-expanded={open} aria-haspopup="dialog"><Bell size={20}/>{count>0&&<strong>{count>99?"99+":count}</strong>}</button>{open&&<ReminderPanel/>}</>;
}

function ReminderPanel(){
  const {data,error,loading,setOpen,tab,setTab,refresh,markRead,user}=useContext(Context);
  const closeRef=useRef(null);
  useEffect(()=>{
    const previous=document.activeElement;closeRef.current?.focus();
    const previousOverflow=document.body.style.overflow;document.body.style.overflow="hidden";
    const key=event=>{
      if(event.key==="Escape")setOpen(false);
      if(event.key==="Tab"){
        const panel=closeRef.current?.closest('[role="dialog"]');
        const items=[...(panel?.querySelectorAll('a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled])')||[])].filter(item=>item.getClientRects().length);
        const first=items[0],last=items[items.length-1];
        if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}
        else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}
      }
    };
    window.addEventListener("keydown",key);
    return()=>{document.body.style.overflow=previousOverflow;window.removeEventListener("keydown",key);previous?.focus?.();};
  },[setOpen]);
  const events=(data?.events||[]).filter(event=>tab==="today"?event.offset===0:tab==="upcoming"?event.offset>0:event.offset<0)
    .sort((a,b)=>tab==="earlier"?b.date.localeCompare(a.date)||a.name.localeCompare(b.name):a.date.localeCompare(b.date)||a.name.localeCompare(b.name));
  const canCollect=["academy_owner","super_admin"].includes(user?.role);
  const wishLink=event=>{
    let digits=String(event.phone||"").replace(/\D/g,"");const prefix=String(event.countryCode||"").replace(/\D/g,"");
    if(prefix&&!digits.startsWith(prefix))digits=prefix+digits;
    if(digits.length<8||digits.length>15)return null;
    const template=event.kind==="birthday"?data.settings.birthdayTemplate:data.settings.dueTemplate;
    const message=template.replaceAll("{name}",event.name).replaceAll("{date}",formatDate(event.date));
    return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
  };
  return createPortal(<div className={styles.backdrop} onMouseDown={event=>{if(event.target===event.currentTarget)setOpen(false);}}><aside className={styles.panel} role="dialog" aria-modal="true" aria-label="Today and upcoming notifications">
    <header><div><small>YOUR ACADEMY AT A GLANCE</small><h2>Today & Upcoming</h2><p>{data?`${formatDate(data.today)} · ${data.timeZone}`:"Birthdays and fee reminders"}</p></div><button ref={closeRef} className={styles.close} onClick={()=>setOpen(false)} aria-label="Close notifications"><X size={20}/></button></header>
    <nav className={styles.tabs} aria-label="Reminder sections">{[["today","Today"],["upcoming","Upcoming"],["earlier","Earlier"],["settings",<Settings size={17}/>]].map(([key,title])=><button key={key} type="button" aria-pressed={tab===key} aria-label={key==="settings"?"Reminder settings":undefined} className={tab===key?styles.selected:""} onClick={()=>setTab(key)}>{title}</button>)}</nav>
    <div className={styles.toolbar}><Link to="/notifications" onClick={()=>setOpen(false)}>Other notifications{data?.inboxUnread?` (${data.inboxUnread})`:""}</Link><button onClick={refresh} disabled={loading} aria-label="Refresh reminders"><RefreshCw size={15}/></button>{tab!=="settings"&&events.some(e=>!e.isRead)&&<button onClick={()=>markRead(events.filter(e=>!e.isRead).map(e=>e.id))}>Mark all read</button>}</div>
    <div className={styles.body}>
      {error&&<div role="alert" className={styles.empty}><p>{error}</p><button onClick={refresh}>Try again</button></div>}
      {!data&&!error&&<p className={styles.empty} role="status">Loading reminders…</p>}
      {data&&tab==="settings"?<ReminderSettings key={data.academyId+JSON.stringify(data.settings)} settings={data.settings}/>:data&&<>
        <p className={styles.sectionHelp}>{tab==="today"?"Birthdays and fees due today.":tab==="upcoming"?`Looking ahead ${data.settings.range} days.`:"Recent birthdays (30 days) and fees still overdue. Reading a reminder does not clear a fee balance."}</p>
        {!events.length&&<div className={styles.empty}><CalendarDays size={28}/><h3>You’re all caught up</h3><p>No reminders in this section.</p></div>}
        {events.map(event=>{
          const birthday=event.kind==="birthday",Icon=birthday?Cake:CircleDollarSign,link=wishLink(event);
          return <article key={event.id} className={`${styles.event} ${event.isRead?styles.read:""}`}><div className={birthday?styles.birthdayIcon:styles.dueIcon}><Icon size={19}/></div><div className={styles.eventContent}><small>{label(event)} · {formatDate(event.date)}</small><h3>{event.name}</h3><p>{birthday?`${event.offset===-1?"Birthday was yesterday":event.offset===0?"Birthday today":"Birthday"}${event.age>0?` · Turning ${event.age}`:""}`:event.offset<0?"Fee overdue":event.offset===0?"Fee due today":"Upcoming fee due"}</p>{event.batch&&<span className={styles.batch}>{event.batch}</span>}<div className={styles.eventActions}><Link to={`/students/${event.studentId}`} onClick={()=>{markRead([event.id]);setOpen(false);}}>Profile</Link>{!birthday&&canCollect&&<Link to={`/fees/collect?student=${event.studentId}`} onClick={()=>setOpen(false)}>Collect Fee</Link>}{link&&<a href={link} target="_blank" rel="noopener noreferrer" onClick={()=>markRead([event.id])}>{birthday?event.offset<0?"Belated Wish":"WhatsApp Wish":"Send Reminder"}</a>}</div></div><button className={styles.readButton} disabled={event.isRead} aria-label={`Mark ${event.name} ${event.kind} reminder read`} onClick={()=>markRead([event.id])}><Check size={15}/></button></article>;
        })}
      </>}
    </div><footer>Reminders refresh independently. Your attendance edits stay in place.</footer>
  </aside></div>,document.body);
}

function ReminderSettings({settings}){
  const {saveSettings}=useContext(Context);
  const [form,setForm]=useState(settings),[saving,setSaving]=useState(false);
  const update=(key,value)=>setForm(current=>({...current,[key]:value}));
  return <form className={styles.settings} onSubmit={async event=>{event.preventDefault();setSaving(true);try{await saveSettings(form);}catch{}finally{setSaving(false);}}}>
    <h3>Your reminder preferences</h3><p>Saved for your account in this academy.</p>
    {[["birthdays","Birthday alerts"],["dues","Fee due alerts"],["flash","Daily flash cards"],["inactiveBirthdays","Include inactive students’ birthdays"],["inactiveDues","Include inactive students’ fee dues"]].map(([key,title])=><label className={styles.toggle} key={key}><span>{title}</span><input type="checkbox" checked={form[key]} onChange={event=>update(key,event.target.checked)}/></label>)}
    <label>Upcoming range<select value={form.range} onChange={event=>update("range",Number(event.target.value))}>{[7,15,30].map(days=><option key={days} value={days}>{days} days</option>)}</select></label>
    <label>Birthday wish message<textarea maxLength={500} rows={3} value={form.birthdayTemplate} onChange={event=>update("birthdayTemplate",event.target.value)}/></label>
    <label>Fee reminder message<textarea maxLength={500} rows={3} value={form.dueTemplate} onChange={event=>update("dueTemplate",event.target.value)}/></label>
    <p>Use {"{name}"} and {"{date}"}. WhatsApp messages open for review; they are never sent automatically. February 29 birthdays appear on February 28 in non-leap years.</p>
    <button className={styles.save} disabled={saving}>{saving?"Saving…":"Save Preferences"}</button>
  </form>;
}
