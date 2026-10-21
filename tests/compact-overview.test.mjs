import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = name => readFile(new URL(`../src/${name}`, import.meta.url), "utf8");

test("01–16 的顯示元件全部載入共用精簡標題尺寸", async () => {
  const components = ["DashboardOverview", "WorkforceOverview", "OfficeOverview", "SalesOverview", "BillingOverview", "ContractOverview", "OperationsOverview", "WebsiteManagement", "AdministrationOverview"];
  for (const component of components) {
    assert.match(await read(`${component}.jsx`), /import "\.\/CompactOverview\.css";/, component);
  }
});

test("共用尺寸保留自動增高及手機字級，不套用全域或表格樣式", async () => {
  const css = await read("CompactOverview.css");
  assert.match(css, /min-height: 89px/);
  assert.match(css, /\.overview-dashboard \.overview-header h2 \{\s*font-size: 24px/);
  assert.match(css, /min-height: 98px/);
  assert.match(css, /font-size: 28px/);
  assert.match(css, /font-size: 27px/);
  assert.doesNotMatch(css, /(?:^|[;{\s])(?:height|max-height):\s*(?:89|98)px/);
  assert.doesNotMatch(css, /(?:^|\n)(?:body|button|table|input)\s*\{/);
});

test("總覽僅縮小第一排財務卡；第二排與最近動態的捲軸高度不變", async () => {
  const css = await read("DashboardOverview.css");
  assert.match(css, /\.overview-finance \.overview-money \{ font-size:28px/);
  assert.match(css, /\.overview-finance \.overview-metric \{ padding:8px 16px/);
  assert.match(css, /\.overview-secondary-grid > \.overview-panel \{ height:460px/);
  const overrides = css.split("/* Only the first (finance)")[1].split("@media(prefers-reduced-motion")[0];
  assert.doesNotMatch(overrides, /\.overview-operation|\.overview-panel|\.overview-activity/);
});

test("薪資卡保留已發未發金額說明，網站收件捷徑及狀態仍在標題內", async () => {
  const workforce = await read("WorkforceOverview.jsx");
  assert.match(workforce, /note="不含暫時不發金額"/);
  for (const value of ["formatMoney(totalNet)", "formatMoney(paidNet)", "formatMoney(unpaidNet)"]) assert.ok(workforce.includes(value));
  const website = await read("WebsiteManagement.jsx");
  assert.match(website, /className="wm-heading-side"[^\n]+connectionLabel[^\n]+focusInbox\("待處理"\)/);
});
