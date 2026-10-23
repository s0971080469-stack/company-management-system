import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {createRequire} from "node:module";
import {fileURLToPath} from "node:url";
import {build} from "esbuild";
import React from "react";
import {renderToStaticMarkup} from "react-dom/server";
const bundle=await build({entryPoints:[fileURLToPath(new URL("../src/VendorFilters.jsx",import.meta.url))],bundle:true,platform:"node",format:"cjs",write:false,packages:"external",loader:{".css":"empty"},logLevel:"silent"});
const module={exports:{}};
new Function("require","module","exports",bundle.outputFiles[0].text)(createRequire(import.meta.url),module,module.exports);
const VendorFilters=module.exports.default;
const nodes=e=>!e||typeof e!=="object"?[]:Array.isArray(e)?e.flatMap(nodes):[e,...nodes(e.props?.children)];
test("廠商篩選沿用估價單樣式，保留分類原值及顏色",()=>{
  const calls=[];let query;
  const tree=VendorFilters({count:2,type:"供應商",query:"",onTypeChange:v=>calls.push(v),onQueryChange:v=>query=v});
  const all=nodes(tree),buttons=all.filter(e=>e.type==="button");
  buttons.forEach(e=>e.props.onClick());
  assert.deepEqual(calls,["全部","供應商","業主"]);
  assert.deepEqual(buttons.map(e=>e.props["aria-pressed"]),[false,true,false]);
  assert.deepEqual(buttons.map(e=>e.props.style["--sales-company-bg"]),["#edf2f7","#E4E9F0","#F5E9EE"]);
  all.find(e=>e.type==="input").props.onChange({target:{value:" ABC "}});
  assert.equal(query," ABC ");
  const html=renderToStaticMarkup(tree);
  for(const text of ["清單篩選","目前顯示","廠商類型","關鍵字搜尋","sales-filters vendor-filters",'aria-live="polite"']) assert.ok(html.includes(text));
});
test("零筆狀態可顯示，搜尋字串由 React 安全跳脫",()=>{
  const html=renderToStaticMarkup(React.createElement(VendorFilters,{count:0,type:"全部",query:'<script>"test"</script>',onTypeChange:()=>{},onQueryChange:()=>{}}));
  assert.ok(html.includes("<b>0</b>"));
  assert.ok(html.includes("&lt;script&gt;"));
  assert.ok(!html.includes("<script>"));
});
test("正式頁只替換篩選元件，原本分類與搜尋條件不變",async()=>{
  const app=await readFile(new URL("../src/App.jsx",import.meta.url),"utf8");
  for(const snippet of ['<VendorFilters','count={filtered.length}','onTypeChange={setTypeFilter}','onQueryChange={setQuery}', 'typeFilter === "全部" || v.vendorType === typeFilter', '(v.name + (v.category || "") + (v.tradingCompany || "")).toLowerCase().includes(query.toLowerCase())']) assert.ok(app.includes(snippet),snippet);
});
test("測試入口僅使用模擬資料，沒有正式登入、環境或資料庫連線",async()=>{
  for(const path of ["../src/VendorFilters.jsx","./previews/vendor-filters.jsx"]){
    const source=await readFile(new URL(path,import.meta.url),"utf8");
    assert.doesNotMatch(source,/supabase|AuthGate|App\.jsx["']|localStorage|fetch\(|persist\./);
  }
  const config=await readFile(new URL("../vite.vendor-preview.config.js",import.meta.url),"utf8");
  assert.ok(config.includes("envDir:false,publicDir:false"));
  assert.ok(config.includes("vendor-filters.html"));
});
