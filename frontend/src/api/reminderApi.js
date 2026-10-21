import api from "./api.js";
export const reminderApi={
  get:()=>api.get("/academy-reminders",{timeout:75000}),
  settings:settings=>api.patch("/academy-reminders/settings",settings),
  flash:kind=>api.post("/academy-reminders/flash",{kind}),
  read:async ids=>{for(let i=0;i<ids.length;i+=500)await api.patch("/academy-reminders/read",{ids:ids.slice(i,i+500)});},
};
