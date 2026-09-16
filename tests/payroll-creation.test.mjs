import test from "node:test";
import assert from "node:assert/strict";
import { createEmployeePayroll, assertSalaryMatches } from "../src/payrollGeneration.js";
import { createPayrollFromLatest } from "../src/payrollCreation.js";

const employee = { id: "a", name: "測試員工", status: "在職", baseSalary: "30000", additions: [{ id: "old", name: "補貼", amount: "1000" }], deductions: [{ name: "扣款", amount: "50" }], laborInsurance: "738", healthInsurance: "458", pensionSelf: "100", advances: [{ amount: "2000", date: "2026-09-01" }] };
let sequence = 0;
const makeId = () => `new-${++sequence}`;
const options = { month: "2026-10", isAdmin: true, makeId };
function mock({ employees = [employee], payroll = [], failRead = false, failSave = false, conflict = false, changeEmployee = false, midReadChange = false } = {}) {
  const calls = [];
  let employeeReads = 0;
  return {
    calls,
    from(table) {
      let key;
      const query = {
        select() { return this; }, eq(_column, value) { key = value; return this; }, order() { return this; },
        async single() {
          if (key === "employees") employeeReads++;
          return { data: { version: key === "employees" ? ((changeEmployee && employeeReads >= 3) || (midReadChange && employeeReads >= 2) ? 2 : 1) : 7 }, error: null };
        },
        async range(from, to) {
          assert.equal(table, "app_records");
          return failRead ? { data: null, error: new Error("offline") } : { data: (key === "employees" ? employees : payroll).slice(from, to + 1).map(value => ({ value })), error: null };
        },
      };
      return query;
    },
    async rpc(name, args) { calls.push({ name, args }); return { data: { success: !conflict, version: 8 }, error: failSave ? new Error("offline") : null }; },
  };
}

test("完整帶入所有數字及項目，包含1000元補貼，且不共用原本項目物件", () => {
  const before = JSON.stringify(employee);
  const row = createEmployeePayroll(employee, "2026-10", makeId);
  assertSalaryMatches(employee, row);
  assert.equal(row.additions[0].amount, 1000);
  assert.equal(row.baseSalary, 30000);
  assert.equal(row.deductions[0].amount, 50);
  assert.equal(row.laborInsurance, 738);
  assert.equal(row.healthInsurance, 458);
  assert.equal(row.pensionSelf, 100);
  assert.equal(row.advances[0].amount, 2000);
  assert.notEqual(row.additions[0].id, employee.additions[0].id);
  row.additions[0].amount = 0;
  assert.throws(() => assertSalaryMatches(employee, row), /不一致/);
  assert.equal(JSON.stringify(employee), before);
});
test("缺省金額為零，兼容舊借支格式；無效數字不得變成零", () => {
  assert.equal(createEmployeePayroll({ advance: "500", advanceDate: "2026-09-01" }, "2026-10", makeId).advances[0].amount, 500);
  assert.equal(createEmployeePayroll({}, "2026-10", makeId).baseSalary, 0);
  assert.throws(() => createEmployeePayroll({ baseSalary: "bad" }, "2026-10", makeId));
});
test("新增使用最新資料來源的完整數字，綁定薪資快照版本儲存", async () => {
  const client = mock();
  const result = await createPayrollFromLatest(client, options);
  assert.equal(result.rows[0].additions[0].amount, 1000);
  assert.equal(result.addedCount, 1);
  assert.equal(client.calls[0].name, "save_app_collection");
  assert.equal(client.calls[0].args.p_expected_version, 7);
  assertSalaryMatches(employee, client.calls[0].args.p_records[0]);
});
test("保留所有既有月份、金額及狀態，不重建同月份既有資料", async () => {
  const old = { id: "old", employeeId: "a", month: "2026-09", baseSalary: 12345, status: "已發放" };
  const client = mock({ payroll: [old] });
  const result = await createPayrollFromLatest(client, options);
  assert.deepEqual(result.rows[0], old);
  const same = mock({ payroll: [{ ...old, month: "2026-10" }] });
  assert.equal((await createPayrollFromLatest(same, options)).addedCount, 0);
  assert.equal(same.calls.length, 0);
});
test("分頁讀取完整人員名單", async () => {
  const client = mock({ employees: Array.from({ length: 1001 }, (_, i) => ({ ...employee, id: String(i) })) });
  assert.equal((await createPayrollFromLatest(client, options)).addedCount, 1001);
});
for (const flag of ["failRead", "changeEmployee", "midReadChange"]) {
  test(`${flag}：不寫入薪資`, async () => {
    const client = mock({ [flag]: true });
    await assert.rejects(createPayrollFromLatest(client, options));
    assert.equal(client.calls.length, 0);
  });
}
for (const flag of ["failSave", "conflict"]) {
  test(`${flag}：不回報儲存成功`, async () => {
    await assert.rejects(createPayrollFromLatest(mock({ [flag]: true }), options));
  });
}
