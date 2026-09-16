import test from "node:test";
import assert from "node:assert/strict";
import { savePaymentDecision } from "../src/paymentDecision.js";

function fixture(overrides = {}) {
  const calls = [];
  const payment = { id: "p1", no: "B-115-001", vendor: "測試廠商", amount: 1200,
    plannedPaymentDate: "2026-09-20", status: "未付款", approved: true };
  const other = { id: "other", amount: 500 };
  const args = {
    payment, billing: [payment, other], onHold: true, isAdmin: true,
    actor: "夏碩亞", senderId: "admin", users: [
      { id: "f1", role: "財務", status: "啟用" },
      { id: "f2", role: "財務", status: "啟用" },
      { id: "off", role: "財務", status: "停用" },
      { id: "staff", role: "一般員工" },
      { id: "admin", role: "財務" },
    ],
    save: async (rows) => { calls.push({ type: "save", rows }); return true; },
    send: async (messages) => { calls.push({ type: "send", messages }); return { error: null }; },
    formatMoney: (value) => `NT$ ${value}`, formatDate: () => "115/09/20",
    ...overrides,
  };
  return { args, calls, other };
}

test("暫時不發：先儲存、再通知啟用中的財務，保留其他款項", async () => {
  const { args, calls, other } = fixture();
  assert.match(await savePaymentDecision(args), /已設定「暫時不發」並通知/);
  assert.deepEqual(calls.map((c) => c.type), ["save", "send"]);
  const saved = calls[0].rows[0];
  assert.equal(saved.approved, false);
  assert.equal(saved.paymentOnHold, true);
  assert.equal(saved.paymentDecisionBy, "夏碩亞");
  assert.ok(saved.paymentDecisionAt);
  assert.equal(saved.status, "未付款");
  assert.equal(calls[0].rows[1], other);
  assert.deepEqual(calls[1].messages.map((m) => m.recipient_id), ["f1", "f2"]);
  for (const message of calls[1].messages) {
    assert.equal(message.sender_id, "admin");
    for (const text of ["暫時不發", "B-115-001", "測試廠商", "NT$ 1200", "115/09/20", "請暫停付款"]) {
      assert.ok(message.content.includes(text));
    }
  }
});

test("重新核准：解除暫停並通知財務", async () => {
  const { args, calls } = fixture({ onHold: false });
  args.payment.paymentOnHold = true;
  args.payment.approved = false;
  await savePaymentDecision(args);
  assert.equal(calls[0].rows[0].approved, true);
  assert.equal(calls[0].rows[0].paymentOnHold, false);
  assert.match(calls[1].messages[0].content, /已核准/);
});

test("非管理員、已付款、已填付款日及不存在的款項不可操作", async () => {
  for (const kind of ["unauthorized", "paid", "dated", "missing"]) {
    const { args, calls } = fixture();
    if (kind === "unauthorized") args.isAdmin = false;
    if (kind === "paid") args.payment.status = "已付款";
    if (kind === "dated") args.payment.paymentDate = "2026-09-16";
    if (kind === "missing") args.billing = [];
    await assert.rejects(savePaymentDecision(args));
    assert.equal(calls.length, 0);
  }
});

test("重複暫停或重複核准不重送通知", async () => {
  for (const onHold of [true, false]) {
    const { args, calls } = fixture({ onHold });
    args.payment.paymentOnHold = onHold;
    await savePaymentDecision(args);
    assert.equal(calls.length, 0);
  }
});

test("儲存失敗不得通知財務", async () => {
  const { args, calls } = fixture({ save: async () => false });
  await assert.rejects(savePaymentDecision(args), /尚未儲存成功/);
  assert.equal(calls.length, 0);
});

test("通知錯誤與網路例外均清楚提示：資料已存，但通知失敗", async () => {
  for (const send of [async () => ({ error: new Error("denied") }), async () => { throw new Error("offline"); }]) {
    const { args, calls } = fixture({ send });
    await assert.rejects(savePaymentDecision(args), /已儲存.*通知傳送失敗/);
    assert.equal(calls.length, 1);
    assert.equal(calls[0].type, "save");
  }
});

test("沒有財務帳號時不誤報已通知", async () => {
  const { args, calls } = fixture({ users: [] });
  assert.match(await savePaymentDecision(args), /沒有可通知的財務人員/);
  assert.deepEqual(calls.map((c) => c.type), ["save"]);
});
