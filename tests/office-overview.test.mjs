import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { readFile } from "node:fs/promises";
import { build } from "esbuild";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
const bundle=await build({entryPoints:[fileURLToPath(new URL("../src/OfficeOverview.jsx",import.meta.url))],bundle:true,platform:"node",format:"cjs",write:false,packages:"external",loader:{".css":"empty"},logLevel:"silent"});
const mod={exports:{}};
new Function("require","module","exports",bundle.outputFiles[0].text)(createRequire(import.meta.url),mod,mod.exports);
const {VendorsOverview,DocumentsOverview}=mod.exports;
const render=(C,p)=>renderToStaticMarkup(React.createElement(C,p));
function nodes(e){if(e==null||typeof e!=="object")return [];if(Array.isArray(e))return e.flatMap(nodes);if(typeof e.type==="function")return nodes(e.type(e.props));return [e,...nodes(e.props?.children)];}
test("廠商保留兩項統計、公文保留三項統計與範圍說明",()=>{
  const vendor=render(VendorsOverview,{supplierCount:32,ownerCount:27});
  for(const s of ["供應商家數","業主家數","32","27","全部廠商"])assert.ok(vendor.includes(s));
  assert.equal((vendor.match(/<article/g)||[]).length,2);
  const doc=render(DocumentsOverview,{totalCount:18,monthCount:6,templatedCount:11});
  for(const s of ["公文總數","本月新增","已套用範本","18","6","11","依發文日期統計"])assert.ok(doc.includes(s));
  assert.equal((doc.match(/<article/g)||[]).length,3);
});
test("空清單仍呈現零值及操作按鈕，不自行計算或修改資料",()=>{
  for(const [C,p] of [[VendorsOverview,{supplierCount:0,ownerCount:0}],[DocumentsOverview,{totalCount:0,monthCount:0,templatedCount:0}]]){
    const before=JSON.stringify(p);const html=render(C,p);assert.match(html,/<strong>0<\/strong>/);assert.doesNotMatch(html,/NaN|Infinity|undefined/);assert.equal(JSON.stringify(p),before);
  }
});
test("新增、列印與公文範本按鈕仍呼叫既有回呼",()=>{
  const calls=[];
  for(const C of [VendorsOverview,DocumentsOverview])nodes(C({onNew:()=>calls.push("new"),onPrint:()=>calls.push("print"),onTemplates:()=>calls.push("templates")})).filter(e=>e.type==="button").forEach(e=>e.props.onClick());
  assert.deepEqual(calls,["print","new","templates","print","new"]);
});
test("與契約直接共用標題與卡片樣式，不覆寫高度或字級",async()=>{
  const jsx=await readFile(new URL("../src/OfficeOverview.jsx",import.meta.url),"utf8");
  assert.match(jsx,/import "\.\/ContractOverview.css"/);
  for(const s of ["contract-overview-header","contract-overview-metric-heading","contract-overview-value","contract-overview-metric-foot"])assert.ok(jsx.includes(s));
  const css=await readFile(new URL("../src/OfficeOverview.css",import.meta.url),"utf8");
  assert.doesNotMatch(css,/font-size:|height:/);assert.match(css,/@media\(max-width:680px\)/);
});
test("正式整合保留原始統計、新增與範本開啟流程",async()=>{
  const app=await readFile(new URL("../src/App.jsx",import.meta.url),"utf8");
  for(const s of ['vendors.filter((v) => v.vendorType === "供應商").length','vendors.filter((v) => v.vendorType === "業主").length','documents.filter((d) => (d.date || "").startsWith(monthStr())).length','documents.filter((d) => d.templateId).length','<VendorsOverview supplierCount={supplierCount} ownerCount={ownerCount}','<DocumentsOverview totalCount={documents.length} monthCount={monthCount} templatedCount={templatedCount}','onTemplates={() => setTemplateManagerOpen(true)}','onNew={() => setPickerOpen(true)}'])assert.ok(app.includes(s),s);
});
test("獨立測試頁不讀寫正式資料，提供契約參考及空資料情境",async()=>{
  const preview=await readFile(new URL("./previews/office-overview.jsx",import.meta.url),"utf8");
  assert.doesNotMatch(preview,/supabaseClient|storage\.js|AuthGate|App\.jsx|fetch\(/);assert.match(preview,/import\.meta\.env\.DEV/);assert.match(preview,/契約管理（高度參考）/);assert.match(preview,/空資料/);
});
