import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { readFile } from "node:fs/promises";
import { build } from "esbuild";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { contractOverviewFixture } from "./fixtures/contract-overview.js";

const bundle = await build({ entryPoints: [fileURLToPath(new URL("../src/ContractOverview.jsx", import.meta.url))], bundle: true, platform: "node", format: "cjs", write: false, packages: "external", loader: { ".css": "empty" }, logLevel: "silent" });
const module = { exports: {} };
new Function("require", "module", "exports", bundle.outputFiles[0].text)(createRequire(import.meta.url), module, module.exports);
const ContractOverview = module.exports.default;
const props = (year = "2026", mode = "normal") => ({ ...contractOverviewFixture(year, mode), onNew() {}, onYearChange() {} });
const render = p => renderToStaticMarkup(React.createElement(ContractOverview, p));
function nodes(element) {
  if (!element || typeof element !== "object") return [];
  if (Array.isArray(element)) return element.flatMap(nodes);
  return [element, ...nodes(element.props?.children)];
}

test("契約四張統計卡忠實顯示數值與篩選範圍，不改寫資料", () => {
  const p = props(); const before = JSON.stringify(p); const html = render(p);
  assert.equal((html.match(/<article /g) || []).length, 4);
  for (const value of ["契約總數", "115 年度承攬總金額", "48,620,000", "生效中", "30 天內到期", "目前篩選 27 份", "公司與搜尋條件"]) assert.ok(html.includes(value), value);
  assert.equal((html.match(/class="contract-overview-scope">全部契約/g) || []).length, 3);
  assert.equal(JSON.stringify(p), before);
});

test("年度顯示民國年，選擇時回傳原西元年份，新增回呼仍可操作", () => {
  let selected; let created = 0;
  const p = { ...props(), onYearChange: value => { selected = value; }, onNew: () => created++ };
  const buttons = nodes(ContractOverview(p)).filter(node => node.type === "button");
  assert.equal(buttons.length, 5);
  buttons[0].props.onClick(); assert.equal(created, 1);
  buttons[1].props.onClick(); assert.equal(selected, "全部");
  buttons[2].props.onClick(); assert.equal(selected, "2027");
  assert.equal(buttons[3].props["aria-pressed"], true);
  assert.equal(buttons[2].props["aria-pressed"], false);
  assert.ok(render(p).includes("116 年"));
});

test("全部年度與跨年選取保留傳入總額，不做分攤或更改全域件數", () => {
  const all = render(props("全部"));
  assert.ok(all.includes("68,420,000")); assert.ok(all.includes("全部年度"));
  const p = props("2027"); p.totalAmount = 7654321;
  const html = render(p);
  assert.ok(html.includes("116 年度承攬總金額")); assert.ok(html.includes("7,654,321"));
  assert.ok(html.includes("<strong>32</strong>")); assert.ok(html.includes("<strong>26</strong>"));
});

test("空資料仍呈現四張零值卡片，不顯示無效年度篩選", () => {
  const html = render(props("2026", "empty"));
  assert.equal((html.match(/<strong>0<\/strong>/g) || []).length, 4);
  assert.ok(!html.includes("選擇契約年度"));
  assert.ok(!html.includes("NaN")); assert.ok(html.includes("新增契約"));
});

test("多個年度完整保留、大額金額及特殊文字安全顯示", () => {
  const html = render(props("2026", "many"));
  assert.equal((html.match(/aria-pressed=/g) || []).length, 13);
  assert.ok(render(props("2026", "large")).includes("123,456,789,012"));
  assert.ok(render({ ...props(), formatYear: () => '<script>unsafe</script>' }).includes("&lt;script&gt;unsafe&lt;/script&gt;"));
});

test("正式契約頁保留原計算、年度與公司搜尋篩選及新增契約回呼", async () => {
  const source = await readFile(new URL("../src/App.jsx", import.meta.url), "utf8");
  const view = source.slice(source.indexOf("export function ContractsView("), source.indexOf("export function ContractBillingView("));
  assert.ok(view.includes("totalCount={contracts.length}"));
  assert.ok(view.includes("totalAmount={filtered.reduce((s, c) => s + Number(c.amount || 0), 0)}"));
  assert.ok(view.includes('activeCount={contracts.filter((c) => c.status === "生效中").length}'));
  assert.ok(view.includes("expiringCount={contracts.filter(isExpiringSoon).length}"));
  assert.ok(view.includes("onYearChange={setYear}"));
  assert.ok(view.includes('onNew={() => setModal({ mode: "new", data: emptyContract(vendors) })}'));
  assert.ok(view.includes('if (year !== "全部" && !overlapsYear(c, year)) return false;'));
  assert.ok(view.includes('c.contractorCompany === companyFilter'));
  assert.ok(view.includes('includes(query.toLowerCase())'));
});

test("獨立設計預覽不匯入正式資料與登入元件，正式入口不變", async () => {
  for (const file of ["../src/ContractOverview.jsx", "./previews/contract-overview.jsx", "./fixtures/contract-overview.js"]) {
    const source = await readFile(new URL(file, import.meta.url), "utf8");
    assert.doesNotMatch(source, /supabase|AuthGate|App\.jsx["']|localStorage|fetch\(|persist\./);
  }
  const main = await readFile(new URL("../src/main.jsx", import.meta.url), "utf8");
  assert.ok(main.includes("<AuthGate />"));
  const config = await readFile(new URL("../vite.contract-preview.config.js", import.meta.url), "utf8");
  assert.ok(config.includes("envDir: false")); assert.ok(config.includes("publicDir: false"));
});
