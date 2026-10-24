import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {createRequire} from "node:module";
import {fileURLToPath} from "node:url";
import {build} from "esbuild";
import React from "react";
import {renderToStaticMarkup} from "react-dom/server";
const bundle=await build({entryPoints:[fileURLToPath(new URL("../src/BillingFilters.jsx",import.meta.url))],bundle:true,platform:"node",format:"cjs",write:false,packages:"external",loader:{".css":"empty"}});
const mod={exports:{}};
new Function("require","module","exports",bundle.outputFiles[0].text)(createRequire(import.meta.url),mod,mod.exports);
const Filters=mod.exports.default;
const base={count:2,company:"全部",companies:["全部","綠石環保","歐克環境","其他"],onCompanyChange:()=>{},monthControl:React.createElement("button",null,"月份控制")};
const nodes=e=>!e||typeof e!=="object"?[]:Array.isArray(e)?e.flatMap(nodes):typeof e.type==="function"?nodes(e.type(e.props)):[e,...nodes(e.props?.children)];
test("三分類共用發票窄版樣式，零用金不加入公司條件",()=>{
  for(const expenseTab of ["銀行入帳","公司付款","零用金"]){
    const html=renderToStaticMarkup(React.createElement(Filters,{...base,expenseTab}));
    assert.match(html,/sales-filters--inline sales-filters--invoice billing-filters/);
    assert.match(html,/月份控制/); assert.match(html,/目前顯示/);
    if(expenseTab === "零用金") assert.doesNotMatch(html,/company-filter-button|付款公司|入帳公司/);
    else assert.ok(html.includes(expenseTab === "公司付款" ? "付款公司篩選" : "入帳公司篩選"));
  }
});
test("公司按鈕保留原值、選取狀態與全部選項",()=>{
  const calls=[];
  const buttons=nodes(Filters({...base,expenseTab:"銀行入帳",company:"歐克環境",onCompanyChange:v=>calls.push(v)})).filter(e=>e.props?.className === "company-filter-button");
  buttons.forEach(b=>b.props.onClick());
  assert.deepEqual(calls,base.companies);
  assert.deepEqual(buttons.map(b=>b.props["aria-pressed"]),[false,false,true,false]);
});
test("正式整合沿用月份元件、計數與預訂付款日篩選規則",async()=>{
  const app=await readFile(new URL("../src/App.jsx",import.meta.url),"utf8");
  assert.match(app,/<BillingFilters expenseTab=\{expenseTab\} count=\{filtered.length\}/);
  assert.ok(app.includes('monthControl={<MonthFilterBar month={month} setMonth={setMonth} label={expenseTab === "公司付款" ? "預訂付款月份" : "日期月份"} />}'));
  assert.ok(app.includes('const filterDate = expenseTab === "公司付款" ? (b.plannedPaymentDate || b.date) : b.date;'));
  const source=await readFile(new URL("../src/BillingFilters.jsx",import.meta.url),"utf8");
  assert.doesNotMatch(source,/supabase|fetch\(|persist\.|useEffect|useState/);
});
