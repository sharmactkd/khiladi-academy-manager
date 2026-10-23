import test from "node:test";
import assert from "node:assert/strict";
import {scheduleInitialReminderRefresh} from "../src/components/notifications/reminderScheduling.js";
const fixture = path => {
  const listeners=new Map(),timers=new Map();let id=0;
  return {location:{pathname:path},listeners,timers,
    addEventListener(name,fn){listeners.set(name,fn);},removeEventListener(name,fn){if(listeners.get(name)===fn)listeners.delete(name);},
    setTimeout(fn,ms){timers.set(++id,{fn,ms});return id;},clearTimeout(id){timers.delete(id);},
  };
};
test("direct attendance visits defer reminders until register completes, only once",()=>{
  const target=fixture("/attendance");let calls=0;
  scheduleInitialReminderRefresh(()=>calls++,target);
  assert.equal(calls,0);assert.equal([...target.timers.values()][0].ms,10000);
  const ready=target.listeners.get("khiladi:attendance-ready");ready();ready();
  assert.equal(calls,1);assert.equal(target.timers.size,0);assert.equal(target.listeners.size,0);
});
test("a failed or abandoned register has a bounded reminder fallback",()=>{
  const target=fixture("/attendance/");let calls=0;
  scheduleInitialReminderRefresh(()=>calls++,target);
  [...target.timers.values()][0].fn();assert.equal(calls,1);assert.equal(target.listeners.size,0);
});
test("cleanup prevents old academy callbacks and other routes schedule immediately",()=>{
  const target=fixture("/attendance");let calls=0;
  const cancel=scheduleInitialReminderRefresh(()=>calls++,target),ready=target.listeners.get("khiladi:attendance-ready");
  cancel();ready();assert.equal(calls,0);assert.equal(target.timers.size,0);
  const dashboard=fixture("/dashboard");scheduleInitialReminderRefresh(()=>calls++,dashboard);
  assert.equal([...dashboard.timers.values()][0].ms,0);
  [...dashboard.timers.values()][0].fn();assert.equal(calls,1);
});
