import test from "node:test";
import assert from "node:assert/strict";
import { invoiceNoticeId, saveInvoiceWithDepositNotice, sendInvoiceNotice, SYSTEM_CHAT_ID, INVOICE_NOTICE_RECIPIENT } from "../src/invoiceDepositNotice.js";

const invoice = { id: "invoice-a", no: "AB12345678", client: "測試客戶", companyName: "測試公司", dueDate: "" };
const options = (overrides = {}) => ({
  previous: invoice, updated: { ...invoice, dueDate: "2026-10-13" }, amount: 10500, actor: "測試操作人",
  save: async () => true, send: async () => ({ error: null }),
  formatMoney: (n) => `NT$ ${n}`, formatDate: () => "115/10/13", ...overrides,
});

test("入帳日確認儲存成功後才傳系統通知給夏碩亞，內容包含完整入帳資訊", async () => {
  const calls = [];
  const result = await saveInvoiceWithDepositNotice(options({
    save: async () => { calls.push("saved"); return true; },
    send: async (message) => {
      assert.deepEqual(calls, ["saved"]);
      assert.equal(message.sender_id, SYSTEM_CHAT_ID);
      assert.equal(message.recipient_id, INVOICE_NOTICE_RECIPIENT);
      for (const text of ["AB12345678", "測試客戶", "測試公司", "10500", "115/10/13", "測試操作人", "已入帳"]) assert.ok(message.content.includes(text));
      calls.push("sent");
      return {};
    },
  }));
  assert.equal(result.notified, true);
  assert.deepEqual(calls, ["saved", "sent"]);
});

test("儲存失敗或發生衝突時不傳訊", async () => {
  let sent = false;
  await assert.rejects(saveInvoiceWithDepositNotice(options({ save: async () => false, send: async () => { sent = true; } })), /未傳送通知/);
  assert.equal(sent, false);
});

test("未變更日期、清空日期不通知；更改日期通知更新", async () => {
  let count = 0;
  const send = async (message) => { count++; assert.ok(message.content.includes("入帳日已更新")); return {}; };
  await saveInvoiceWithDepositNotice(options({ previous: { ...invoice, dueDate: "2026-10-13" }, send }));
  await saveInvoiceWithDepositNotice(options({ updated: invoice, send }));
  assert.equal(count, 0);
  await saveInvoiceWithDepositNotice(options({ previous: { ...invoice, dueDate: "2026-10-12" }, send }));
  assert.equal(count, 1);
});

test("夏碩亞自行操作仍收到系統通知，不會變成自己發給自己的隱藏對話", async () => {
  await saveInvoiceWithDepositNotice(options({ actor: "夏碩亞", send: async (m) => {
    assert.equal(m.recipient_id, "__admin__");
    assert.notEqual(m.sender_id, m.recipient_id);
    assert.ok(m.content.includes("夏碩亞"));
    return {};
  } }));
});

test("傳訊失敗可單獨重送，不重寫發票；相同 ID 重複寫入視為已送達", async () => {
  let saves = 0;
  const result = await saveInvoiceWithDepositNotice(options({ save: async () => { saves++; return true; }, send: async () => ({ error: { code: "offline" } }) }));
  assert.equal(result.notified, false);
  assert.ok(result.pending.id);
  await sendInvoiceNotice(result.pending, async () => ({ error: { code: "23505" } }));
  assert.equal(saves, 1);
  await assert.rejects(sendInvoiceNotice(result.pending, async () => ({ error: new Error("offline") })), /offline/);
});

test("訊息 ID 在重新整理或重試後一致，不同發票或日期不共用", async () => {
  const a = await invoiceNoticeId("invoice-a", "2026-10-13");
  assert.match(a, /^[0-9a-f]{8}-[0-9a-f]{4}-8[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  assert.equal(a, await invoiceNoticeId("invoice-a", "2026-10-13"));
  assert.notEqual(a, await invoiceNoticeId("invoice-b", "2026-10-13"));
  assert.notEqual(a, await invoiceNoticeId("invoice-a", "2026-10-14"));
});
