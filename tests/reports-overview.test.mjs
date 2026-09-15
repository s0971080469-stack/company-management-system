import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

// 只測試報表呈現，不登入、不讀寫公司資料；CSS 由瀏覽器驗證。
const bundled = await build({
  entryPoints: [fileURLToPath(new URL("../src/ReportsOverview.jsx", import.meta.url))],
  bundle: true, platform: "node", format: "cjs", write: false,
  packages: "external", loader: { ".css": "empty" }, logLevel: "silent",
});
const module = { exports: {} };
new Function("require", "module", "exports", bundled.outputFiles[0].text)(createRequire(import.meta.url), module, module.exports);
const ReportsOverview = module.exports.default;

function sampleProps(overrides = {}) {
  return {
    year: "2026", years: ["2026", "2025"], onYearChange: () => {},
    revenueTrend: Array.from({ length: 12 }, (_, index) => ({ month: `${String(index + 1).padStart(2, "0")}月`, 營收: (index + 1) * 10000 })),
    payrollTrend: Array.from({ length: 12 }, (_, index) => ({ month: `${String(index + 1).padStart(2, "0")}月`, 薪資成本: (index + 1) * 5000 })),
    expenseByCategory: [{ name: "清潔用品", value: 20000 }, { name: "薪資", value: 180000 }],
    headcountByDept: [{ dept: "行政部", count: 2 }, { dept: "現場人員", count: 8 }],
    totals: { revenue: 780000, expense: 200000, payroll: 390000 },
    formats: { money: (amount) => `NT$ ${Number(amount).toLocaleString("zh-TW")}`, rocYear: (year) => Number(year) - 1911 },
    ...overrides,
  };
}

function nodes(element) {
  if (element == null || typeof element !== "object") return [];
  if (Array.isArray(element)) return element.flatMap(nodes);
  return [element, ...nodes(element.props?.children)];
}
const render = (props) => renderToStaticMarkup(React.createElement(ReportsOverview, props));

test("保留傳入的三項年度總額，並清楚區分資料來源與目前人數", () => {
  const html = render(sampleProps());
  for (const text of ["780,000", "200,000", "390,000", "帳務入口・收入", "薪資表・全部發放狀態", "不受年度篩選影響", "年度薪資成本"]) assert.ok(html.includes(text), text);
  assert.match(html, /在職員工<\/span><strong>10<small>人/);
});

test("年度選項使用民國年，切換時回傳原西元年份", () => {
  let selected;
  const props = sampleProps({ onYearChange: (value) => { selected = value; } });
  const buttons = nodes(ReportsOverview(props)).filter((node) => node.type === "button");
  assert.equal(buttons.length, 2);
  assert.equal(buttons[0].props["aria-pressed"], true);
  assert.equal(buttons[1].props["aria-pressed"], false);
  assert.deepEqual(buttons[1].props.children, [114, " 年"]);
  buttons[1].props.onClick();
  assert.equal(selected, "2025");
  const next = nodes(ReportsOverview({ ...props, year: selected })).filter((node) => node.type === "button");
  assert.equal(next[1].props["aria-pressed"], true);
});

test("每月明細有完整十二個月與年度合計，不會省略零額月份", () => {
  const props = sampleProps();
  props.revenueTrend[0].營收 = 0;
  const tree = nodes(ReportsOverview(props));
  const body = tree.find((node) => node.type === "tbody");
  const rows = nodes(body).filter((node) => node.type === "tr");
  assert.equal(rows.length, 12);
  const html = render(props);
  assert.ok(html.includes("<th scope=\"row\">1月</th><td>NT$ 0</td>"));
  assert.ok(html.includes("<th scope=\"row\">12月</th>"));
  assert.ok(html.includes("年度合計"));
});

test("分類與部門依金額及人數排序，但不修改傳入資料", () => {
  const props = sampleProps();
  const before = JSON.stringify(props);
  const tree = nodes(ReportsOverview(props));
  const categories = nodes(tree.find((node) => node.props?.className === "reports-category-list")).filter((node) => node.props?.className === "reports-category-name");
  assert.deepEqual(categories.map((node) => node.props.children), ["薪資", "清潔用品"]);
  const departments = nodes(tree.find((node) => node.props?.className === "reports-department-list")).filter((node) => node.props?.className === "reports-department-label");
  assert.deepEqual(departments.map((node) => node.props.children[0].props.children), ["現場人員", "行政部"]);
  assert.equal(JSON.stringify(props), before);
});

test("空資料、零額與負額仍呈現正確金額，不產生無效占比", () => {
  const empty = render(sampleProps({ expenseByCategory: [], headcountByDept: [], totals: { revenue: 0, expense: 0, payroll: 0 } }));
  assert.ok(empty.includes("這個年度尚無支出資料"));
  assert.ok(empty.includes("目前尚無在職員工"));
  for (const value of [0, -100]) {
    const html = render(sampleProps({ expenseByCategory: [{ name: "調整", value }], totals: { revenue: 0, expense: value, payroll: 0 } }));
    assert.ok(html.includes(`NT$ ${value}`));
    assert.ok(html.includes("請依類別金額檢視"));
    assert.ok(!html.includes("reports-share\""));
    assert.ok(!html.includes("NaN") && !html.includes("Infinity"));
  }
});

test("極小占比不誤標為零，長名稱及特殊字元完整保留且安全轉義", () => {
  const name = "跨年度環境維護及清潔用品採購費用 <script>不可執行</script>";
  const html = render(sampleProps({ expenseByCategory: [{ name, value: 1 }, { name: "其他", value: 99999 }], totals: { revenue: 0, expense: 100000, payroll: 0 } }));
  assert.ok(html.includes("&lt;0.1%"));
  assert.ok(html.includes("跨年度環境維護及清潔用品採購費用"));
  assert.ok(html.includes("&lt;script&gt;不可執行&lt;/script&gt;"));
  assert.ok(!html.includes("<script>"));
});
