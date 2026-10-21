import Student from "../models/Student.js";
import StudentMembership from "../models/StudentMembership.js";
import Notification from "../models/Notification.js";
import ReminderPreference from "../models/ReminderPreference.js";
import {buildBranchAccessFilter} from "../services/branchAccessService.js";
import {buildReminderEvents,pickReminderSettings} from "../utils/reminderEvents.js";
import {todayDateKey} from "../utils/businessDate.js";
import asyncHandler from "../utils/asyncHandler.js";
import {successResponse} from "../utils/apiResponse.js";

const scope=req=>({academy:req.academyId,user:req.user._id});
const preference=async req=>{
  await ReminderPreference.init();
  try {return await ReminderPreference.findOneAndUpdate(scope(req),{$setOnInsert:scope(req)},{upsert:true,new:true,setDefaultsOnInsert:true});}
  catch(error){if(error.code===11000)return ReminderPreference.findOne(scope(req));throw error;}
};
const zone=req=>{
  const candidate=req.academy?.settings?.timeZone||req.academy?.timeZone||process.env.APP_TIME_ZONE||"Asia/Kolkata";
  try{new Intl.DateTimeFormat("en",{timeZone:candidate});return candidate;}catch{return "Asia/Kolkata";}
};
export const getReminders=asyncHandler(async(req,res)=>{
  const [pref,students,inboxUnread]=await Promise.all([
    preference(req),Student.find({academy:req.academyId,...buildBranchAccessFilter(req.user)})
      .select("firstName lastName dateOfBirth dob status phone countryCode batch").populate("batch","batchName").lean(),
    Notification.countDocuments({academy:req.academyId,recipientUser:req.user._id,isRead:false}),
  ]);
  const memberships=await StudentMembership.find({academy:req.academyId,student:{$in:students.map(s=>s._id)}})
    .select("student status feeRequired feeStatus manualFeeStatus remainingTrainingDays dueDateCleared autoMonthlyDue effectiveDueDate nextDueDate unpaidMonths unpaidDays").lean();
  const settings=pickReminderSettings(pref);
  const result=buildReminderEvents({students,memberships,settings,timeZone:zone(req)});
  const read=new Set(pref.readKeys);
  result.events=result.events.map(event=>({...event,isRead:read.has(event.id)}));
  res.set("Cache-Control","private, no-store");
  return successResponse(res,"Reminders loaded",{...result,settings,academyId:String(req.academyId),inboxUnread,
    unreadCount:result.events.filter(event=>event.offset<=0&&!event.isRead).length});
});
export const updateReminderSettings=asyncHandler(async(req,res)=>{
  await preference(req);
  const allowed=Object.keys(pickReminderSettings());
  const changes=Object.fromEntries(Object.entries(req.body).filter(([key])=>allowed.includes(key)));
  const pref=await ReminderPreference.findOneAndUpdate(scope(req),{$set:changes},{new:true,runValidators:true});
  return successResponse(res,"Reminder settings saved",{settings:pickReminderSettings(pref)});
});
export const readReminders=asyncHandler(async(req,res)=>{
  await preference(req);
  const pref=await ReminderPreference.findOneAndUpdate(scope(req),{$addToSet:{readKeys:{$each:req.body.ids}}},{new:true});
  // Bound per-user history. This never changes a fee balance or resolves a due.
  if(pref.readKeys.length>10000)await ReminderPreference.updateOne(scope(req),{$pull:{readKeys:{$in:pref.readKeys.slice(0,pref.readKeys.length-10000)}}});
  return successResponse(res,"Reminders marked read",{});
});
export const claimDailyFlash=asyncHandler(async(req,res)=>{
  const pref=await preference(req);
  const kind=req.body.kind,field=kind==="birthday"?"birthdayFlashDay":"dueFlashDay";
  if(!pref.flash||!(kind==="birthday"?pref.birthdays:pref.dues))return successResponse(res,"Flash disabled",{claimed:false});
  const today=todayDateKey(new Date(),zone(req));
  const claimed=await ReminderPreference.findOneAndUpdate({...scope(req),[field]:{$ne:today}},{$set:{[field]:today}},{new:true});
  return successResponse(res,"Daily flash checked",{claimed:Boolean(claimed),today});
});
