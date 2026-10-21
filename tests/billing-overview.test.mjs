import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { readFile } from "node:fs/promises";
import { build } from "esbuild";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { billingFixture } from "./fixtures/billing-overview.js";

const bundle = await build({ entryPoints: [fileURLToPath(new URL("../src/BillingOverview.jsx", import.meta.url))], bundle: true, platform: "node", format: "cjs", write: false, packages: "external", loader: { ".css": "empty" }, logLevel: "silent" });
const module = { exports: {} };
new Function("require", "module", "exports", bundle.outputFiles[0].text)(createRequire(import.meta.url), module, module.exports);
const BillingOverview = module.exports.default;
const props = (tab = "零用金", mode = "normal") => ({ ...billingFixture(mode), expenseTab: tab, newLabel: "新增測試紀錄", onNew: () => {}, onTabChange: () => {} });
const render = value => renderToStaticMarkup(React.createElement(BillingOverview, value));
function nodes(element) {
  if (!element || typeof element !== "object") return [];
  if (Array.isArray(element)) return element.flatMap(nodes);
  return [element, ...nodes(element.props?.children)];
}
test("三種分類各保留 4 / 3 / 5 項原有統計與傳入數值", () => {
  for (const [tab, count, values] of [["零用金", 4, ["6,280", "14,920", "28", "5,080"]], ["銀行入帳", 3, ["865,000", "3,815,000", "46"]], ["公司付款", 5, ["32", "21", "268,500", "108,880"]]]) {
    const html = render(props(tab));
    assert.equal((html.match(/<article /g) || []).length, count);
    for (const value of values) assert.ok(html.includes(value), `${tab}: ${value}`);
  }
});
test("統計篩選期間清楚區分，卡片不自行重算帳務", () => {
  const p = props("公司付款"); p.filterPeriodLabel = "114 年 12 月"; p.companyFilter = "示範公司";
  const html = render(p);
  assert.ok(html.includes("示範公司 · 依目前篩選"));
  assert.equal((html.match(/114 年 12 月/g) || []).length, 2);
  assert.equal((html.match(/全部月份/g) || []).length, 3);
});
test("提醒保留所有廠商、金額、日期及今日到期文字", () => {
  const p = props(); const html = render(p);
  assert.equal((html.match(/<li>/g) || []).length, 6);
  for (const row of p.duePayments) { assert.ok(html.includes(row.vendor)); assert.ok(html.includes(p.formats.money(row.amount))); assert.ok(html.includes(p.formats.date(row.plannedPaymentDate))); }
  assert.ok(html.includes("今日到期")); assert.ok(html.includes("剩 5 天"));
  assert.equal((render(props("零用金", "many")).match(/<li>/g) || []).length, 24);
});
test("逾期提醒與負餘額維持警示、沒有提醒時不顯示空框", () => {
  const html = render(props("零用金", "overdue"));
  assert.ok(html.includes("已逾期 3 天")); assert.ok(html.includes("-1,800")); assert.ok(html.includes("billing-tone--red"));
  const empty = render(props("零用金", "empty"));
  assert.ok(!empty.includes("billing-reminder-list")); assert.ok(!empty.includes("NaN"));
});
test("分類切換與新增回呼保持原值，忙碌時所有操作均停用", () => {
  let selected; let clicked = 0;
  const p = { ...props(), onTabChange: value => { selected = value; }, onNew: () => clicked++ };
  const buttons = nodes(BillingOverview(p)).filter(node => node.type === "button");
  assert.equal(buttons.length, 4); buttons[0].props.onClick(); assert.equal(clicked, 1);
  buttons[1].props.onClick(); assert.equal(selected, "銀行入帳");
  buttons[2].props.onClick(); assert.equal(selected, "公司付款");
  assert.equal(buttons[3].props["aria-pressed"], true);
  assert.ok(nodes(BillingOverview({ ...p, busy: true })).filter(node => node.type === "button").every(node => node.props.disabled));
});
test("保留操作通知、長名稱、極大金額及安全轉義", () => {
  const p = props(); p.notice = "付款儲存失敗，請重試"; p.stats.pettyCashBalance = 123456789012;
  p.duePayments[0].vendor = "很長的廠商名稱".repeat(12) + "<script>unsafe</script>";
  const before = JSON.stringify(p); const html = render(p);
  assert.ok(html.includes('role="status"')); assert.ok(html.includes(p.notice)); assert.ok(html.includes("123,456,789,012"));
  assert.ok(html.includes("&lt;script&gt;unsafe&lt;/script&gt;")); assert.equal(JSON.stringify(p), before);
});
test("測試頁不匯入正式登入、資料庫或帳務讀寫；正常入口未變", async () => {
  const preview = await readFile(new URL("./previews/billing-overview.jsx", import.meta.url), "utf8");
  const component = await readFile(new URL("../src/BillingOverview.jsx", import.meta.url), "utf8");
  for (const source of [preview, component]) assert.doesNotMatch(source, /supabase|AuthGate|App\.jsx["']|localStorage|fetch\(|persist\./);
  const main = await readFile(new URL("../src/main.jsx", import.meta.url), "utf8");
  assert.ok(main.includes("<AuthGate />"));
});
