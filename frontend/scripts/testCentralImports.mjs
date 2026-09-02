import test from 'node:test';
import assert from 'node:assert/strict';
import { directory, suggest, attendancePayloads, chunks, safeCsv } from '../src/pages/imports/importLogic.js';
import { fillImportedStudentFields, replaceReviewedStudentFields } from '../../backend/src/utils/fillImportedStudentFields.js';
const existing = [{ _id:'s1', firstName:'Adi', lastName:'Jain', phone:'9999999999', batch:'b1', dateOfBirth:'2010-01-01' }];
const item = { name:'Adi Jain', phone:'9999999999', row:{} };
test('name and phone must agree; phone-only does not auto-match', () => {
 assert.equal(suggest(item,existing,'b1').value,'s1');
 assert.equal(suggest({...item,name:'Other Student'},existing,'b1').value,'');
 assert.equal(suggest({...item,phone:''},existing,'b1').value,'');
});
test('DOB conflict and other batch cannot auto-match', () => {
 assert.equal(suggest({...item,row:{dateOfBirth:'2011-01-01'}},existing,'b1').value,'');
 assert.equal(suggest(item,existing,'b2').value,'');
});
test('siblings sharing phone require review even with matching name', () => {
 assert.equal(suggest(item,[...existing,{_id:'s2',name:'Sibling',phone:item.phone,batch:'b1'}],'b1').value,'');
});
test('record and attendance-only players are both discoverable', () => {
 const blocks=[{blockId:'jan',rows:[{name:'Adi Jain',sourceSheet:'26 - Attandance',rowNumber:495,attendance:[{date:'2026-01-01',status:'present'}]},{name:'Record Player',sourceSheet:'26 - Attandance',rowNumber:496}]}];
 const result=directory([{name:'Record Player',sourceRowKey:'Record:3',sourceSheet:'Record'}],blocks);
 assert.equal(result.length,2); assert.equal(result[0].attendance.length,1); assert.equal(result[1].name,'Adi Jain'); assert.equal(result[1].record,false);
 const payloads=attendancePayloads([result[1]],{[result[1].key]:'s1'},'b1','skip');
 assert.equal(payloads.length,1); assert.equal(payloads[0].rows.length,1); assert.deepEqual(Object.values(payloads[0].resolutions),['s1']);
 assert.deepEqual(attendancePayloads(result,{},'b1','skip'),[]);
});
test('same-name record ambiguity is not silently merged with attendance', () => {
 const result=directory([{name:'Same',sourceRowKey:'r1'},{name:'Same',sourceRowKey:'r2'}],[{blockId:'jan',rows:[{name:'Same',sourceSheet:'a',rowNumber:4}]}]);
 assert.equal(result.length,3); assert.equal(result[2].record,false);
});
test('fill-empty cannot overwrite existing data or invent defaults', () => {
 const current={name:'Kept',phone:'',countryCode:'+91',schoolName:'Kept school',joiningDate:null,heightCm:0};
 const normalized={phone:'1234567',countryCode:'+44',schoolName:'New school',joiningDate:new Date(),beltRank:'White',heightCm:180};
 const changed=fillImportedStudentFields(current,normalized,{phone:'1234567',countryCode:'+44',schoolName:'New school',heightCm:180});
 assert.deepEqual(changed,['phone']); assert.equal(current.schoolName,'Kept school'); assert.equal(current.joiningDate,null); assert.equal(current.countryCode,'+44'); assert.equal(current.heightCm,0); assert.equal(current.beltRank,undefined);
});
test('chunks are bounded and CSV formula prefixes are neutralized', () => {
 assert.deepEqual(chunks(Array.from({length:201},(_,i)=>({i}))).map(c=>c.length),[100,100,1]);
 assert.throws(()=>chunks([{a:'x'.repeat(800001)}]),/too large/);
 assert.equal(safeCsv([['=CMD()', 'safe']]),'"\'=CMD()","safe"');
});
test('reviewed replacement only changes explicitly allowed supplied fields', () => {
 const current={schoolName:'Old',phone:'111',firstName:'Original',academy:'safe'};
 const normalized={schoolName:'New',phone:'222',firstName:'Changed',academy:'wrong'};
 const result=replaceReviewedStudentFields(current,normalized,{...normalized,replaceFields:['schoolName','firstName','academy']});
 assert.deepEqual(result,['schoolName']); assert.equal(current.schoolName,'New'); assert.equal(current.phone,'111'); assert.equal(current.firstName,'Original'); assert.equal(current.academy,'safe');
});
