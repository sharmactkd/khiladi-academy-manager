import test from 'node:test';
import assert from 'node:assert/strict';
import {whatsappPhone,buildWhatsAppReminder,defaultReminderSettings,desktopReminderUrl,reminderDate,reminderPeriod} from '../src/components/attendance/whatsappReminder.js';
test('formatted, prefixed and invalid phones',()=>{
  for(const phone of ['9876-54-3210','+91 9876543210','919876543210','00919876543210']) assert.equal(whatsappPhone(phone),'919876543210');
  assert.equal(whatsappPhone('+44 7700 900123','44'),'447700900123');
  for(const phone of ['-','', '1234', '9876543210 / 9999999999']) assert.throws(()=>whatsappPhone(phone));
});
test('student, due, QR and UPI are encoded as text with fixed WhatsApp origin',()=>{
  const url=new URL(buildWhatsAppReminder({name:'Adi & Jain',contact:'9876543210',membership:{effectiveDueDate:'2026-09-05',unpaidMonths:2}},'2M DUE',{...defaultReminderSettings,qrUrl:'https://example.com/qr.png',upiId:'academy@upi'}));
  assert.equal(url.origin,'https://wa.me');
  assert.equal(url.pathname,'/919876543210');
  assert.match(url.searchParams.get('text'),/5 September 2026/);
  assert.match(url.searchParams.get('text'),/Payment QR: https:\/\/example.com\/qr.png/);
  assert.match(url.searchParams.get('text'),/UPI ID: academy@upi/);
});
test('exact friendly reminder and desktop link preserve text and recipient',()=>{
 const web=buildWhatsAppReminder({contact:'9876543210',feePaidDate:'2026-07-29',feeDueDate:'15-08-2026'},'DUE',defaultReminderSettings);
 const expected='This is a friendly reminder for Martial Arts class fee\n\nLast Paid - 29 July 2026\nDue Date - 15 August 2026\n\n(From 15 August to 14 September)';
 assert.equal(new URL(web).searchParams.get('text'),expected);
 const desktop=new URL(desktopReminderUrl(web));
 assert.equal(desktop.protocol,'whatsapp:');
 assert.equal(desktop.searchParams.get('phone'),'919876543210');
 assert.equal(desktop.searchParams.get('text'),expected);
});
test('invalid dates are not guessed; month and year boundaries',()=>{
 assert.equal(reminderDate('31-02-2026'),null);
 assert.equal(reminderDate('15'),null);
 assert.equal(reminderPeriod(reminderDate('2026-12-15')),'(From 15 December 2026 to 14 January 2027)');
 assert.equal(reminderPeriod(reminderDate('2028-01-31')),'(From 31 January to 28 February)');
});
test('QR rejects executable and local URLs',()=>{
  for(const qrUrl of ['javascript:alert(1)','file:///qr.png','http://localhost/qr.png']) assert.throws(()=>buildWhatsAppReminder({contact:'9876543210'},'DUE',{...defaultReminderSettings,qrUrl}));
});
test('Prijal reminder uses rendered calendar dates, not previous UTC day',()=>{
 const row={rowType:'student',studentId:'prijal',contact:'9876543210',membership:{effectiveDueDate:'2026-09-09T18:30:00.000Z'},feePaidDate:'4/24/26'};
 const message=new URL(buildWhatsAppReminder(row,'DUE',defaultReminderSettings,{dueDate:'10-09-2026',paidDate:'24-04-2026'})).searchParams.get('text');
 assert.match(message,/Last Paid - 24 April 2026/);
 assert.match(message,/Due Date - 10 September 2026/);
 assert.match(message,/\(From 10 September to 9 October\)/);
 assert.equal(reminderDate('4/24/26').toISOString(),'2026-04-24T00:00:00.000Z');
});
test('raw rows use imported paid date before fee date',()=>{
 const message=new URL(buildWhatsAppReminder({contact:'9876543210',importedPaidDate:'4/24/26',feePaidDate:'2026-04-25'},'DUE',defaultReminderSettings)).searchParams.get('text');
 assert.match(message,/Last Paid - 24 April 2026/);
});
test('pending fee line is added only for more than one month',()=>{
 for(const months of [0,1,2,24]) {
  const message=new URL(buildWhatsAppReminder({contact:'9876543210',membership:{unpaidMonths:months},feeDueDate:'2026-09-10'},'DUE',defaultReminderSettings)).searchParams.get('text');
  if(months>1) assert.match(message,new RegExp(`Pending Fee - ${months} months`));
  else assert.doesNotMatch(message,/Pending Fee/);
 }
 const message=new URL(buildWhatsAppReminder({contact:'9876543210'},'2M DUE',defaultReminderSettings)).searchParams.get('text');
 assert.match(message,/Pending Fee - 2 months/);
});
