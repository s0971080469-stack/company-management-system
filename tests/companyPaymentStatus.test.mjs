import test from "node:test";
import assert from "node:assert/strict";
import { normalizeCompanyPaymentStatus as normalize, sumPendingPaymentAmount } from "../src/companyPaymentStatus.js";
import { savePaymentDecision } from "../src/paymentDecision.js";
import { readFile } from "node:fs/promises";

test("待核准且未填付款日的舊已付款紀錄改為未付款，金額與入帳旗標保留", () => {
  const rows = [14000, 35163].map((amount) => ({ expenseType: "公司付款", approved: false, paymentDate: "", status: "已付款", amount, posted: true }));
  const corrected = rows.map(normalize);
  assert.equal(corrected.filter((r) => r.status === "未付款").reduce((s, r) => s + r.amount, 0), 49163);
  assert.ok(corrected.every((r) => r.posted));
  assert.ok(rows.every((r) => r.status === "已付款"));
});

test("已核准、有付款日、管理員明確更改與其他種類紀錄均保留", () => {
  const base = { expenseType: "公司付款", approved: false, paymentDate: "", status: "已付款" };
  for (const extra of [{ approved: true }, { paymentDate: "2026-09-29" }, { paymentStatusOverride: true }, { expenseType: "銀行入帳" }, { expenseType: "零用金" }]) {
    const row = { ...base, ...extra };
    assert.equal(normalize(row), row);
  }
  assert.equal(normalize({ vendor: "舊廠商", status: "已付款" }).status, "未付款");
});

test("未付款金額排除暫時不發及已付款，待核准和已核准未付款仍計入", () => {
  const rows = [
    { status: "未付款", approved: true, amount: 1200 },
    { status: "未付款", approved: false, amount: "800" },
    { status: "未付款", approved: false, paymentOnHold: true, amount: 5000 },
    { status: "未付款", approved: true, paymentOnHold: true, amount: 6000 },
    { status: "已付款", approved: true, amount: 9000 },
  ];
  const before = structuredClone(rows);
  assert.equal(sumPendingPaymentAmount(rows), 2000);
  assert.deepEqual(rows, before);
});

test("舊資料未設暫停旗標仍計入，空清單或全部暫停均為零", () => {
  assert.equal(sumPendingPaymentAmount([{ amount: "300" }, { status: "未付款", paymentOnHold: false, amount: 200 }, { amount: "" }]), 500);
  assert.equal(sumPendingPaymentAmount([]), 0);
  assert.equal(sumPendingPaymentAmount([{ paymentOnHold: true, amount: 5000 }]), 0);
});

test("只加總傳入的月份與公司篩選結果，不計入其他範圍", () => {
  const rows = [
    { companyName: "甲", date: "2026-10-01", amount: 100 },
    { companyName: "甲", date: "2026-10-02", amount: 200, paymentOnHold: true },
    { companyName: "乙", date: "2026-10-01", amount: 300 },
    { companyName: "甲", date: "2026-09-01", amount: 400 },
  ];
  assert.equal(sumPendingPaymentAmount(rows.filter(row => row.companyName === "甲" && row.date.startsWith("2026-10"))), 100);
  assert.equal(sumPendingPaymentAmount(rows), 800);
});

test("沿用實際暫停與重新核准流程，儲存後未付款總額隨之扣除與恢復", async () => {
  let rows = [{ id: "payment-1", status: "未付款", approved: true, amount: 1500 }];
  const decide = onHold => savePaymentDecision({
    payment: rows[0], billing: rows, onHold, isAdmin: true, actor: "測試", senderId: "test-admin", users: [],
    save: async next => { rows = next; return true; },
  });
  assert.equal(sumPendingPaymentAmount(rows), 1500);
  await decide(true);
  assert.equal(sumPendingPaymentAmount(rows), 0);
  assert.equal(rows[0].amount, 1500);
  assert.equal(rows[0].status, "未付款");
  await decide(false);
  assert.equal(sumPendingPaymentAmount(rows), 1500);
});

test("收支管理未付款卡片使用篩選後資料及新的加總規則", async () => {
  const source = await readFile(new URL("../src/App.jsx", import.meta.url), "utf8");
  assert.match(source, /const pendingTotal = sumPendingPaymentAmount\(filtered\);/);
});
