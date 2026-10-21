import test from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
process.env.MONGO_URI ||= "mongodb://127.0.0.1:27017/reminder_test";
process.env.JWT_ACCESS_SECRET ||= "reminder-test-access-at-least-32-characters";
process.env.JWT_REFRESH_SECRET ||= "reminder-test-refresh-at-least-32-characters";
const {default:ReminderPreference}=await import("../src/models/ReminderPreference.js");
const {claimDailyFlash}=await import("../src/controllers/academyReminderController.js");
const {buildBranchAccessFilter}=await import("../src/services/branchAccessService.js");
const {default:router}=await import("../src/routes/academyReminderRoutes.js");
const {allowAcademyManagement}=await import("../src/middlewares/roleMiddleware.js");
const {protect}=await import("../src/middlewares/authMiddleware.js");
const {resolveUserAcademy,requireResolvedAcademy}=await import("../src/middlewares/academyAccessMiddleware.js");
const response=()=>({locals:{},status(code){this.code=code;return this;},json(value){this.body=value;return this;}});

test("daily flash is atomically claimed once per user, academy and kind",async t=>{
 t.mock.method(ReminderPreference,"init",async()=>{});
 const states=new Map();
 t.mock.method(ReminderPreference,"findOneAndUpdate",async(filter,update)=>{
  const key=`${filter.academy}:${filter.user}`;
  let state=states.get(key);
  if(update.$setOnInsert){if(!state){state={flash:true,birthdays:true,dues:true};states.set(key,state);}return state;}
  const field=filter.birthdayFlashDay?"birthdayFlashDay":"dueFlashDay";
  if(state[field]===filter[field].$ne)return null;
  Object.assign(state,update.$set);return state;
 });
 const req={academyId:"academy-a",user:{_id:"owner-a"},body:{kind:"birthday"}};
 const first=response(),second=response();
 await Promise.all([claimDailyFlash(req,first),claimDailyFlash(req,second)]);
 assert.equal([first.body.data.claimed,second.body.data.claimed].filter(Boolean).length,1);
 const due=response();await claimDailyFlash({...req,body:{kind:"due"}},due);assert.equal(due.body.data.claimed,true);
 const other=response();await claimDailyFlash({...req,academyId:"academy-b"},other);assert.equal(other.body.data.claimed,true);
});

test("assistant reminders use assigned branch IDs and no-assignment filter denies rows",()=>{
 const id=new mongoose.Types.ObjectId();
 assert.deepEqual(buildBranchAccessFilter({role:"assistant_coach",$locals:{authorizedBranchIds:[id]}}),{branch:{$in:[id]}});
 assert.deepEqual(buildBranchAccessFilter({role:"assistant_coach"}),{branch:{$in:[]}});
});

test("parents cannot access management reminders and routes enforce academy resolution",()=>{
 const res=response();let allowed=false;
 allowAcademyManagement({user:{role:"parent"}},res,()=>{allowed=true;});
 assert.equal(allowed,false);assert.equal(res.code,403);
 const middleware=router.stack.filter(layer=>!layer.route).map(layer=>layer.handle);
 assert.deepEqual(middleware.slice(0,4),[protect,allowAcademyManagement,resolveUserAcademy,requireResolvedAcademy]);
});

test("reading reminders never modifies membership balances",()=>{
 const indexes=ReminderPreference.schema.indexes();
 assert.ok(indexes.some(([keys,options])=>keys.academy===1&&keys.user===1&&options.unique));
 assert.equal(ReminderPreference.schema.path("unpaidMonths"),undefined);
});
