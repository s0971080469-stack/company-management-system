import test from "node:test";
import assert from "node:assert/strict";
import { approvePayrollSite, approvePayrollFromLatest, payrollSiteGroups, hasPayrollApproval, payrollNetAmount, payrollReleaseStatus } from "../src/payrollApproval.js";
import { createEmployeePayroll } from "../src/payrollGeneration.js";

const employees = [{ id: "e1", siteName: "公司總部" }, { id: "e2", siteName: "機動組" }];
const row = { id: "a", employeeId: "e1", employeeName: "甲", month: "2026-09", baseSalary: 30000, additions: [{ amount: 1000 }], deductions: [{ amount: 100 }], laborInsurance: 800, healthInsurance: 500, pensionSelf: 100, advances: [{ amount: 2000 }], status: "待發放" };
const sample = [row, { ...row, id: "hold", status: "暫時不發" }, { ...row, id: "paid", status: "已發放" }, { ...row, id: "other", employeeId: "e2" }, { ...row, id: "next", month: "2026-10" }];
const users = [{ id: "f", role: "財務", status: "啟用" }, { id: "f", role: "財務" }, { id: "off", role: "財務", status: "停用" }, { id: "hr", role: "人資" }];
function fixture(overrides = {}) {
  const calls = [], state = {};
  const options = { payroll: sample, employees, users, month: "2026-09", site: "公司總部",
    fingerprint: payrollSiteGroups(sample.filter((r) => r.month === "2026-09"), employees)[0].fingerprint,
    isAdmin: true, actor: "管理員", senderId: "admin", at: "2026-10-14T01:00:00Z",
    save: async (rows) => { calls.push("save"); state.rows = rows; return true; },
    send: async (messages) => { calls.push("send"); state.messages = messages; return { error: null }; }, ...overrides };
  return { options, state, calls };
}
test("批准指定月份案場的待發放薪資，先存後通知；不改實際付款及帳務", async () => {
  const { options, state, calls } = fixture();
  const before = JSON.stringify(sample);
  const result = await approvePayrollSite(options);
  assert.deepEqual(calls, ["save", "send"]);
  assert.equal(state.rows[0].status, "已批准，待發放");
  assert.equal(payrollReleaseStatus(state.rows[0], "公司總部"), "已批准，待發放");
  assert.equal(state.rows[0].posted, undefined);
  assert.equal(state.rows[0].releaseApproval.by, "管理員");
  assert.ok(hasPayrollApproval(state.rows[0], "公司總部"));
  for (let i = 1; i < sample.length; i++) assert.deepEqual(state.rows[i], sample[i]);
  assert.equal(JSON.stringify(sample), before);
  assert.equal(state.messages.length, 1);
  assert.equal(state.messages[0].recipient_id, "f");
  for (const text of ["公司總部", "115 年 9 月", "1 人", "27,500", "核准人：管理員"]) assert.ok(state.messages[0].content.includes(text));
  assert.equal(payrollNetAmount(row), 27500);
  assert.ok(result.changed);
});
test("重新載入後仍識別批准，重複操作不重送通知", async () => {
  const f = fixture(); await approvePayrollSite(f.options);
  const retry = fixture({ payroll: JSON.parse(JSON.stringify(f.state.rows)) });
  assert.equal((await approvePayrollSite(retry.options)).changed, false);
  assert.deepEqual(retry.calls, []);
});
test("編輯金額、加減項、調案場會使舊批准失效", async () => {
  const f = fixture(); await approvePayrollSite(f.options);
  assert.equal(hasPayrollApproval({ ...f.state.rows[0], baseSalary: 31000 }, "公司總部"), false);
  assert.equal(hasPayrollApproval({ ...f.state.rows[0], advances: [] }, "公司總部"), false);
  assert.equal(hasPayrollApproval(f.state.rows[0], "機動組"), false);
  assert.equal(payrollReleaseStatus({ ...f.state.rows[0], baseSalary: 31000 }, "公司總部"), "待批准");
  assert.equal(payrollReleaseStatus(f.state.rows[0], "機動組"), "待批准");
});
test("新建與舊版未批准薪資顯示待批准，已發放和暫時不發不變", () => {
  assert.equal(createEmployeePayroll({ id: "employee" }, "2026-10", () => "test").status, "待批准");
  for (const status of [undefined, "待發放", "待批准", "已批准，待發放"]) {
    assert.equal(payrollReleaseStatus({ ...row, status }, "公司總部"), "待批准");
  }
  for (const status of ["已發放", "暫時不發"]) assert.equal(payrollReleaseStatus({ ...row, status }, "公司總部"), status);
});
test("月別及案場分組採最新人員案場，未分配也可看見", () => {
  const groups = payrollSiteGroups([{ ...row, siteName: "舊案場" }, { ...row, id: "none", employeeId: "gone" }], employees);
  assert.equal(groups[0].site, "公司總部"); assert.equal(groups[1].site, "");
});
for (const options of [{ isAdmin: false }, { month: "" }, { site: "" }, { fingerprint: "舊資料" }]) {
  test(`無權限／無效選取不能批准：${JSON.stringify(options)}`, async () => {
    const f = fixture(options); await assert.rejects(approvePayrollSite(f.options)); assert.deepEqual(f.calls, []);
  });
}
test("儲存失敗或衝突不得送通知", async () => {
  let sent = false;
  const f = fixture({ save: async () => false, send: async () => { sent = true; } });
  await assert.rejects(approvePayrollSite(f.options), /未傳送通知/); assert.equal(sent, false);
});
test("通知失敗明確提示已批准，不冒充傳送成功", async () => {
  const f = fixture({ send: async () => ({ error: new Error("offline") }) });
  const result = await approvePayrollSite(f.options);
  assert.ok(result.changed); assert.match(result.notice, /通知傳送失敗/); assert.ok(f.state.rows[0].releaseApproval);
});
test("沒有有效財務帳號時保留批准並提示人工通知", async () => {
  const f = fixture({ users: [] });
  assert.match((await approvePayrollSite(f.options)).notice, /沒有可通知/); assert.deepEqual(f.calls, ["save"]);
});
function clientMock({ conflict = false, readError = false, employeeChanged = false } = {}) {
  const calls = []; let employeeChecks = 0;
  return { calls, from(table) {
    let key;
    return { select() { return this; }, eq(_col, k) { key = k; return this; }, order() { return this; },
      async single() { if (key === "employees") employeeChecks++; return { data: { version: key === "payroll" ? 7 : employeeChanged && employeeChecks >= 3 ? 2 : 1 } }; },
      async range(from, to) { return readError ? { error: new Error("offline") } : { data: ({ employees, payroll: sample, sys_users: users }[key] || []).slice(from, to + 1).map(value => ({ value })) }; },
      async insert(messages) { assert.equal(table, "chat_messages"); calls.push({ type: "send", messages }); return { error: null }; },
    };
  }, async rpc(name, args) { calls.push({ type: "save", name, args }); return { data: { success: !conflict, version: 8 } }; } };
}
test("實際資料層讀取最新快照，以快照版本條件儲存，更新畫面後才通知", async () => {
  const client = clientMock(); let refreshed = false;
  await approvePayrollFromLatest(client, fixture().options, (result) => { assert.equal(client.calls.length, 1); assert.equal(result.version, 8); refreshed = true; });
  assert.ok(refreshed); assert.equal(client.calls[0].args.p_expected_version, 7); assert.equal(client.calls[1].type, "send");
});
for (const options of [{ conflict: true }, { readError: true }, { employeeChanged: true }]) {
  test(`資料層競態或讀取失敗不能通知：${JSON.stringify(options)}`, async () => {
    const client = clientMock(options);
    await assert.rejects(approvePayrollFromLatest(client, fixture().options));
    assert.ok(client.calls.every((c) => c.type !== "send"));
  });
}
