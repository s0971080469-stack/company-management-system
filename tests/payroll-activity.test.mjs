import test from "node:test";
import assert from "node:assert/strict";
import { payrollAuditStamp, payrollActivityActor } from "../src/payrollActivity.js";

const paidAt = "2026-09-15T02:00:00.000Z";
const editedAt = "2026-09-15T03:00:00.000Z";

test("發放時同時保存發放人與最新操作人，並可隨薪資 JSON 保存", () => {
  const row = JSON.parse(JSON.stringify({
    id: "sample-payroll", status: "已發放", baseSalary: 30000,
    ...payrollAuditStamp("測試財務", { paid: true, at: paidAt }),
  }));
  assert.equal(row.paidBy, "測試財務");
  assert.equal(row.paidAt, paidAt);
  assert.equal(row.updatedBy, "測試財務");
  assert.equal(row.updatedAt, paidAt);
  assert.equal(row.baseSalary, 30000);
  assert.equal(payrollActivityActor(row), "測試財務");
});

test("之後編輯顯示最新操作人，但保留原發放人與發放時間", () => {
  const row = {
    ...payrollAuditStamp("測試財務", { paid: true, at: paidAt }),
    ...payrollAuditStamp("測試主管", { at: editedAt }),
  };
  assert.equal(payrollActivityActor(row), "測試主管");
  assert.equal(row.updatedAt, editedAt);
  assert.equal(row.paidBy, "測試財務");
  assert.equal(row.paidAt, paidAt);
});

test("沒有操作者的歷史紀錄不使用建立人冒充", () => {
  assert.equal(payrollActivityActor({ createdBy: "測試建立人" }), "未記錄");
  assert.equal(payrollActivityActor({ updatedBy: "—", paidBy: " " }), "未記錄");
});

test("只有發放人紀錄時仍可顯示，並去除多餘空白", () => {
  assert.equal(payrollActivityActor({ paidBy: " 測試財務 " }), "測試財務");
});

test("一般編輯或暫停發放只留下操作紀錄，不建立發放紀錄", () => {
  const audit = payrollAuditStamp("測試主管", { at: editedAt });
  assert.deepEqual(audit, { updatedAt: editedAt, updatedBy: "測試主管" });
});

test("缺少操作人時明確標示未記錄", () => {
  for (const name of [undefined, null, "", " ", "—"]) {
    assert.equal(payrollAuditStamp(name, { paid: true }).paidBy, "未記錄");
  }
});
