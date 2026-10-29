import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { generatePayrollForMonth } from "../src/payrollGeneration.js";

const source = await readFile(new URL("../src/App.jsx", import.meta.url), "utf8");
const view = source.split("export function EmployeesView")[1].split("function EmployeeForm")[0];
const form = source.split("function EmployeeForm")[1].split("const sumAmounts")[0];

test("人員清單在狀態後顯示離職日，沿用民國日期且在職顯示破折號", () => {
  assert.match(view, /"狀態", "離職日", "所屬案場"/);
  assert.match(view, /e.status === "離職" \? fmtDate\(e.resignationDate\) : "—"/);
  assert.match(view, /\.\.\.data,/); // save preserves the newly selected field and all existing employee fields
});
test("離職才展開日期欄位，舊資料空值相容且保存完整表單", () => {
  assert.match(form, /f.status === "離職" &&/);
  assert.match(form, /type="date" value=\{f.resignationDate \|\| ""\} onChange=\{set\("resignationDate"\)\}/);
  assert.match(form, /onSave\(f\)/);
});
test("新增離職日不改變薪資規則，不刪除既有月份或替離職員工新增", () => {
  const existing = { id: "old", employeeId: "left", month: "2026-11" };
  const result = generatePayrollForMonth({ payroll: [existing], employees: [
    { id: "left", status: "離職", resignationDate: "2026-10-29" },
    { id: "active", status: "在職" },
  ], month: "2026-11", isAdmin: true, createRow: e => ({ employeeId: e.id, month: "2026-11" }) });
  assert.equal(result.rows[0], existing);
  assert.equal(result.addedCount, 1);
  assert.equal(result.rows[1].employeeId, "active");
});
