import test from "node:test";
import assert from "node:assert/strict";
import { getInvoiceReminders } from "../src/invoiceReminders.js";

const row = (overrides = {}) => ({ id: "i1", no: "INV-001", client: "測試客戶", date: "2026-08-08", dueDate: "", total: 1050, status: "未付款", ...overrides });
const today = "2026-09-23";

test("超過45天才提醒：44、45天不列入，46天列入", () => {
  assert.equal(getInvoiceReminders([row({ date: "2026-08-10" })], today).length, 0);
  assert.equal(getInvoiceReminders([row({ date: "2026-08-09" })], today).length, 0);
  assert.equal(getInvoiceReminders([row()], today)[0].days, 46);
});
test("依入帳日而不是付款狀態判斷，選擇日期消失，取消後重現", () => {
  const invoice = row({ status: "已付款" });
  assert.equal(getInvoiceReminders([invoice], today).length, 1);
  assert.equal(getInvoiceReminders([{ ...invoice, dueDate: today }], today).length, 0);
  assert.equal(getInvoiceReminders([{ ...invoice, dueDate: "" }], today).length, 1);
});
test("跨月、跨年、閏日都按日曆天計算，不漏掉其他月份", () => {
  assert.equal(getInvoiceReminders([row({ date: "2025-12-17" })], "2026-02-01")[0].days, 46);
  assert.equal(getInvoiceReminders([row({ date: "2024-02-29" })], "2024-04-15")[0].days, 46);
});
test("台灣午夜即更新，不需等到UTC換日", () => {
  const invoice = row({ date: "2026-08-09" });
  assert.equal(getInvoiceReminders([invoice], new Date("2026-09-23T15:59:59Z")).length, 0);
  assert.equal(getInvoiceReminders([invoice], new Date("2026-09-23T16:00:00Z"))[0].days, 46);
});
test("作廢、未填開立日、錯誤日期及未來日期不列入", () => {
  for (const invoice of [row({ status: "已作廢" }), ...["", "2026-02-30", "bad", "2027-01-01"].map((date) => row({ date }))]) {
    assert.equal(getInvoiceReminders([invoice], today).length, 0);
  }
});
test("保留客戶與含稅總額，舊資料未存總額時依品項與稅率計算", () => {
  assert.equal(getInvoiceReminders([row()], today)[0].amount, 1050);
  assert.equal(getInvoiceReminders([row({ total: "2400" })], today)[0].amount, 2400);
  assert.equal(getInvoiceReminders([row({ total: 0 })], today)[0].amount, 0);
  const [item] = getInvoiceReminders([row({ total: undefined, items: [{ qty: 2, price: 1000 }], taxRate: 5 })], today);
  assert.equal(item.amount, 2100);
  assert.equal(item.client, "測試客戶");
  assert.equal(item.no, "INV-001");
});
test("等待最久的在前，保留同一客戶的每張發票、不修改原資料", () => {
  const rows = [row(), row({ id: "i2", no: "INV-002", date: "2026-07-01" })];
  const original = structuredClone(rows);
  assert.deepEqual(getInvoiceReminders(rows, today).map((r) => r.id), ["i2", "i1"]);
  assert.deepEqual(rows, original);
  assert.deepEqual(getInvoiceReminders([], today), []);
});
