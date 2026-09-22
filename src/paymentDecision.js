// 儲存決定成功後才通知財務；測試可注入儲存及傳訊函式，不需寫入正式資料。
export async function savePaymentDecision({ payment, billing, onHold, isAdmin, actor,
  senderId, users, save, send, formatMoney, formatDate }) {
  if (!isAdmin) throw new Error("只有夏碩亞可以操作核准與暫時不發。");
  if (!billing.some((item) => item.id === payment.id)) throw new Error("此款項已不存在，請重新整理資料。");
  if (payment.status === "已付款" || payment.paymentDate) throw new Error("此款項已付款，無法變更發放決定。");
  if (onHold ? payment.paymentOnHold : payment.approved && !payment.paymentOnHold) return "";
  const timestamp = new Date().toISOString();
  const next = billing.map((item) => item.id === payment.id ? {
    ...item, approved: !onHold, paymentOnHold: onHold,
    paymentDecisionBy: actor, paymentDecisionAt: timestamp, updatedAt: timestamp,
    approvedOverdueNotifiedFor: "",
  } : item);
  if (!await save(next)) throw new Error("決定尚未儲存成功，未傳送通知；請確認最新資料後再試。");
  const recipients = users.filter((u) => u.role === "財務" && u.status !== "停用" && u.id !== senderId);
  if (!recipients.length) return "已儲存，但目前沒有可通知的財務人員。";
  const decision = onHold ? "暫時不發" : "已核准";
  const content = `系統通知：公司應付款項${decision}：${payment.no || ""}，${payment.vendor || "（未填廠商／申請人）"}，金額 ${formatMoney(payment.amount)}，預訂付款日 ${payment.plannedPaymentDate ? formatDate(payment.plannedPaymentDate) : "未填"}${onHold ? "，請暫停付款，待重新核准後再發放。" : ""}`;
  try {
    const { error } = await send(recipients.map((u) => ({ sender_id: senderId, recipient_id: u.id, content })));
    if (error) throw error;
  } catch {
    throw new Error(`已儲存「${decision}」，但財務通知傳送失敗，請另行通知財務人員。`);
  }
  return `已設定「${decision}」並通知財務人員。`;
}
