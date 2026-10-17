export const FORM_STATUSES = ["待處理", "處理中", "已完成"];

export function taipeiMonth(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Taipei", year: "numeric", month: "2-digit" }).formatToParts(date);
  return `${parts.find(p => p.type === "year").value}-${parts.find(p => p.type === "month").value}`;
}

export function filterWebsiteForms(rows, { month = "", status = "全部", type = "全部", keyword = "" } = {}) {
  const query = keyword.trim().toLocaleLowerCase();
  return rows.filter(row => (!month || taipeiMonth(row.receivedAt) === month)
    && (status === "全部" || row.status === status)
    && (type === "全部" || row.type === type)
    && (!query || [row.name, row.company, row.email, row.phone, row.message, row.subject].some(value => String(value || "").toLocaleLowerCase().includes(query))))
    .sort((a, b) => new Date(b.receivedAt) - new Date(a.receivedAt));
}

export function websiteSummary(rows, month) {
  const selected = filterWebsiteForms(rows, { month });
  return { total: selected.length, pending: selected.filter(row => row.status === "待處理").length };
}

export function websiteDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("zh-TW-u-ca-roc", { timeZone: "Asia/Taipei", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }).format(date);
}
