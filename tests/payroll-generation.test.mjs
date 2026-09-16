import test from "node:test";
import assert from "node:assert/strict";
import { nextPayrollMonth, payrollGenerationLocked, generatePayrollForMonth } from "../src/payrollGeneration.js";

const employees = [
  { id: "a", name: "測試甲", status: "在職", baseSalary: 30000, siteName: "案場一" },
  { id: "b", name: "測試乙", status: "在職", baseSalary: 40000, siteName: "案場二" },
  { id: "c", name: "測試丙", status: "離職", baseSalary: 50000, siteName: "案場三" },
];
const createRow = (employee, month) => ({
  id: `${employee.id}-${month}`, employeeId: employee.id, employeeName: employee.name,
  month, baseSalary: employee.baseSalary, status: "待發放", posted: false, paymentDate: "",
});
const generate = (overrides = {}) => generatePayrollForMonth({ payroll: [], employees, month: "2026-09", isAdmin: true, createRow, ...overrides });

test("下月依選取月份計算，支援跨年及補零，不依電腦今天日期", () => {
  assert.equal(nextPayrollMonth("2026-08"), "2026-09");
  assert.equal(nextPayrollMonth("2026-09"), "2026-10");
  assert.equal(nextPayrollMonth("2026-12"), "2027-01");
  assert.equal(nextPayrollMonth("2024-02"), "2024-03");
  assert.equal(nextPayrollMonth("2025-01"), "2025-02");
});

test("空白及不合法月份不允許產生薪資", () => {
  for (const month of ["", null, undefined, "2026-00", "2026-13", "2026-9", "2026-09-01", "0000-01"]) {
    assert.equal(nextPayrollMonth(month), "");
    assert.equal(payrollGenerationLocked([], month, true), true);
    const result = generate({ month });
    assert.equal(result.locked, true);
    assert.equal(result.addedCount, 0);
  }
  assert.equal(nextPayrollMonth("9999-12"), "");
});

test("本月已有薪資不會鎖住尚未產生的下月；非管理員不能重複產生同月份", () => {
  const payroll = [createRow(employees[0], "2026-08")];
  assert.equal(payrollGenerationLocked(payroll, "2026-08", false), true);
  assert.equal(payrollGenerationLocked(payroll, "2026-09", false), false);
  const result = generate({ payroll, isAdmin: false });
  assert.equal(result.addedCount, 2);
  assert.equal(payrollGenerationLocked(result.rows, "2026-09", false), true);
  const again = generate({ payroll: result.rows, isAdmin: false });
  assert.equal(again.rows, result.rows);
  assert.equal(again.locked, true);
});

test("產生下月只增加在職員工的待發放薪資，保留其他月份資料", () => {
  const payroll = [createRow(employees[0], "2026-08")];
  const result = generate({ payroll, month: nextPayrollMonth("2026-08") });
  assert.equal(result.rows[0], payroll[0]);
  assert.equal(result.addedCount, 2);
  assert.deepEqual(result.rows.slice(1).map((row) => [row.employeeId, row.month, row.status, row.posted, row.paymentDate]), [
    ["a", "2026-09", "待發放", false, ""], ["b", "2026-09", "待發放", false, ""],
  ]);
});

test("已發放、待發放、暫時不發及已編輯的薪資均不覆蓋，管理員僅補缺少員工", () => {
  for (const status of ["已發放", "待發放", "暫時不發"]) {
    const existing = { ...createRow(employees[0], "2026-09"), status, baseSalary: 12345, additions: [{ id: "bonus", amount: 678 }], paidBy: "測試操作人", paymentDate: "2026-10-05" };
    const payroll = [existing];
    const before = JSON.stringify(payroll);
    const result = generate({ payroll });
    assert.equal(result.addedCount, 1);
    assert.equal(result.rows[0], existing);
    assert.equal(result.rows[1].employeeId, "b");
    assert.equal(JSON.stringify(payroll), before);
  }
});

test("重複產生不新增第二份，不改動輸入陣列或員工預設資料", () => {
  const before = JSON.stringify(employees);
  const initial = generate();
  const again = generate({ payroll: initial.rows });
  assert.equal(again.addedCount, 0);
  assert.equal(again.rows, initial.rows);
  assert.equal(JSON.stringify(employees), before);
});

test("沒有在職員工時不寫入任何新資料；重複員工ID只建立一次", () => {
  const payroll = [createRow(employees[0], "2026-08")];
  const empty = generate({ payroll, employees: [employees[2]] });
  assert.equal(empty.addedCount, 0);
  assert.equal(empty.rows, payroll);
  const duplicate = generate({ employees: [employees[0], employees[0]] });
  assert.equal(duplicate.addedCount, 1);
});

test("已有下月薪資時，權限判斷依下月全部資料，不受畫面案場或老闆篩選影響", () => {
  const payroll = [createRow(employees[1], "2026-09")];
  assert.equal(payrollGenerationLocked(payroll, "2026-09", false), true);
  const result = generate({ payroll, isAdmin: true });
  assert.equal(result.addedCount, 1);
  assert.equal(result.rows[0], payroll[0]);
  assert.equal(result.rows[1].employeeId, "a");
});
