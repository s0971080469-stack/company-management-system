import test from "node:test";
import assert from "node:assert/strict";
import { filterWebsiteForms, taipeiMonth, websiteSummary, websiteDate } from "../src/websiteManagement.js";
const rows = [
  { id: "a", name: "林小姐", company: "測試公司", status: "待處理", type: "服務詢價", receivedAt: "2026-09-30T16:30:00Z" },
  { id: "b", name: "陳先生", phone: "0912", status: "已完成", type: "聯絡我們", receivedAt: "2026-10-02T10:00:00Z" },
  { id: "c", status: "待處理", type: "聯絡我們", receivedAt: "2026-09-01T10:00:00Z" },
];
test("website month uses Taipei time at UTC month boundary", () => {
  assert.equal(taipeiMonth(rows[0].receivedAt), "2026-10");
  assert.equal(taipeiMonth("invalid"), "");
});
test("website inbox combines filters and sorts newest first without mutating input", () => {
  assert.deepEqual(filterWebsiteForms(rows, { month: "2026-10" }).map(r => r.id), ["b", "a"]);
  assert.deepEqual(filterWebsiteForms(rows, { month: "2026-10", status: "待處理", type: "服務詢價", keyword: "測試" }).map(r => r.id), ["a"]);
  assert.equal(filterWebsiteForms(rows, { keyword: "0912" })[0].id, "b");
  assert.equal(filterWebsiteForms(rows, { keyword: "不存在" }).length, 0);
  assert.equal(rows[0].id, "a");
});
test("website counters use selected month and update after processing", () => {
  assert.deepEqual(websiteSummary(rows, "2026-10"), { total: 2, pending: 1 });
  assert.deepEqual(websiteSummary(rows.map(r => ({ ...r, status: "已完成" })), "2026-10"), { total: 2, pending: 0 });
  assert.deepEqual(websiteSummary([], ""), { total: 0, pending: 0 });
});
test("website timestamps display ROC year and seconds", () => {
  assert.match(websiteDate(rows[0].receivedAt), /115/);
  assert.match(websiteDate(rows[0].receivedAt), /00:30:00/);
  assert.equal(websiteDate("invalid"), "—");
});
