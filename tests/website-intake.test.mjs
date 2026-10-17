import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {validateForm,createIntakeHandler} from '../supabase/functions/website-intake/handler.js';
const valid = () => ({requestId:randomUUID(),requestType:'詢價',contactName:'測試客戶',phone:'0900-000-000',company:'測試公司',service:'清潔維護',location:'測試地點',details:'測試內容',consent:true,consentVersion:'2026-10-17'});
const request = (body, options={}) => new Request('https://example.invalid',{method:'POST',headers:{origin:'https://www.oak-environment.com.tw','content-type':'application/json'},body:JSON.stringify(body),...options});
test('intake validates consent and field limits, drops unauthorized fields',()=>{
  assert.equal(validateForm({...valid(),status:'已完成',receivedAt:'forged'}).status,undefined);
  for(const patch of [{consent:false},{phone:'abc'},{contactName:' '},{details:'a'.repeat(1501)},{website:'bot'},{service:'bad'},{requestId:'bad'}]) assert.throws(()=>validateForm({...valid(),...patch}));
});
test('appointment validates real calendar date, Taipei day and required times',()=>{
  const body={...valid(),requestType:'預約服務',preferredDate:'2026-10-17',preferredTime:'上午'};
  assert.equal(validateForm(body,'2026-10-17').preferredDate,'2026-10-17');
  for(const date of ['2026-02-30','2026-10-16','invalid']) assert.throws(()=>validateForm({...body,preferredDate:date},'2026-10-17'));
  assert.throws(()=>validateForm({...body,preferredTime:''},'2026-10-17'));
});
test('intake only returns receipt after storage success; never returns contact data',async()=>{
  let saved;
  const handler=createIntakeHandler({save:async(id,payload)=>{saved=payload;return id;}});
  const body=valid(); const response=await handler(request(body));
  assert.equal(response.status,200); assert.deepEqual(await response.json(),{ok:true,receipt:body.requestId});
  assert.equal(saved.contactName,body.contactName);
});
test('intake rejects wrong origins, methods, malformed and oversized bodies before saving',async()=>{
  let saves=0; const handler=createIntakeHandler({save:async()=>{saves++;}});
  assert.equal((await handler(request(valid(),{headers:{origin:'https://evil.invalid','content-type':'application/json'}}))).status,403);
  assert.equal((await handler(request(valid(),{method:'GET',body:undefined}))).status,405);
  assert.equal((await handler(request(valid(),{body:'x'.repeat(12001)}))).status,413);
  assert.equal((await handler(request(valid(),{body:'not-json'}))).status,400);
  assert.equal((await handler(request(valid(),{method:'OPTIONS',body:undefined}))).status,204);
  assert.equal(saves,0);
});
test('intake does not report false success on disabled, conflict, rate-limit or DB failure',async()=>{
  for(const [error,status] of [['INTAKE_DISABLED',503],['REQUEST_CONFLICT',409],['RATE_LIMITED',429],['private database error',503]]) {
    const handler=createIntakeHandler({save:async()=>{throw new Error(error);}});
    const result=await handler(request(valid())); assert.equal(result.status,status);
    assert.doesNotMatch(await result.text(),/private database error/);
  }
});
