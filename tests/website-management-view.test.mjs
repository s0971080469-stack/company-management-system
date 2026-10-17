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

test("未串接頁面不顯示虛構流量或假裝已收到資料", () => {
  const html = render();
  assert.match(html, /尚未串接網站/);
  assert.match(html, /尚未啟用自動接收/);
  assert.doesNotMatch(html, /2,486|1,032|林小姐/);
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
