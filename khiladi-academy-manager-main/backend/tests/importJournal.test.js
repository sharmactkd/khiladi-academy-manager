import test from 'node:test';
import assert from 'node:assert/strict';
import { ImportSession, ImportChunk } from '../src/models/ImportSession.js';
import { importJournal } from '../src/middlewares/importJournal.js';

test('journal replays confirmed chunks and blocks changed/uncertain duplicates without DB', async () => {
 const old={find:ImportSession.findOne,create:ImportChunk.create,chunk:ImportChunk.findOne,update:ImportChunk.updateOne};
 const entries=new Map();
 try {
  ImportSession.findOne=async()=>({_id:'job',mode:'both',save:async()=>{}});
  ImportChunk.create=async value=>{if(entries.has(value._id)){const e=new Error('duplicate');e.code=11000;throw e;} entries.set(value._id,{...value});return value;};
  ImportChunk.findOne=async q=>entries.get(`${q.session}:${q.key}`);
  ImportChunk.updateOne=async(q,update)=>Object.assign(entries.get(q._id),update.$set);
  const req={baseUrl:'/api/students',academyId:'a',user:{_id:'u'},body:{importSessionId:'job',importChunkKey:'students-0',students:[{name:'Example'}]}};
  const response=()=>({statusCode:200,status(code){this.statusCode=code;return this;},json(body){this.body=body;return this;}});
  let executions=0;
  const first=response(); await importJournal(req,first,()=>{executions++;}); await first.json({success:true,data:{imported:1}});
  const replay=response(); await importJournal(req,replay,()=>{executions++;}); assert.equal(executions,1); assert.equal(replay.body.data.imported,1);
  const altered=response(); await importJournal({...req,body:{...req.body,students:[]}},altered,()=>{executions++;}); assert.equal(altered.statusCode,409);
  entries.get('job:students-0').status='running';
  const uncertain=response(); await importJournal(req,uncertain,()=>{executions++;}); assert.equal(uncertain.statusCode,409); assert.equal(executions,1);
 } finally {ImportSession.findOne=old.find;ImportChunk.create=old.create;ImportChunk.findOne=old.chunk;ImportChunk.updateOne=old.update;}
});
