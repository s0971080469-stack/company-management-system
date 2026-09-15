// 操作人獨立於建立人，避免把產生薪資表的人誤認為發放或最後編輯的人。
const recordedName = (value) => typeof value === "string" && value.trim() !== "—" ? value.trim() : "";

export function payrollAuditStamp(operator, { paid = false, at = new Date().toISOString() } = {}) {
  const name = recordedName(operator) || "未記錄";
  return {
    updatedAt: at,
    updatedBy: name,
    ...(paid ? { paidAt: at, paidBy: name } : {}),
  };
}

export function payrollActivityActor(row) {
  // 舊資料沒有記下操作者時，不能用 createdBy 或目前登入者推測。
  return recordedName(row.updatedBy) || recordedName(row.paidBy) || "未記錄";
}
