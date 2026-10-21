import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { readFile } from "node:fs/promises";
import { build } from "esbuild";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

const bundle = await build({ entryPoints: [fileURLToPath(new URL("../src/WebsiteManagement.jsx", import.meta.url))], bundle: true, platform: "node", format: "cjs", write: false, packages: "external", loader: { ".css": "empty" }, logLevel: "silent" });
const mod = { exports: {} };
new Function("require", "module", "exports", bundle.outputFiles[0].text)(createRequire(import.meta.url), mod, mod.exports);
const render = (props = {}) => renderToStaticMarkup(React.createElement(mod.exports.default, { initialMonth: "2026-10", ...props }));

test("收件清單放大文字並保留窄螢幕換行，不影響頁首統計", async () => {
  const css = await readFile(new URL("../src/WebsiteManagement.css", import.meta.url), "utf8");
  const overrides = css.split("/* Inbox readability:")[1].split("@media(prefers-reduced-motion")[0];
  assert.match(overrides, /\.wm-inbox \.wm-table-wrap td,[\s\S]*font-size:14px/);
  assert.match(overrides, /\.wm-inbox \.wm-table-wrap \.wm-date-cell,[\s\S]*font-size:13px/);
  assert.match(overrides, /\.wm-inbox \.wm-search input \{ font-size:16px; \}/);
  assert.match(overrides, /\.wm-inbox \.wm-tabs \{ flex-wrap:wrap; \}/);
  assert.match(overrides, /\.wm-workflow ol \{ flex-wrap:wrap; \}/);
  assert.doesNotMatch(overrides, /\.wm-heading|\.wm-stat\s*\{/);
});

test("未串接頁面不顯示虛構流量或假裝已收到資料", () => {
  const html = render();
  assert.match(html, /尚未串接網站/);
  assert.match(html, /尚未啟用自動接收/);
  assert.doesNotMatch(html, /2,486|1,032|林小姐/);
});
test('正式流量顯示來源與 UTC，失敗不掩蓋收件或以假數字取代', () => {
  const html=render({connected:true,intakeEnabled:true,analytics:{month:'2026-10',views:20,visitors:5,daily:[{label:'10/17',views:20}]}});
  assert.match(html,/Vercel/);assert.match(html,/UTC/);assert.doesNotMatch(html,/最近 7 日 · 模擬/);
  const failed=render({connected:true,intakeEnabled:true,analyticsError:'尚未設定金鑰'});
  assert.match(failed,/尚未設定金鑰/);assert.match(failed,/不影響表單收件/);
  const changed=render({selectedMonth:'2026-09',analytics:{month:'2026-10',views:99999,visitors:99999,daily:[]}});
  assert.doesNotMatch(changed,/99,999/);
});
test("測試收件顯示民國日期與需求且安全轉義使用者內容", () => {
  const html = render({ preview: true, rows: [{ id: "a", name: "<script>alert(1)</script>", type: "預約服務", subject: "清潔維護", status: "待處理", receivedAt: "2026-10-01T04:20:30Z" }] });
  assert.match(html, /民國115\/10\/01\s+12:20:30/);
  assert.match(html, /&lt;script&gt;/);
  assert.doesNotMatch(html, /<script>/);
  assert.match(html, /預約服務/);
});
test("導航位於打卡上方，測試頁獨立且不匯入正式儲存或登入程式", async () => {
  const app = await readFile(new URL("../src/App.jsx", import.meta.url), "utf8");
  assert.match(app, /key: "website", label: "網站資訊管理"[^\n]*\n\s*\{ key: "attendance"/);
  const preview = await readFile(new URL("./previews/website-management.jsx", import.meta.url), "utf8");
  assert.match(preview, /import\.meta\.env\.DEV/);
  assert.doesNotMatch(preview, /supabase|storage\.js|AuthGate/);
});

test("新營運版面保留統計、分類、行動版欄名及處理進度", () => {
  const html = render({ preview: true, rows: [
    {id:'a',name:'甲',type:'服務詢價',status:'待處理',receivedAt:'2026-10-01T00:00:00Z'},
    {id:'b',name:'乙',type:'預約服務',status:'處理中',receivedAt:'2026-10-02T00:00:00Z'},
    {id:'c',name:'丙',type:'服務詢價',status:'已完成',receivedAt:'2026-10-03T00:00:00Z'},
    {id:'d',name:'其他月份',status:'待處理',receivedAt:'2026-09-01T00:00:00Z'},
  ] });
  assert.match(html, /收件處理進度/);
  assert.match(html, /aria-label="統計年份"/);
  assert.match(html, /民國 115 年/);
  assert.doesNotMatch(html, /type="month"/);
  assert.match(html, /data-label="客戶／公司"/);
  assert.match(html, /data-label="需求內容"/);
  assert.match(html, /wm-unread/);
  assert.match(html, /顯示 3 筆／所選期間 3 筆/);
  assert.doesNotMatch(html, /其他月份/);
});

test("趨勢圖處理空資料、零流量與單日資料，不產生無效 SVG 座標", () => {
  for (const daily of [[], [{label:'10/01',views:0}], [{label:'10/01',views:125}]]) {
    const html = render({ analytics:{month:'2026-10',views:daily[0]?.views || 0,visitors:0,daily} });
    assert.doesNotMatch(html, /NaN|Infinity/);
    if (daily.length) assert.match(html, /每日瀏覽次數/);
    else assert.match(html, /這段期間尚無每日流量資料/);
  }
});
