import test from "node:test";
import assert from "node:assert/strict";
import {buildReminderEvents} from "../src/utils/reminderEvents.js";
const student={_id:"a",firstName:"Arnav",lastName:"New",dateOfBirth:"2015-10-21",status:"active"};
const now=new Date("2026-10-20T19:00:00Z");
test("birthdays follow India date, include yesterday/upcoming and cross year correctly",()=>{
 const result=buildReminderEvents({now,students:[student,{...student,_id:"b",dateOfBirth:"2012-10-20"},{...student,_id:"c",dateOfBirth:"2013-10-23"}]});
 assert.equal(result.today,"2026-10-21");
 assert.deepEqual(result.events.map(e=>e.offset),[-1,0,2]);
 assert.equal(result.events.find(e=>e.studentId==="a").age,11);
 const year=buildReminderEvents({now:new Date("2026-12-30"),students:[{...student,dateOfBirth:"2015-01-02"}]});
 assert.equal(year.events[0].date,"2027-01-02");
});
test("February 29 is February 28 in non-leap years; invalid and future DOBs are ignored",()=>{
 const result=buildReminderEvents({now:new Date("2027-02-28"),students:[{...student,dateOfBirth:"2016-02-29"},{...student,_id:"b",dateOfBirth:"invalid"},{...student,_id:"c",dateOfBirth:"2030-02-28"}]});
 assert.equal(result.events.length,1);assert.equal(result.events[0].offset,0);
});
test("due dates resolve paid/waived/paused/remaining-days and inactive exclusions",()=>{
 const students=Array.from({length:7},(_,i)=>({...student,_id:String(i),status:i===6?"inactive":"active"}));
 const memberships=students.map(s=>({student:s._id,effectiveDueDate:"2026-10-21",feeRequired:true,...({1:{manualFeeStatus:"paid"},2:{feeStatus:"waived"},3:{status:"paused"},4:{remainingTrainingDays:5},5:{dueDateCleared:true}}[s._id]||{})}));
 const result=buildReminderEvents({now,students,memberships,settings:{birthdays:false}});
 assert.deepEqual(result.events.map(e=>e.studentId),["0"]);
 const paid=buildReminderEvents({now,students:[student],memberships:[{student:"a",effectiveDueDate:"2026-11-21",nextDueDate:"2026-11-21"}],settings:{birthdays:false}});
 assert.equal(paid.events.length,0);
});
test("upcoming and overdue labels follow selected range without inventing amount",()=>{
 const result=buildReminderEvents({now,students:[student],memberships:[{student:"a",effectiveDueDate:"2026-10-19",unpaidMonths:1}],settings:{birthdays:false}});
 assert.equal(result.events[0].offset,-2);assert.equal(result.events[0].amount,undefined);
});
