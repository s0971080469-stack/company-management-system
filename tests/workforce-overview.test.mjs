import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { readFile } from "node:fs/promises";
import { build } from "esbuild";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { filterPersonnel } from "../src/personnelFilters.js";
import { workforceEmployees, workforceCompanies, workforceSites, workforceMoney, workforceMonth } from "./fixtures/workforce-overview.js";

const bundle=await build({entryPoints:[fileURLToPath(new URL("../src/WorkforceOverview.jsx",import.meta.url))],bundle:true,platform:"node",format:"cjs",write:false,packages:"external",loader:{".css":"empty"},logLevel:"silent"});
const mod={exports:{}};
new Function("require","module","exports",bundle.outputFiles[0].text)(createRequire(import.meta.url),mod,mod.exports);
const { EmployeesOverview, PayrollOverview, WORKFORCE_COMPANY_COLORS }=mod.exports;
const noOp=()=>{};
const personnelProps=()=>({employeeCount:8,activeCount:7,filteredCount:8,query:"",onQueryChange:noOp,site:"全部",sites:workforceSites,onSiteChange:noOp,company:"全部",companies:workforceCompanies,onCompanyChange:noOp,onPrint:noOp,onNew:noOp});
const payrollProps=()=>({rowCount:7,totalNet:223200,paidNet:74900,unpaidNet:148300,paidCount:2,heldNet:34700,heldCount:1,month:"2026-10",nextMonth:"2026-11",boss:"全部",site:"全部",sites:["全部",...workforceSites],onBossChange:noOp,onSiteChange:noOp,monthControl:React.createElement("input",{type:"month",value:"2026-10",onChange:noOp}),approvalControl:null,generateLocked:false,nextGenerateLocked:false,generating:false,generationNotice:"",onGenerate:noOp,onPrint:noOp,formatMoney:workforceMoney,formatMonth:workforceMonth});
const render=(Component,props)=>renderToStaticMarkup(React.createElement(Component,props));
function nodes(element) {
  if(element == null || typeof element !== "object") return [];
  if(Array.isArray(element)) return element.flatMap(nodes);
  if(typeof element.type === "function") return nodes(element.type(element.props));
  return [element,...nodes(element.props?.children)];
}
const knownCompanies=workforceCompanies.filter(company=>!["全部","其他"].includes(company));

test("人員搜尋、投保公司、案場同時生效，不略過案場條件",()=>{
  const rows=filterPersonnel(workforceEmployees,{query:"現場",company:"綠石環保",site:workforceSites[2],knownCompanies});
  assert.deepEqual(rows.map(row=>row.name),["示範員工丙"]);
  assert.equal(filterPersonnel(workforceEmployees,{company:"綠石環保",site:"機動組",knownCompanies}).length,0);
  assert.deepEqual(filterPersonnel(workforceEmployees,{company:"綠石環保",site:"公司總部",knownCompanies}).map(row=>row.name),["示範員工甲"]);
});
test("其他公司不含未指定公司；空資料與大小寫搜尋正常且不改原陣列",()=>{
  const before=JSON.stringify(workforceEmployees);
  assert.deepEqual(filterPersonnel(workforceEmployees,{company:"其他",knownCompanies}).map(row=>row.name),["示範員工庚"]);
  assert.equal(filterPersonnel([]).length,0);
  assert.equal(filterPersonnel([{name:"Alice"}],{query:"ALICE"}).length,1);
  assert.equal(JSON.stringify(workforceEmployees),before);
});
test("人員統計標明全體與篩選範圍，空狀態保留搜尋與公司選項",()=>{
  const html=render(EmployeesOverview,{...personnelProps(),employeeCount:0,activeCount:0,filteredCount:0});
  for(const text of ["員工總數","在職人數","目前清單","所有已建立的人員資料","搜尋姓名／部門／職位","投保公司篩選","綠石環保"]) assert.ok(html.includes(text),text);
  assert.doesNotMatch(html,/NaN|Infinity/);
});
test("公司按鈕配色與原系統 StatusBadge 完全一致",async()=>{
  const app=await readFile(new URL("../src/App.jsx",import.meta.url),"utf8");
  for(const company of workforceCompanies.filter(value=>value !== "全部")) {
    const {bg,fg}=WORKFORCE_COMPANY_COLORS[company];
    assert.ok(app.includes(`"${company}": { bg: "${bg}", fg: "${fg}" }`),company);
  }
});
test("人員改版保留新增列印與篩選回呼，選取公司提供可讀狀態",()=>{
  const calls=[];const props={...personnelProps(),company:"綠石環保",onPrint:()=>calls.push("print"),onNew:()=>calls.push("new"),onCompanyChange:value=>calls.push(value),onSiteChange:value=>calls.push(value),onQueryChange:value=>calls.push(value)};
  const tree=nodes(EmployeesOverview(props));
  tree.filter(node=>node.type === "button").forEach(node=>node.props.onClick());
  tree.find(node=>node.type === "select").props.onChange({target:{value:"公司總部"}});
  tree.find(node=>node.type === "input").props.onChange({target:{value:"主管"}});
  assert.deepEqual(calls,["print","new",...workforceCompanies,"公司總部","主管"]);
  assert.equal(tree.filter(node=>node.props?.["aria-pressed"] === true).length,1);
});
test("薪資改版完整呈現傳入金額、發放與暫不發統計，不重新計算或修改",()=>{
  const data=payrollProps();const before=JSON.stringify(data);const html=render(PayrollOverview,data);
  for(const text of ["223,200","74,900","148,300","34,700","民國 115 年 10 月","暫時不發人數 1 / 7","不含暫時不發金額","依目前老闆、案場篩選統計"]) assert.ok(html.includes(text),text);
  assert.equal(JSON.stringify(data),before);
});
test("月份旁保留原批准元件插槽，零資料仍可切換月份",()=>{
  const html=render(PayrollOverview,{...payrollProps(),rowCount:0,totalNet:0,paidNet:0,unpaidNet:0,paidCount:0,heldNet:0,heldCount:0,approvalControl:React.createElement("button",null,"批准發放")});
  assert.match(html,/workforce-period-approval/);assert.match(html,/type="month"/);assert.match(html,/批准發放/);assert.doesNotMatch(html,/NaN|Infinity/);
});
test("薪資產生按鈕沿用本月及下月目標和鎖定狀態",()=>{
  const calls=[];
  const tree=nodes(PayrollOverview({...payrollProps(),onPrint:()=>calls.push("print"),onGenerate:value=>calls.push(value)}));
  tree.filter(node=>node.type === "button").forEach(node=>node.props.onClick());
  assert.deepEqual(calls,["print","2026-10","2026-11"]);
  const locked=nodes(PayrollOverview({...payrollProps(),generateLocked:true,nextGenerateLocked:true})).filter(node=>node.type === "button");
  assert.equal(locked.filter(node=>node.props.disabled).length,2);
  assert.match(render(PayrollOverview,{...payrollProps(),generating:true}),/正在讀取最新人員資料/);
});
test("正式整合保留薪資金額計算、批准通知回呼與老闆切換重設案場",async()=>{
  const app=await readFile(new URL("../src/App.jsx",import.meta.url),"utf8");
  for(const text of ['rows.filter((r) => r.status !== "暫時不發").reduce((s, r) => s + payrollNet(r), 0)','const unpaidNet = totalNet - paidNet;','onBossChange={value => { setBossFilter(value); setSiteFilter("全部"); }}','onGenerate={generate}','approveLatestPayrollSite({ ...selection, isAdmin, actor: actorName(ctx), senderId: ctx.currentUser?.id || ADMIN_CHAT_ID })']) assert.ok(app.includes(text),text);
  assert.match(app,/approvalControl=\{<PayrollApprovalButton/);
});
test("測試頁只匯入顯示元件與純函式，不連接正式儲存，樣式限制在本區域",async()=>{
  const preview=await readFile(new URL("./previews/workforce-overview.jsx",import.meta.url),"utf8");
  assert.match(preview,/import\.meta\.env\.DEV/);assert.doesNotMatch(preview,/supabaseClient|storage\.js|AuthGate|App\.jsx|fetch\(/);
  const css=await readFile(new URL("../src/WorkforceOverview.css",import.meta.url),"utf8");
  assert.match(css,/@media\(max-width:680px\)/);assert.doesNotMatch(css,/(^|\n)(?:button|select|input|table|body)\s*\{/);
});
