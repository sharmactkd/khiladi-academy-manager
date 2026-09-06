import test from 'node:test';
import assert from 'node:assert/strict';
import {initialAnnouncement,generateAnnouncement,addCalendarDays,inclusiveDays,todayDate} from '../src/components/communication/announcementBuilder.js';
import {groupChoices} from '../src/components/communication/whatsappGroup.js';
test('holiday defaults to local today and one inclusive day',()=>{
 const f=initialAnnouncement();assert.equal(f.start,todayDate());assert.equal(f.end,f.start);assert.match(generateAnnouncement(f),/Holiday: 1 day/);
});
test('holiday range crosses months and leap days correctly',()=>{
 assert.equal(addCalendarDays('2028-02-28',2),'2028-03-01');assert.equal(inclusiveDays('2026-12-31','2027-01-02'),3);
 const message=generateAnnouncement({...initialAnnouncement(),start:'2026-12-31',end:'2027-01-02'});
 assert.match(message,/Holiday: 3 days/);assert.match(message,/Classes resume: 3 January 2027/);
});
test('bad and reversed dates are rejected',()=>{
 for(const end of ['2026-02-30','2026-01-01','']) assert.throws(()=>generateAnnouncement({...initialAnnouncement(),start:'2026-02-01',end}));
});
test('sickness and event messages have ready text',()=>{
 assert.match(generateAnnouncement({...initialAnnouncement(),type:'sickness'}),/instructor illness/);
 assert.match(generateAnnouncement({...initialAnnouncement(),type:'belt',venue:'Main hall'}),/Venue: Main hall/);
 assert.match(generateAnnouncement({...initialAnnouncement(),type:'championship',event:'Open Cup'}),/Championship: Open Cup/);
});
test('profile group precedes saved and other destinations',()=>{
 const batch={id:'batch:1',name:'Master',whatsappGroupLink:'https://chat.whatsapp.com/ABC'};
 const options=groupChoices(batch,[batch,{id:'batch:2',name:'Junior',label:'Batch Junior',whatsappGroupLink:'https://chat.whatsapp.com/DEF'}],{'batch:1':{name:'Alternate',link:'https://chat.whatsapp.com/GHI'}});
 assert.equal(options[0].id,'profile');assert.equal(options[0].name,'Master');assert.equal(options[1].id,'saved');assert.equal(options.length,3);
 assert.equal(groupChoices({id:'branch:1',name:'Branch'},[],{}).length,0);
});
