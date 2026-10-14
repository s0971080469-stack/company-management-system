import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { readFile } from "node:fs/promises";
const bundle = await build({ entryPoints: [fileURLToPath(new URL("../src/PayrollApprovalButton.jsx", import.meta.url))],
  bundle: true, platform: "node", format: "cjs", write: false, packages: "external", loader: { ".css": "empty" }, logLevel: "silent" });
const mod = { exports: {} };
new Function("require", "module", "exports", bundle.outputFiles[0].text)(createRequire(import.meta.url), mod, mod.exports);
const render = (props = {}) => renderToStaticMarkup(React.createElement(mod.exports.default, {
  rows: [{ id: "p", month: "2026-09", siteName: "公司總部", status: "待批准", baseSalary: 30000 }], employees: [], month: "2026-09",
  site: "公司總部", isAdmin: true, onApprove: async () => {}, formatMoney: String, formatMonth: String, ...props,
}));
test("夏碩亞選個別案場只顯示一個批准按鈕，不新增區塊或清單", () => {
  const html = render();
  assert.match(html, /批准發放/);
  assert.equal((html.match(/<button /g) || []).length, 1);
  assert.doesNotMatch(html, /<section|<header|<table|待批准.*人/);
});
test("選全部、空案場或非夏碩亞身分時完全隱藏批准按鈕", () => {
  for (const props of [{ site: "全部" }, { site: "" }, { isAdmin: false }]) assert.equal(render(props), "");
});
test("無待批准薪資時不允許重複批准", () => assert.match(render({ rows: [] }), /disabled/));
test("測試頁沿用狀態欄，不新增批准發放欄", async () => {
  const source = await readFile(new URL("./previews/payroll-approval.jsx", import.meta.url), "utf8");
  assert.ok(source.includes('["員工", "所屬案場", "底薪", "實發淨額", "狀態"]'));
  assert.ok(source.includes("payrollReleaseStatus(r, r.siteName)"));
});
