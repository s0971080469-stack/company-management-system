import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {createRequire} from "node:module";
import {fileURLToPath} from "node:url";
import {build} from "esbuild";
import React from "react";
import {renderToStaticMarkup} from "react-dom/server";
const bundle=await build({entryPoints:[fileURLToPath(new URL("../src/DocumentFilters.jsx",import.meta.url))],bundle:true,platform:"node",format:"cjs",write:false,packages:"external",loader:{".css":"empty"},logLevel:"silent"});
const module={exports:{}};
new Function("require","module","exports",bundle.outputFiles[0].text)(createRequire(import.meta.url),module,module.exports);
const Filters=module.exports.default;
const nodes=e=>!e||typeof e!=="object"?[]:Array.isArray(e)?e.flatMap(nodes):[e,...nodes(e.props?.children)];
const base={count:4,month:"",handler:"全部",handlers:["甲","乙"],contract:"全部",contracts:["同名契約第一案","同名契約第二案"],query:"",onMonthChange:()=>{},onHandlerChange:()=>{},onContractChange:()=>{},onQueryChange:()=>{}};
test("公文各篩選保留原值與完整案名，清除月份不改其他條件",()=>{
  const calls=[];
  const tree=Filters({...base,month:"2026-10",onMonthChange:v=>calls.push(["month",v]),onHandlerChange:v=>calls.push(["handler",v]),onContractChange:v=>calls.push(["contract",v]),onQueryChange:v=>calls.push(["query",v])});
  const all=nodes(tree);
  const field=label=>all.find(e=>e.props?.["aria-label"]===label);
  field("發文日期月份").props.onChange({target:{value:"2026-09"}});
  field("編輯人").props.onChange({target:{value:"乙"}});
  field("契約案名").props.onChange({target:{value:"同名契約第二案"}});
  field("搜尋公文").props.onChange({target:{value:" ABC "}});
  all.find(e=>e.type==="button").props.onClick();
  assert.deepEqual(calls,[["month","2026-09"],["handler","乙"],["contract","同名契約第二案"],["query"," ABC "],["month",""]]);
  const html=renderToStaticMarkup(tree);
  for(const text of ["清單篩選","目前顯示","同名契約第一案","同名契約第二案","sales-filters document-filters",'aria-live="polite"'])assert.ok(html.includes(text));
});
test("無選項時不顯示空下拉，零筆與特殊文字安全顯示",()=>{
  const html=renderToStaticMarkup(React.createElement(Filters,{...base,count:0,handlers:[],contracts:[],query:'<script>"bad"</script>'}));
  assert.ok(html.includes("<b>0</b>"));assert.ok(html.includes("&lt;script&gt;"));
  assert.doesNotMatch(html,/<select|<button|<script>/);
  const longName="年度公共空間環境清潔與景觀維護整合服務契約".repeat(5);
  const long=renderToStaticMarkup(React.createElement(Filters,{...base,contract:longName,contracts:[longName]}));
  assert.ok(long.includes(longName));
});
test("篩選同列依編輯人、案名、月份、搜尋排列，保留清除月份按鈕名稱",()=>{
  const all=nodes(Filters({...base,month:"2026-10"}));
  assert.deepEqual(all.filter(e=>e.type==="input"||e.type==="select").map(e=>e.props["aria-label"]),["編輯人","契約案名","發文日期月份","搜尋公文"]);
  assert.equal(all.find(e=>e.type==="button").props["aria-label"],"顯示全部");
  assert.equal(all.filter(e=>e.props?.className==="sales-filter-controls document-filter-row").length,1);
});
test("正式整合保持四種篩選、異動時間排序與公文功能",async()=>{
  const app=await readFile(new URL("../src/App.jsx",import.meta.url),"utf8");
  const section=app.slice(app.indexOf("function DocumentsView("),app.indexOf("function DocumentsView(")+14000);
  for(const text of ['<DocumentFilters count={filtered.length}', 'month={monthFilter} onMonthChange={setMonthFilter}', 'handlers={handlerOptions} onHandlerChange={setHandlerFilter}', 'contracts={contractOptions} onContractChange={setContractFilter}', 'query={query} onQueryChange={setQuery}', 'handlerFilter !== "全部" && d.handler !== handlerFilter','contractFilter !== "全部" && d.contractTitle !== contractFilter','(d.date || "").startsWith(monthFilter)','(d.no + d.subject + (d.overview || "") + (d.party || "")).toLowerCase().includes(query.toLowerCase())','a.updatedAt || a.createdAt || ""','generateForRow(d, false)','generateForRow(d, true)','persist.documents(list)'])assert.ok(section.includes(text),text);
});
test("預覽為獨立模擬資料，不連接正式登入或儲存",async()=>{
  for(const path of ["../src/DocumentFilters.jsx","./previews/document-filters.jsx"]){
    const source=await readFile(new URL(path,import.meta.url),"utf8");
    assert.doesNotMatch(source,/supabase|AuthGate|App\.jsx["']|localStorage|fetch\(|persist\./);
  }
  const config=await readFile(new URL("../vite.document-preview.config.js",import.meta.url),"utf8");
  assert.ok(config.includes("envDir:false,publicDir:false"));
  const css=await readFile(new URL("../src/DocumentFilters.css",import.meta.url),"utf8");
  assert.ok(css.includes("@media(max-width:680px)"));
});
