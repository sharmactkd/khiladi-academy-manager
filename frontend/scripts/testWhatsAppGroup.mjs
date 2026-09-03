import test from 'node:test';
import assert from 'node:assert/strict';
import {validateGroupLink,groupAnnouncement} from '../src/components/communication/whatsappGroup.js';
test('only valid WhatsApp group invite origin is accepted',()=>{
 assert.equal(validateGroupLink(''),'');
 assert.equal(validateGroupLink('https://chat.whatsapp.com/AbCd123'),'https://chat.whatsapp.com/AbCd123');
 for(const value of ['javascript:alert(1)','https://evil.test/ABC','https://chat.whatsapp.com.evil.test/ABC','https://user@chat.whatsapp.com/ABC','https://chat.whatsapp.com/','http://chat.whatsapp.com/ABC']) assert.throws(()=>validateGroupLink(value));
});
test('group text uses collective greeting without student identity',()=>{
 assert.equal(groupAnnouncement('Hello {name}\n{group}\n{academy}','Academy','Master batch'),'Hello everyone\nMaster batch\nAcademy');
});
test('unfinished and fee-specific template fields are blocked',()=>{
 for(const text of ['', 'Closed [date]', 'Fee {dueDate}', 'Last Paid {lastPaid}', '{months}']) assert.throws(()=>groupAnnouncement(text,'Academy','Group'));
});
