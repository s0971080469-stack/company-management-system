import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { readFile } from 'node:fs/promises';
import { build } from 'esbuild';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { dashboardFixture } from './fixtures/dashboard-overview.js';

const bundle = await build({entryPoints:[fileURLToPath(new URL('../src/DashboardOverview.jsx',import.meta.url))],bundle:true,platform:'node',format:'cjs',write:false,packages:'external',loader:{'.css':'empty'},logLevel:'silent'});
const mod = {exports:{}};
new Function('require','module','exports',bundle.outputFiles[0].text)(createRequire(import.meta.url),mod,mod.exports);
const Dashboard = mod.exports.default;
const props = (mode='normal', admin=true) => ({...dashboardFixture(mode, admin),navigate:()=>{},StatusBadge:({status})=>React.createElement('span',null,status)});
const render = data => renderToStaticMarkup(React.createElement(Dashboard, data));
function nodes(element) {
  if (element == null || typeof element !== 'object') return [];
  if (Array.isArray(element)) return element.flatMap(nodes);
  return [element,...nodes(element.props?.children)];
}

test('總覽改版保留三項金額、統計期間及營運數字，不改寫傳入資料', () => {
  const data=props();const before=JSON.stringify(data);const html=render(data);
  for(const text of ['1,299,778','658,400','86,750','民國 115 年 9 月','民國 115 年 10 月','共登錄 62 位','共 29 份契約','往來廠商共 51 家','8,628,000','5,876,400','2,751,600']) assert.ok(html.includes(text),text);
  assert.match(html,/aria-valuenow="65"/);assert.equal(JSON.stringify(data),before);
});
test('到期提醒保持原導向，未入帳提醒顯示客戶、金額與等待天數', () => {
  const data=props();const targets=[];data.navigate=value=>targets.push(value);
  nodes(Dashboard(data)).filter(n=>n.type==='button').forEach(n=>n.props.onClick());
  assert.deepEqual(targets,['vehicles','billing','contracts']);
  const html=render(data);for(const text of ['示範科技有限公司','已等待 62 天','126,000','I-115-018','115/08/18']) assert.ok(html.includes(text),text);
});
test('一般人員不顯示管理員的待核准區塊', () => {
  assert.match(render(props()),/公司應付款項待核准/);
  assert.doesNotMatch(render(props('normal',false)),/公司應付款項待核准/);
});
test('空資料明確呈現零值與無資料，不產生 NaN 或無效占比', () => {
  const html=render(props('empty'));
  for(const text of ['本期無適用契約','目前沒有待處理事項','本月尚無支出紀錄','最新動態將顯示於此']) assert.ok(html.includes(text),text);
  assert.match(html,/aria-valuenow="0"/);assert.doesNotMatch(html,/NaN|Infinity|發票超過 45 天/);
});
test('50筆動態全部保留，民國日期含秒及異動人員仍顯示', () => {
  const data=props('many');const html=render(data);
  assert.equal((html.match(/class="overview-activity-item /g)||[]).length,50);
  assert.ok(html.includes(data.recentActivity.at(-1).text));assert.match(html,/16:35:24/);assert.match(html,/行政同仁（示範）/);
});
test('負額淨額與支出調整忠實顯示，長內容與特殊字元安全轉義', () => {
  const data=props();data.summary.income=0;data.summary.expense=100;
  data.categories=[{name:'費用調整 <script>測試</script>',value:-100},{name:'其他',value:0}];
  const html=render(data);assert.match(html,/NT\$ -100/);assert.match(html,/overview-tone--red/);assert.match(html,/請依下方明細檢視/);assert.match(html,/&lt;script&gt;/);assert.doesNotMatch(html,/<script>|NaN|Infinity/);
});
test('測試頁只使用顯示元件與模擬資料，不匯入正式儲存層；動態有固定高度與獨立捲軸', async () => {
  const preview=await readFile(new URL('./previews/dashboard-overview.jsx',import.meta.url),'utf8');
  assert.match(preview,/import\.meta\.env\.DEV/);assert.match(preview,/DashboardOverview/);assert.doesNotMatch(preview,/supabase|AuthGate|storage\.js|App\.jsx/);
  const css=await readFile(new URL('../src/DashboardOverview.css',import.meta.url),'utf8');
  assert.match(css,/overview-secondary-grid > \.overview-panel \{ height:460px/);
  assert.match(css,/overview-activity-list \{[^}]*min-height:0;[^}]*overflow-y:auto;[^}]*overscroll-behavior:contain/);
});
