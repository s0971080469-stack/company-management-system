import test from "node:test";
import assert from "node:assert/strict";
import { normalizeCompanyPaymentStatus as normalize } from "../src/companyPaymentStatus.js";

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
