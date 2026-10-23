import { todayDateKey, storedDateKey } from "./businessDate.js";
import { calculateMembershipAccrualState } from "./membershipMonthlyDue.js";
export const DEFAULT_REMINDER_SETTINGS = { birthdays:true, dues:true, flash:true, range:7, inactiveBirthdays:true, inactiveDues:false,
  birthdayTemplate:"Happy Birthday, {name}! Wishing you a wonderful year ahead.",
  dueTemplate:"Hello {name}, your academy fee is due on {date}. Please contact the academy to complete payment." };
export const pickReminderSettings = input => Object.fromEntries(Object.keys(DEFAULT_REMINDER_SETTINGS).map(key => [key,input?.[key] ?? DEFAULT_REMINDER_SETTINGS[key]]));
const dayMs=86400000;
export const buildReminderEvents = ({students=[],memberships=[],settings={},now=new Date(),timeZone="Asia/Kolkata"}) => {
  settings={...DEFAULT_REMINDER_SETTINGS,...settings};
  const today=todayDateKey(now,timeZone), midnight=new Date(`${today}T00:00:00Z`);
  const maps=new Map(memberships.map(item=>[String(item.student),item]));
  const events=[];
  // Calendar work is shared by all students rather than repeated per DOB.
  const birthdayDays=[];
  if(settings.birthdays)for(let offset=-30;offset<=settings.range;offset++){
    const date=new Date(midnight.getTime()+offset*dayMs),year=date.getUTCFullYear();
    birthdayDays.push({offset,year,month:date.getUTCMonth()+1,day:date.getUTCDate(),
      key:date.toISOString().slice(0,10),leap:new Date(Date.UTC(year,2,0)).getUTCDate()===29});
  }
  for(const student of students){
    const id=String(student._id), name=[student.firstName,student.lastName].filter(Boolean).join(" ") || "Student";
    const base={studentId:id,name,batch:student.batch?.batchName||"",phone:student.phone||"",countryCode:student.countryCode||"",studentStatus:student.status};
    const active=student.status==="active";
    const dob=storedDateKey(student.dateOfBirth || student.dob);
    if(settings.birthdays && (active||settings.inactiveBirthdays) && dob && dob<=today){
      const [,month,day]=dob.split("-").map(Number);
      for(const date of birthdayDays){
        const birthdayDay=month===2&&day===29&&!date.leap?28:day;
        if(date.month!==month||date.day!==birthdayDay)continue;
        events.push({...base,id:`birthday:${date.key}:${id}`,kind:"birthday",date:date.key,offset:date.offset,age:date.year-Number(dob.slice(0,4))});
      }
    }
    const member=maps.get(id);
    if(!settings.dues||(!active&&!settings.inactiveDues)||!member)continue;
    if(member.feeRequired===false||member.status==="paused"||member.status==="complimentary"||["waived","complimentary"].includes(member.feeStatus)||member.manualFeeStatus==="paid"||Number(member.remainingTrainingDays)>0||member.dueDateCleared)continue;
    const accrued=calculateMembershipAccrualState(member,midnight);
    const due=storedDateKey(accrued.unpaidMonths>0||Number(member.unpaidDays)>0 ? member.effectiveDueDate||member.nextDueDate : member.nextDueDate||member.effectiveDueDate);
    if(!due)continue;
    const offset=Math.round((new Date(`${due}T00:00:00Z`)-midnight)/dayMs);
    if(offset>settings.range)continue;
    events.push({...base,id:`due:${due}:${id}`,kind:"due",date:due,offset,
      unpaidMonths:accrued.unpaidMonths,unpaidDays:Number(member.unpaidDays||0)});
  }
  events.sort((a,b)=>a.date.localeCompare(b.date)||a.name.localeCompare(b.name)||a.id.localeCompare(b.id));
  return {today,timeZone,events};
};
