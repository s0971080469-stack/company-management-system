import test from 'node:test';
import assert from 'node:assert/strict';
import {handleAnalytics, monthRange, normalizeAnalytics} from '../server/websiteAnalytics.js';
import {loadWebsiteAnalytics} from '../src/websiteAnalytics.js';

const now=new Date('2026-10-17T03:30:00Z');
const request=(month='2026-10',token='session')=>new Request(`https://oak.boats/api/website-analytics?month=${month}`,{headers:token?{Authorization:`Bearer ${token}`}:{}});
const fixtures={total:{data:[{environment:'production',pageviews:20,visitors:5}]},trend:{data:[{timestamp:'2026-10-16T00:00:00Z',pageviews:8,visitors:4},{timestamp:'2026-10-17T00:00:00Z',pageviews:12,visitors:4}]}};
test('UTC month range excludes next month and rejects invalid/out-of-window months',()=>{
  assert.deepEqual(monthRange('2026-09',now),{since:'2026-09-01T00:00:00.000Z',until:'2026-09-30T23:59:59.999Z'});
  assert.equal(monthRange('2026-10',now).until,now.toISOString());
  for (const month of ['', '2026-13','2025-10','2026-11',"2026-10&projectId=other"]) assert.throws(()=>monthRange(month,now));
});
test('uses whole-month visitor total, zero-fills sparse days without summing visitors',()=>{
  const result=normalizeAnalytics('2026-10',fixtures.total,fixtures.trend,now);
  assert.equal(result.views,20);assert.equal(result.visitors,5);assert.equal(result.daily.length,7);
  assert.equal(result.daily[0].views,0);assert.equal(result.daily.at(-1).views,12);
  assert.equal(normalizeAnalytics('2026-10',{data:[]},{data:[]},now).views,0);
});
test('malformed or wrong-scope upstream data never becomes zero',()=>{
  for (const total of [{},{data:[{}]},{data:[{environment:'preview',pageviews:1,visitors:1}]},{data:[{environment:'production',pageviews:'20',visitors:2}]}]) assert.throws(()=>normalizeAnalytics('2026-10',total,fixtures.trend,now));
  assert.throws(()=>normalizeAnalytics('2026-10',fixtures.total,{data:[{timestamp:'2026-09-30',pageviews:1}]},now));
});
test('anonymous and missing-configuration requests fail closed; no secrets in response',async()=>{
  let called=0;
  const fetcher=async()=>{called++;throw new Error('must not call');};
  assert.equal((await handleAnalytics(request('2026-10',null),{now,fetcher})).status,401);
  const response=await handleAnalytics(request(),{now,fetcher,env:{},authorizeUser:async()=>{}});
  assert.equal(response.status,503);assert.equal(called,0);
  assert.equal(response.headers.get('cache-control'),'private, no-store');
});
test('unauthorized user cannot reach the analytics provider',async()=>{
  let called=false;
  const response=await handleAnalytics(request(),{now,env:{OAK_ANALYTICS_TOKEN:'test-server-secret'},authorizeUser:async()=>{throw new Error('denied');},fetcher:async()=>{called=true;}});
  assert.equal(response.status,502);assert.equal(called,false);
});
test('only two production reads target the fixed website; no write APIs',async()=>{
  const urls=[];
  const response=await handleAnalytics(request(),{now,env:{OAK_ANALYTICS_TOKEN:'test-server-secret'},authorizeUser:async(token)=>assert.equal(token,'session'),fetcher:async(url,options)=>{
    urls.push(url);assert.equal(options.headers.Authorization,'Bearer test-server-secret');
    assert.equal(url.hostname,'api.vercel.com');assert.equal(url.searchParams.get('projectId'),'oak-environment-website');
    assert.equal(url.searchParams.get('filter'),"environment eq 'production'");
    return Response.json(url.searchParams.get('by')==='day'?fixtures.trend:fixtures.total);
  }});
  assert.equal(response.status,200);assert.equal(urls.length,2);
  const text=await response.text();assert.doesNotMatch(text,/test-server-secret|session/);
});
test('upstream permission failure never returns fake zero metrics',async()=>{
  const response=await handleAnalytics(request(),{now,env:{OAK_ANALYTICS_TOKEN:'test-server-secret'},authorizeUser:async()=>{},fetcher:async()=>new Response('private-error',{status:403})});
  assert.equal(response.status,502);assert.doesNotMatch(await response.text(),/private-error|"views":0/);
});
test('client calls same-origin API with user session, no server credentials',async()=>{
  const data=normalizeAnalytics('2026-10',fixtures.total,fixtures.trend,now);
  const client={auth:{getSession:async()=>({data:{session:{access_token:'session'}}})}};
  const result=await loadWebsiteAnalytics(client,'2026-10',{fetcher:async(url,options)=>{
    assert.equal(url,'/api/website-analytics?month=2026-10');assert.equal(options.headers.Authorization,'Bearer session');return Response.json(data);
  }});
  assert.deepEqual(result,data);
  await assert.rejects(loadWebsiteAnalytics(client,'2026-10',{fetcher:async()=>new Response('<html>SPA fallback</html>')}),/尚未部署/);
  await assert.rejects(loadWebsiteAnalytics(client,'2026-10',{fetcher:async()=>Response.json({...data,month:'2026-09'})}),/格式不符/);
});
