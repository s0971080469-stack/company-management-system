import test from 'node:test';
import assert from 'node:assert/strict';
import {loadWebsiteInbox, updateWebsiteStatus} from '../src/websiteInbox.js';
function client({member=true, fail=false, conflict=false}={}) {
  const row={id:'a',version:1,received_at:'2026-10-17T02:00:00Z',status:'待處理',payload:{contactName:'測試',requestType:'詢價',service:'清潔維護'}};
  return {auth:{getUser:async()=>({data:{user:{id:'owner'}}})},from(table) {
    let update;
    const query={select(){return query;},eq(){return query;},order(){return query;},update(v){update=v;return query;},single(){return Promise.resolve({data:{intake_enabled:false}});},range(){return Promise.resolve({data:[row]});},then(resolve){return Promise.resolve(table==='website_form_members'? {data:member?[{user_id:'owner'}]:[]} : {error:fail?new Error('failed'):null,data:conflict?[]:[{...row,status:update.status,version:2}]}).then(resolve);}};
    return query;
  }};
}
test('inbox loads only after membership check and maps public form fields',async()=>{
  const result=await loadWebsiteInbox(client());
  assert.equal(result.enabled,false); assert.equal(result.rows[0].name,'測試'); assert.equal(result.rows[0].type,'服務詢價');
  await assert.rejects(()=>loadWebsiteInbox(client({member:false})),/權限/);
});
test('status saves use version checks and reject missing rows or permission failures',async()=>{
  const row={id:'a',version:1};
  assert.equal((await updateWebsiteStatus(client(),row,'已完成')).version,2);
  for(const options of [{fail:true},{conflict:true}]) await assert.rejects(()=>updateWebsiteStatus(client(options),row,'已完成'),/儲存失敗/);
  await assert.rejects(()=>updateWebsiteStatus(client(),row,'fake'),/無效/);
});
