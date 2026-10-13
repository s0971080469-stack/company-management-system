export const SYSTEM_CHAT_ID = "__system__";
export const INVOICE_NOTICE_RECIPIENT = "__admin__"; // 現有聊天室的夏碩亞帳號

export async function invoiceNoticeId(invoiceId, dueDate) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(JSON.stringify(["invoice-deposit", invoiceId, dueDate])));
  const bytes = new Uint8Array(digest).slice(0, 16);
  bytes[6] = (bytes[6] & 15) | 0x80;
  bytes[8] = (bytes[8] & 63) | 0x80;
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export async function sendInvoiceNotice(message, send) {
  const { error } = await send(message);
  // 同張發票、同個入帳日使用同個訊息 ID；重送不產生第二則通知。
  if (error && error.code !== "23505") throw error;
}

export async function saveInvoiceWithDepositNotice({ previous, updated, amount, actor, save, send, formatMoney, formatDate }) {
  if (!await save()) throw new Error("入帳日尚未儲存成功，未傳送通知，請確認最新資料後再試。");
  if (!updated.dueDate || previous.dueDate === updated.dueDate) return { notified: false };
  const message = {
    id: await invoiceNoticeId(updated.id, updated.dueDate),
    sender_id: SYSTEM_CHAT_ID,
    recipient_id: INVOICE_NOTICE_RECIPIENT,
    content: `系統通知：發票${previous.dueDate ? "入帳日已更新" : "已入帳"}\n發票號碼：${updated.no || "未填"}\n開票公司：${updated.companyName || "未填"}\n客戶：${updated.client || "未填"}\n入帳金額（含稅）：${formatMoney(amount)}\n入帳日：${formatDate(updated.dueDate)}\n操作人：${actor}`,
  };
  try {
    await sendInvoiceNotice(message, send);
    return { notified: true };
  } catch {
    return { notified: false, pending: message };
  }
}
