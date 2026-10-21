import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {createRequire} from "node:module";
import {fileURLToPath} from "node:url";
import {build} from "esbuild";
import React from "react";
import {renderToStaticMarkup} from "react-dom/server";
import {quoteOverviewStats,invoiceOverviewStats} from "../src/salesOverview.js";
import {salesFixture,quoteAmount,invoiceAmount,salesMoney,salesCompanyColor} from "./fixtures/sales-overview.js";
const bundle=await build({entryPoints:[fileURLToPath(new URL("../src/SalesOverview.jsx",import.meta.url))],bundle:true,platform:"node",format:"cjs",write:false,packages:"external",loader:{".css":"empty"},logLevel:"silent"});
const module={exports:{}};
new Function("require","module","exports",bundle.outputFiles[0].text)(createRequire(import.meta.url),module,module.exports);
const {SalesOverview,SalesFilters}=module.exports;
const nodes=e=>!e||typeof e!=="object"?[]:Array.isArray(e)?e.flatMap(nodes):[e,...nodes(e.props?.children)];
const render=(component,props)=>renderToStaticMarkup(React.createElement(component,props));
const base={kind:"quotes",stats:{count:3,total:123456,approved:1},period:"全部月份",formatMoney:salesMoney};
test("估價概況沿用清單品項金額、核准狀態；不修改資料",()=>{
  const rows=salesFixture().quotes; rows[0].total=999999;
  const before=JSON.stringify(rows); const stats=quoteOverviewStats(rows,quoteAmount);
  assert.equal(stats.total,142500); assert.equal(stats.count,6); assert.equal(stats.approved,2);
  assert.deepEqual(quoteOverviewStats([],quoteAmount),{count:0,total:0,approved:0});
  assert.equal(JSON.stringify(rows),before);
});
test("發票概況排除作廢金額，待入帳以日期而非付款狀態判斷",()=>{
  const rows=[{status:"已付款",dueDate:"",total:105},{status:"未付款",dueDate:"2026-10-21",total:210},{status:"已作廢",total:999},{status:"未付款",items:[{qty:2,price:100}],taxRate:5},{status:"未付款",total:0,items:[{qty:1,price:999}],taxRate:5}];
  const before=JSON.stringify(rows);
  assert.deepEqual(invoiceOverviewStats(rows,invoiceAmount),{count:5,total:525,pending:315});
  assert.deepEqual(invoiceOverviewStats([],invoiceAmount),{count:0,total:0,pending:0});
  assert.deepEqual(invoiceOverviewStats(rows.slice(1,2),invoiceAmount),{count:1,total:210,pending:0});
  assert.equal(JSON.stringify(rows),before);
});
test("估價單不顯示概況，發票保留三項統計及篩選期間",()=>{
  const quote=render(SalesOverview,base);
  assert.equal((quote.match(/<article /g)||[]).length,0);
  for(const text of ["估價單概況","估價單統計","billing-section-label","billing-metrics"]) assert.ok(!quote.includes(text));
  for(const text of ["billing-header","管理估價範本","新增估價單"]) assert.ok(quote.includes(text));
  const invoice=render(SalesOverview,{...base,kind:"invoices",stats:{count:0,total:0,pending:0},period:"115年10月"});
  assert.equal((invoice.match(/<article /g)||[]).length,3);
  for(const text of ["115年10月","不含已作廢","未填入帳日","billing-header","billing-metric"]) assert.ok(invoice.includes(text));
  assert.ok(!invoice.includes("NaN"));
});
test("新增與範本按鈕保持回呼，提醒插槽不被隱藏",()=>{
  const calls=[];
  const tree=SalesOverview({...base,onNew:()=>calls.push("new"),onTemplates:()=>calls.push("templates"),children:React.createElement("p",null,"跨月份逾期提醒")});
  nodes(tree).filter(e=>e.type==="button").forEach(e=>e.props.onClick());
  assert.deepEqual(calls,["templates","new"]);
  assert.ok(renderToStaticMarkup(tree).includes("跨月份逾期提醒"));
});
test("同前四字公司仍傳回完整公司名稱，搜尋與月份元件保持原值",()=>{
  let selected,query;
  const props={kind:"quotes",count:2,company:"綠石環保股份有限公司",companies:["全部","綠石環保股份有限公司","綠石環保另一公司","未填公司"],onCompanyChange:v=>selected=v,companyColor:salesCompanyColor,query:"搜尋",onQueryChange:v=>query=v,monthControl:React.createElement("div",null,"原本月份元件")};
  const tree=SalesFilters(props),all=nodes(tree),buttons=all.filter(e=>e.type==="button");
  buttons[2].props.onClick(); assert.equal(selected,"綠石環保另一公司");
  assert.equal(buttons[1].props["aria-pressed"],true);
  assert.equal(buttons[1].props.style["--sales-company-bg"],"#E1F0EE");
  all.find(e=>e.type==="input").props.onChange({target:{value:"新關鍵字"}}); assert.equal(query,"新關鍵字");
  assert.ok(renderToStaticMarkup(tree).includes("原本月份元件"));
});
test("正式整合保留月份分組、搜尋、全域提醒及入帳取消通知流程",async()=>{
  const app=await readFile(new URL("../src/App.jsx",import.meta.url),"utf8");
  for(const snippet of ["quoteOverviewStats(filteredQuotes, q => sumItems(q.items))","invoiceOverviewStats(filtered, inv => inv.total ?? sumItems(inv.items)","getInvoiceReminders(invoices, ctx.now)","<MonthFilterBar month={month} setMonth={setMonth} label=\"開立日期月份\" />","return matchesInvoiceKeyword(inv, query)","groupedByMonth.flatMap", "onChange={(v) => setDueDate(inv, v)}", "取消選擇日期", "重送通知"]) assert.ok(app.includes(snippet),snippet);
});
test("預覽獨立於正式登入與儲存，含空資料、大額及收支參考",async()=>{
  const source=await readFile(new URL("./previews/sales-overview.jsx",import.meta.url),"utf8");
  const component=await readFile(new URL("../src/SalesOverview.jsx",import.meta.url),"utf8");
  for(const text of [source,component]) assert.doesNotMatch(text,/supabase|AuthGate|App\.jsx["']|localStorage|fetch\(|persist\./);
  for(const text of ["import.meta.env.DEV","BillingOverview","empty","many"]) assert.ok(source.includes(text));
  assert.ok(component.includes('import "./BillingOverview.css"'));
  const html=render(SalesOverview,{...base,kind:"invoices",stats:{count:100,total:1234567890123,pending:0},period:"<script>unsafe</script>"});
  assert.ok(html.includes("1,234,567,890,123"));assert.ok(html.includes("&lt;script&gt;"));
});
