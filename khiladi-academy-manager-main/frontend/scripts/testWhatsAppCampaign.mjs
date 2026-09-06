import test from 'node:test';
import assert from 'node:assert/strict';
import {buildCampaign} from '../src/components/communication/whatsappCampaign.js';
const students=[
 {_id:'a',firstName:'Active',phone:'9876543210',status:'active'},
 {_id:'b',firstName:'Inactive sibling',phone:'+91 9876543210',status:'inactive'},
 {_id:'c',firstName:'Other',phone:'9876543211',status:'inactive'},
 {_id:'d',firstName:'Missing',phone:'',status:'active'},
];
const settings={countryCode:'91',academyName:'Academy'};
test('only selected recipients are included and siblings share one chat',()=>{
 const result=buildCampaign(students,new Set(['a','b']),'Hi {name} — {academy}',settings);
 assert.equal(result.recipients.length,1);
 assert.equal(result.recipients[0].message,'Hi Active, Inactive sibling — Academy');
 assert.equal(result.recipients[0].phone,'919876543210');
});
test('individual inactive selection does not pull in active students',()=>{
 const result=buildCampaign(students,new Set(['c']),'Hi {name}',settings);
 assert.equal(result.recipients.length,1);
 assert.equal(result.recipients[0].message,'Hi Other');
});
test('invalid numbers are explicitly reported, not silently counted as sent',()=>{
 const result=buildCampaign(students,new Set(['a','d']),'Hello',settings);
 assert.equal(result.invalid.length,1);
 assert.equal(result.invalid[0].id,'d');
 assert.equal(result.recipients.length,1);
});
test('empty and incomplete announcements are blocked',()=>{
 for(const text of ['', 'Closed [dates]']) assert.throws(()=>buildCampaign(students,new Set(['a']),text,settings));
 assert.equal(buildCampaign(students,new Set(),'Hello',settings).recipients.length,0);
});
test('messages use encoded links without payment info leaking into announcements',()=>{
 const result=buildCampaign(students,new Set(['a']),'Hi {name}\nA & B?',{...settings,qrUrl:'https://example.com/qr'});
 assert.equal(new URL(result.recipients[0].url).searchParams.get('text'),'Hi Active\nA & B?');
 assert.doesNotMatch(result.recipients[0].message,/qr/);
});
