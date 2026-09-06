export const todayDate = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
};
const parse = value => {
  if(!/^\d{4}-\d{2}-\d{2}$/.test(value || "")) throw new Error("Choose a valid date.");
  const d = new Date(`${value}T00:00:00Z`);
  if(!Number.isFinite(d.getTime()) || d.toISOString().slice(0,10)!==value) throw new Error("Choose a valid date.");
  return d;
};
export const addCalendarDays = (date, days) => {
  const d=parse(date); d.setUTCDate(d.getUTCDate()+Number(days)); return d.toISOString().slice(0,10);
};
export const inclusiveDays = (start,end) => Math.round((parse(end)-parse(start))/86400000)+1;
const label = date => parse(date).toLocaleDateString("en-GB",{day:"numeric",month:"long",year:"numeric",timeZone:"UTC"});
export const initialAnnouncement = () => ({type:"holiday",start:todayDate(),end:todayDate(),days:1,reason:"",event:"",venue:"",time:"",note:""});
export function generateAnnouncement(form) {
  const {type,start,end,reason,event,venue,time,note}=form;
  let body;
  if(type==="holiday" || type==="rainy" || type==="sickness") {
    const days=inclusiveDays(start,end);
    if(days<1 || days>365) throw new Error("Choose a holiday period of 1–365 days.");
    const reasonText = type === "sickness" ? " due to instructor illness" : type === "rainy" ? " due to rainy weather" : "";
    const heading = type === "rainy" ? "Rainy Day Holiday" : "Holiday";
    body=`Martial Arts classes will be closed${reasonText}${reason.trim()?` (${reason.trim()})`:""}.\n\n${heading}: ${days} ${days===1?"day":"days"}\nFrom: ${label(start)}\nTo: ${label(end)}\nClasses resume: ${label(addCalendarDays(end,1))}${time?` at ${time}`:""}.`;
  } else if(type==="belt" || type==="championship") {
    body=`${type==="belt"?"Belt Test":"Championship"}${event.trim()?`: ${event.trim()}`:""}\nDate: ${label(start)}${time?`\nReporting time: ${time}`:""}${venue.trim()?`\nVenue: ${venue.trim()}`:""}\nPlease contact the academy to confirm participation.`;
  } else body=note.trim() || "Please contact the academy for the latest class updates.";
  if(type!=="custom" && note.trim()) body+=`\n\n${note.trim()}`;
  return `Hello {name},\n\n${body}\n\n— {academy}`;
}
