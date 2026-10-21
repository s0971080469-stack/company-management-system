import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { reportFixture } from "./fixtures/administration-overview.js";
const bundle=await build({entryPoints:[fileURLToPath(new URL("../src/AdministrationOverview.jsx",import.meta.url))],bundle:true,platform:"node",format:"cjs",write:false,packages:"external",loader:{".css":"empty"},logLevel:"silent"});
const module={exports:{}};
new Function("require","module","exports",bundle.outputFiles[0].text)(createRequire(import.meta.url),module,module.exports);
const {AdministrationHeader,ReportMetrics,PermissionsOverview,PermissionSectionHeading}=module.exports;
const render=(c,p)=>renderToStaticMarkup(React.createElement(c,p));
const nodes=e=>!e||typeof e!=="object"?[]:Array.isArray(e)?e.flatMap(nodes):[e,...nodes(e.props?.children)];

test("年度三項總額保留原值、來源及民國年度，不重新計算",()=>{
  const totals={revenue:1234567890,expense:-100,payroll:0},before=JSON.stringify(totals);
  const html=render(ReportMetrics,{totals,year:115});
  for(const text of ["1,234,567,890","-100","年度營收","年度支出","年度薪資成本","薪資表・全部發放狀態","115 年累計"]) assert.ok(html.includes(text),text);
  assert.equal((html.match(/<article/g)||[]).length,3);assert.equal(JSON.stringify(totals),before);
});
test("權限設定不顯示概況與統計卡，保留標題、新增按鈕及說明",()=>{
  const html=render(PermissionsOverview,{});
  assert.doesNotMatch(html,/帳號與角色概況|billing-metric|<article/);
  for(const text of ["權限設定","新增系統帳號","只能看到自己的出勤紀錄"]) assert.ok(html.includes(text),text);
});
test("不需統計資料即可顯示權限標題，文字安全轉義且不觸發新增",()=>{
  let called=0;
  const html=render(PermissionsOverview,{onNew:()=>called++});
  assert.equal(called,0);assert.ok(!html.includes("NaN"));
  assert.ok(render(AdministrationHeader,{kind:"reports",period:"<script>"}).includes("&lt;script&gt;"));
});
test("新增系統帳號與角色控制項沿用傳入回呼，不自行變更權限",()=>{
  let called=0;
  nodes(AdministrationHeader({kind:"permissions",onNew:()=>called++})).find(n=>n.type==="button").props.onClick();assert.equal(called,1);
  const button=React.createElement("button",{onClick:()=>called++},"新增角色");
  const node=nodes(PermissionSectionHeading({matrix:true,children:button})).find(n=>n.type==="button");
  assert.equal(node,button);node.props.onClick();assert.equal(called,2);
});
test("正式版保留管理員限制、帳號與角色操作及原報表計算來源",async()=>{
  const app=await readFile(new URL("../src/App.jsx",import.meta.url),"utf8");
  const access=app.slice(app.indexOf("function PermissionsView"),app.indexOf("function SysUserForm"));
  assert.ok(access.indexOf("if (!isAdmin)")<access.indexOf("<PermissionsOverview"));
  for(const text of ["onChange={() => toggleCell(r, n.key)}","checked={!!rolePerms.matrix[r]?.[n.key]}","!DEFAULT_ROLES.includes(r)","persist.rolePerms(next)","onClick={addRole}","onClick={() => removeRole(r)}","onNew={() => setModal({ mode: \"new\", data: emptySysUser(roles) })}"]) assert.ok(access.includes(text),text);
  const reports=app.slice(app.indexOf("function ReportsView"),app.indexOf("const VENDOR_COMPANY_OPTIONS"));
  for(const text of ["payrollNet(p)","a.type === \"收入\"","a.type === \"支出\"","e.status === \"在職\"","onYearChange={setYear}","totals={{ revenue: yearRevenueTotal, expense: yearExpenseTotal, payroll: yearPayrollTotal }}"]) assert.ok(reports.includes(text),text);
});
test("報表下方圖表、十二個月明細及統計口徑均保留",async()=>{
  const source=await readFile(new URL("../src/ReportsOverview.jsx",import.meta.url),"utf8");
  for(const text of ["<AdministrationHeader kind=\"reports\" period={rocYear}","<ReportMetrics totals={totals} year={rocYear}","onClick={() => onYearChange(option)}","<TrendPanel title=\"營收趨勢\"","<TrendPanel title=\"薪資成本趨勢\"","不應直接相加","不受年度篩選影響"]) assert.ok(source.includes(text),text);
  const data=reportFixture();assert.equal(data.revenueTrend.length,12);assert.equal(data.payrollTrend.length,12);
});
test("使用收支管理共用高度與手機樣式，權限區域不影響其他清單",async()=>{
  const component=await readFile(new URL("../src/AdministrationOverview.jsx",import.meta.url),"utf8");
  const css=await readFile(new URL("../src/AdministrationOverview.css",import.meta.url),"utf8");
  for(const text of ["./BillingOverview.css","billing-header","billing-metrics--3","billing-metric-foot"]) assert.ok(component.includes(text));
  assert.ok(css.includes("@media(max-width:680px)"));assert.ok(css.includes(".permission-section-heading"));assert.doesNotMatch(css,/(?:^|\n)(?:button|input|table)\s*\{/);
});
test("預覽使用虛構資料並停用權限勾選，不連接正式帳號或資料庫",async()=>{
  const preview=await readFile(new URL("./previews/administration-overview.jsx",import.meta.url),"utf8");
  const component=await readFile(new URL("../src/AdministrationOverview.jsx",import.meta.url),"utf8");
  for(const text of [preview,component]) assert.doesNotMatch(text,/supabase|AuthGate|App\.jsx["']|localStorage|fetch\(|persist\./);
  for(const text of ["import.meta.env.DEV","disabled aria-label","empty","large","BillingOverview"]) assert.ok(preview.includes(text));
});
