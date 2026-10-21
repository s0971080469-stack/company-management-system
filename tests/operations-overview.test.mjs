import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {createRequire} from "node:module";
import {fileURLToPath} from "node:url";
import {build} from "esbuild";
import React from "react";
import {renderToStaticMarkup} from "react-dom/server";
import {operationsFixture,money,isOverdue,isExpiringSoon,daysUntil} from "./fixtures/operations-overview.js";
const bundle=await build({entryPoints:[fileURLToPath(new URL("../src/OperationsOverview.jsx",import.meta.url))],bundle:true,platform:"node",format:"cjs",write:false,packages:"external",loader:{".css":"empty"},logLevel:"silent"});
const module={exports:{}};new Function("require","module","exports",bundle.outputFiles[0].text)(createRequire(import.meta.url),module,module.exports);
const {OperationsOverview,OperationsFilters,OperationsSearch,VehicleReminders,AttendanceControls}=module.exports;
const render=(c,p)=>renderToStaticMarkup(React.createElement(c,p));
const nodes=e=>!e||typeof e!=="object"?[]:Array.isArray(e)?e.flatMap(nodes):[e,...nodes(e.props?.children)];
test("四頁保留原統計項目與傳入值，打卡頁不增加無根據統計",()=>{
  for(const [kind,stats,count] of [["tracking",{count:8,billed:3,unbilled:5},3],["vehicles",{count:5,active:3,expiring:2,overdue:1},4],["ledger",{income:100,expense:120,net:-20},3],["attendance",{},0]]){
    const before=JSON.stringify(stats),html=render(OperationsOverview,{kind,stats,period:"115年10月",formatMoney:money});
    assert.equal((html.match(/<article /g)||[]).length,count); assert.ok(!html.includes("NaN")); assert.equal(JSON.stringify(stats),before);
  }
  const ledger=render(OperationsOverview,{kind:"ledger",stats:{income:100,expense:120,net:-20},formatMoney:money});
  assert.ok(ledger.includes("-20"));assert.ok(ledger.includes("全部月份・不受下方清單篩選影響"));
});
test("空資料、大額與長月份標示不隱藏或注入HTML",()=>{
  const html=render(OperationsOverview,{kind:"ledger",stats:{income:1234567890123,expense:0,net:1234567890123},formatMoney:money});
  assert.ok(html.includes("1,234,567,890,123"));
  const tracking=render(OperationsOverview,{kind:"tracking",stats:{count:0,billed:0,unbilled:0},period:"<script>test</script>"});
  assert.ok(tracking.includes("&lt;script&gt;"));assert.equal((tracking.match(/<strong>0<\/strong>/g)||[]).length,3);
});
test("新增按鈕與公司、收入支出篩選回呼保持原值與配色",()=>{
  let called=0,selected;
  nodes(OperationsOverview({kind:"vehicles",stats:{},onNew:()=>called++})).find(n=>n.type==="button").props.onClick();assert.equal(called,1);
  const buttons=nodes(OperationsFilters({options:["全部","歐克環境"],selected:"歐克環境",onSelect:v=>selected=v,colorOf:()=>"#ECF2FB"})).filter(n=>n.type==="button");
  assert.equal(buttons[1].props["aria-pressed"],true);assert.equal(buttons[1].props.style.background,"#ECF2FB");buttons[1].props.onClick();assert.equal(selected,"歐克環境");
  let query;nodes(OperationsSearch({label:"搜尋",query:"",onChange:v=>query=v})).find(n=>n.type==="input").props.onChange({target:{value:"新搜尋"}});assert.equal(query,"新搜尋");
});
test("車輛提醒完整保留車牌、車型、到期日數、今日及雙重提醒",()=>{
  const {vehicles}=operationsFixture();const overdue=vehicles.filter(v=>isOverdue(v.insuranceExpiry)||isOverdue(v.inspectionExpiry));const expiring=vehicles.filter(v=>isExpiringSoon(v.insuranceExpiry)||isExpiringSoon(v.inspectionExpiry));
  const html=render(VehicleReminders,{overdue,expiring,isOverdue,isExpiringSoon,daysUntil});
  for(const text of ["DEMO-100","示範工作車","保險已逾期 3 天","驗車剩 12 天","保險剩 5 天","驗車今日到期"]) assert.ok(html.includes(text),text);
  assert.equal((html.match(/DEMO-100/g)||[]).length,2);
  assert.ok(!render(VehicleReminders,{overdue:[],expiring:[]}).includes("<section"));
});
test("多筆車輛明細全部渲染且以固定高度捲動，不截斷資料",async()=>{
  const rows=operationsFixture("many").vehicles;
  const html=render(VehicleReminders,{overdue:rows,expiring:[],isOverdue,isExpiringSoon,daysUntil});
  assert.equal((html.match(/<li>/g)||[]).length,24);
  const css=await readFile(new URL("../src/OperationsOverview.css",import.meta.url),"utf8");
  assert.ok(css.includes("max-height:168px; overflow:auto"));assert.ok(css.includes("@media(max-width:680px)"));
});
test("打卡元件只呈現傳入控制項，停用狀態不被改寫",()=>{
  let called=0;
  const control=React.createElement("button",{disabled:true,onClick:()=>called++},"上班打卡");
  const tree=AttendanceControls({time:"08:30:25",date:"115/10/21",employeeControl:React.createElement("strong",null,"示範員工"),actions:control,locationControl:"座標資訊"});
  const html=renderToStaticMarkup(tree);assert.ok(html.includes("disabled"));assert.ok(html.includes("08:30:25"));assert.ok(html.includes("115/10/21"));assert.equal(called,0);
  assert.equal(nodes(tree).find(n=>n.type==="button").props.onClick,control.props.onClick);
});
test("正式整合保留原權限、請款鎖定、打卡條件及帳務統計來源",async()=>{
  const app=await readFile(new URL("../src/App.jsx",import.meta.url),"utf8");
  for(const snippet of ["const restricted = !isAdmin","if (restricted && !myEmployeeId)","employeeControl={restricted ?", "disabled={!empId || (selfRecord && selfRecord.clockIn)}", "disabled={!empId || !selfRecord || !selfRecord.clockIn || selfRecord.clockOut}","onClick={useCurrentLocationAsCompany}","const locked = billed && !isAdmin", "掃描檔案尚未上傳，不可以打勾", "stats={{ income, expense, net: income - expense }}", "const income = accounting.filter", "const expense = accounting.filter", "billed: billedCount, unbilled: filtered.length - billedCount", "const expiringVehicles = vehicles.filter", "const overdueVehicles = vehicles.filter"]) assert.ok(app.includes(snippet),snippet);
});
test("預覽隔離正式資料，含空資料、多筆、員工身分及參考頁",async()=>{
  const preview=await readFile(new URL("./previews/operations-overview.jsx",import.meta.url),"utf8");
  const component=await readFile(new URL("../src/OperationsOverview.jsx",import.meta.url),"utf8");
  for(const text of [preview,component]) assert.doesNotMatch(text,/supabase|AuthGate|App\.jsx["']|localStorage|fetch\(|persist\.|navigator.geolocation/);
  for(const text of ["import.meta.env.DEV","BillingOverview","empty","many","預覽身分"]) assert.ok(preview.includes(text));
});
